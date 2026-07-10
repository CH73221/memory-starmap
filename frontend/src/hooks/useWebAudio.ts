import { useEffect, useRef, useState, useCallback } from "react"

/**
 * 使用 Web Audio API 生成白噪声
 * 类型：rain / forest / cafe / white / none
 */
export type AmbientType = "none" | "white" | "rain" | "forest" | "cafe"

export interface UseWebAudioReturn {
  isPlaying: boolean
  currentType: AmbientType
  volume: number
  play: (type: AmbientType) => void
  stop: () => void
  setVolume: (v: number) => void
}

const NOISE_CONFIGS: Record<Exclude<AmbientType, "none">, {
  filterFreq: number
  filterQ: number
  lfoFreq: number
  lfoDepth: number
  noiseType: "white" | "pink"
  volume: number
}> = {
  white: { filterFreq: 8000, filterQ: 0.7, lfoFreq: 0, lfoDepth: 0, noiseType: "white", volume: 0.15 },
  rain: { filterFreq: 1200, filterQ: 0.5, lfoFreq: 0.3, lfoDepth: 200, noiseType: "pink", volume: 0.4 },
  forest: { filterFreq: 4000, filterQ: 1.2, lfoFreq: 0.15, lfoDepth: 800, noiseType: "pink", volume: 0.25 },
  cafe: { filterFreq: 2500, filterQ: 0.8, lfoFreq: 0.4, lfoDepth: 400, noiseType: "pink", volume: 0.3 },
}

function createNoiseBuffer(audioContext: AudioContext, type: "white" | "pink"): AudioBuffer {
  const sampleRate = audioContext.sampleRate
  const length = sampleRate * 4
  const buffer = audioContext.createBuffer(1, length, sampleRate)
  const data = buffer.getChannelData(0)

  if (type === "white") {
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5
    }
  } else {
    // Pink noise via Voss-McCartney algorithm
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1
      b0 = 0.99886 * b0 + white * 0.0555179
      b1 = 0.99332 * b1 + white * 0.0750759
      b2 = 0.96900 * b2 + white * 0.1538520
      b3 = 0.86650 * b3 + white * 0.3104856
      b4 = 0.55000 * b4 + white * 0.5329522
      b5 = -0.7616 * b5 - white * 0.0168980
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11
      b6 = white * 0.115926
    }
  }
  return buffer
}

export function useWebAudio(): UseWebAudioReturn {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentType, setCurrentType] = useState<AmbientType>("none")
  const [volume, setVolumeState] = useState(0.5)

  const ctxRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<AudioBufferSourceNode | null>(null)
  const filterRef = useRef<BiquadFilterNode | null>(null)
  const lfoRef = useRef<OscillatorNode | null>(null)
  const lfoGainRef = useRef<GainNode | null>(null)
  const gainRef = useRef<GainNode | null>(null)

  const ensureContext = useCallback(() => {
    if (!ctxRef.current) {
      try {
        ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      } catch (e) {
        console.error("Web Audio API not supported", e)
        return null
      }
    }
    return ctxRef.current
  }, [])

  const stop = useCallback(() => {
    try {
      if (sourceRef.current) { sourceRef.current.stop(); sourceRef.current.disconnect(); sourceRef.current = null }
      if (lfoRef.current) { lfoRef.current.stop(); lfoRef.current.disconnect(); lfoRef.current = null }
      if (lfoGainRef.current) { lfoGainRef.current.disconnect(); lfoGainRef.current = null }
      if (filterRef.current) { filterRef.current.disconnect(); filterRef.current = null }
      if (gainRef.current) { gainRef.current.disconnect(); gainRef.current = null }
    } catch (e) { /* ignore */ }
    setIsPlaying(false)
  }, [])

  const play = useCallback((type: AmbientType) => {
    if (type === "none") {
      stop()
      setCurrentType("none")
      return
    }
    const ctx = ensureContext()
    if (!ctx) return

    stop()
    if (ctx.state === "suspended") ctx.resume()

    const config = NOISE_CONFIGS[type]
    const buffer = createNoiseBuffer(ctx, config.noiseType)

    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.loop = true

    const filter = ctx.createBiquadFilter()
    filter.type = "lowpass"
    filter.frequency.value = config.filterFreq
    filter.Q.value = config.filterQ

    const gain = ctx.createGain()
    gain.gain.value = config.volume * volume

    source.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)
    source.start()

    if (config.lfoFreq > 0) {
      const lfo = ctx.createOscillator()
      lfo.frequency.value = config.lfoFreq
      const lfoGain = ctx.createGain()
      lfoGain.gain.value = config.lfoDepth
      lfo.connect(lfoGain)
      lfoGain.connect(filter.frequency)
      lfo.start()
      lfoRef.current = lfo
      lfoGainRef.current = lfoGain
    }

    sourceRef.current = source
    filterRef.current = filter
    gainRef.current = gain

    setCurrentType(type)
    setIsPlaying(true)
  }, [ensureContext, stop, volume])

  const setVolume = useCallback((v: number) => {
    setVolumeState(v)
    if (gainRef.current && ctxRef.current && currentType !== "none") {
      const config = NOISE_CONFIGS[currentType as Exclude<AmbientType, "none">]
      if (config) gainRef.current.gain.setTargetAtTime(config.volume * v, ctxRef.current.currentTime, 0.05)
    }
  }, [currentType])

  useEffect(() => {
    return () => {
      stop()
      if (ctxRef.current) ctxRef.current.close().catch(() => {})
    }
  }, [stop])

  return { isPlaying, currentType, volume, play, stop, setVolume }
}