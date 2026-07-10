import { useState, useEffect, useCallback, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { materialService } from "@/services/materialService"
import { flashcardService } from "@/services/flashcardService"
import type { Material } from "@/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { FadeIn } from "@/components/ui/page-transition"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/toast"
import {
  Upload, FileText, Image, File, Trash2, Brain, Loader2, BookOpen, Sparkles,
  Clock, CheckCircle2, AlertCircle, Play, Zap,
} from "lucide-react"
import { cn, formatRelativeDate } from "@/lib/utils"

// Processing stages
const PROCESSING_STAGES = [
  { key: "pending", label: "等待处理", icon: Clock },
  { key: "extracting", label: "文本解析中...", icon: FileText },
  { key: "extracting_kp", label: "AI 提取知识点...", icon: Brain },
  { key: "generating_graph", label: "生成知识图谱...", icon: Sparkles },
  { key: "generating_cards", label: "生成闪卡...", icon: Zap },
  { key: "completed", label: "完成！", icon: CheckCircle2 },
]

function getStageIndex(status: string): number {
  const stageMap: Record<string, number> = {
    pending: 0,
    extracting: 1,
    generating: 3,
    completed: 5,
    failed: -1,
  }
  return stageMap[status] ?? 0
}

function getEstimatedTime(status: string): string {
  const timeMap: Record<string, string> = {
    pending: "预计 1-2 分钟",
    extracting: "预计 30-60 秒",
    generating: "预计 1-2 分钟",
  }
  return timeMap[status] || ""
}

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [uploadTitle, setUploadTitle] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [processingMaterial, setProcessingMaterial] = useState<Material | null>(null)
  const [currentStage, setCurrentStage] = useState(0)
  const prevStatusRef = useRef<Record<number, string>>({})
  const materialsRef = useRef<Material[]>([])
  const processingMaterialRef = useRef<Material | null>(null)
  const pollCountRef = useRef(0)
  const { addToast } = useToast()
  const navigate = useNavigate()

  useEffect(() => { loadMaterials() }, [])

  // Poll for status updates of processing materials — 使用渐进式退避优化
  // 用 ref 避免 materials 变化导致 effect 重建（否则每次轮询都重建定时器，退避失效）
  useEffect(() => {
    // Keep refs in sync with state
    materialsRef.current = materials
    processingMaterialRef.current = processingMaterial

    const hasProcessing = materials.some(m =>
      m.status === "pending" || m.status === "extracting" || m.status === "generating"
    )

    if (!hasProcessing) { pollCountRef.current = 0; return }

    let interval: ReturnType<typeof setInterval>

    const poll = async () => {
      try {
        const data = await materialService.list()
        const newMaterials = data.items

        // Check for status changes from processing to completed
        newMaterials.forEach(m => {
          const prevStatus = prevStatusRef.current[m.id]
          if (prevStatus && prevStatus !== m.status) {
            // Detect completion
            if ((prevStatus === "extracting" || prevStatus === "generating" || prevStatus === "pending") && m.status === "completed") {
              addToast({
                title: "闪卡生成完成",
                description: `「${m.title}」已生成 ${m.flashcard_count || m.knowledge_point_count || 0} 张闪卡`,
                variant: "success",
              })
            }
            // Detect failure
            if (m.status === "failed" && prevStatus !== "failed") {
              addToast({
                title: "处理失败",
                description: `「${m.title}」处理失败，请重试`,
                variant: "error",
              })
            }
          }
          prevStatusRef.current[m.id] = m.status
        })

        setMaterials(newMaterials)

        // Update processing material view from ref
        const pm = processingMaterialRef.current
        if (pm) {
          const updated = newMaterials.find(m => m.id === pm.id)
          if (updated) {
            setProcessingMaterial(updated)
            setCurrentStage(getStageIndex(updated.status))
            if (updated.status === "completed" || updated.status === "failed") {
              // Auto close after a delay
              setTimeout(() => setProcessingMaterial(null), 3000)
            }
          }
        }

        // 渐进式退避：前5次快速轮询(2s)，之后降为5s — 用 ref 持久化计数
        pollCountRef.current++
        const nextDelay = pollCountRef.current < 5 ? 2000 : 5000
        clearInterval(interval)
        interval = setInterval(poll, nextDelay)
      } catch (e) {
        console.error(e)
      }
    }

    interval = setInterval(poll, 2000)

    return () => clearInterval(interval)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadMaterials = async () => {
    try {
      const data = await materialService.list()
      setMaterials(data.items)
      // Initialize prev status tracking
      data.items.forEach(m => {
        prevStatusRef.current[m.id] = m.status
      })
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
    if (!uploadTitle) setUploadTitle(file.name.replace(/\.[^/.]+$/, ""))
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }, [])

  const handleUpload = async () => {
    if (!selectedFile || !uploadTitle.trim()) return
    setUploading(true)
    try {
      const newMaterial = await materialService.upload(selectedFile, uploadTitle.trim())
      setUploadDialogOpen(false); setSelectedFile(null); setUploadTitle("")
      addToast({ title: "上传成功", description: "AI 正在解析资料，请稍候...", variant: "success" })
      // Show processing progress
      setProcessingMaterial(newMaterial)
      setCurrentStage(0)
      prevStatusRef.current[newMaterial.id] = newMaterial.status
      loadMaterials()
    } catch (e) {
      addToast({ title: "上传失败", description: "请重试", variant: "error" })
    } finally { setUploading(false) }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("确定要删除这份资料吗？相关的知识点和闪卡也会被删除。")) return
    try {
      await materialService.delete(id)
      setMaterials(prev => prev.filter(m => m.id !== id))
      addToast({ title: "删除成功", variant: "success" })
    } catch (e) { addToast({ title: "删除失败", variant: "error" }) }
  }

  const handleGenerateFlashcards = async (materialId: number) => {
    try {
      await flashcardService.generate(materialId)
      addToast({ title: "闪卡生成已开始", description: "请稍后在闪卡复习页面查看", variant: "success" })
      // Update local status
      setMaterials(prev => prev.map(m =>
        m.id === materialId ? { ...m, status: "generating" as const } : m
      ))
    } catch (e) { addToast({ title: "生成失败", variant: "error" }) }
  }

  const handleReviewNow = (materialId: number) => {
    navigate("/app/review")
  }

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case "pdf": return <FileText className="w-5 h-5 text-error" />
      case "image": return <Image className="w-5 h-5 text-ink-600" />
      default: return <File className="w-5 h-5 text-ink-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="success" className="rounded-md">
          <CheckCircle2 className="w-3 h-3 mr-1" />已完成
        </Badge>
      case "generating":
        return <Badge className="rounded-md bg-ink-100 text-ink-700">
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />生成中
        </Badge>
      case "extracting":
        return <Badge className="rounded-md bg-ink-100 text-ink-700">
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />解析中
        </Badge>
      case "pending":
        return <Badge variant="secondary" className="rounded-md">
          <Clock className="w-3 h-3 mr-1" />待处理
        </Badge>
      case "failed":
        return <Badge variant="destructive" className="rounded-md">
          <AlertCircle className="w-3 h-3 mr-1" />失败
        </Badge>
      default:
        return <Badge variant="outline" className="rounded-md">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center"><Skeleton className="h-8 w-32" /><Skeleton className="h-10 w-28" /></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Card key={i}><CardContent className="p-6"><Skeleton className="h-6 w-48 mb-3" /><Skeleton className="h-4 w-full mb-2" /><Skeleton className="h-4 w-3/4" /></CardContent></Card>)}
        </div>
      </div>
    )
  }

  const isProcessing = (status: string) =>
    status === "pending" || status === "extracting" || status === "generating"

  return (
    <div className="space-y-6">
      <FadeIn className="spring-enter">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-display text-ink-800">学习资料</h1>
            <p className="text-ink-500 mt-1 font-sans text-sm">上传笔记，AI 自动提取知识点</p>
          </div>
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-lg shimmer-overlay">
                <Upload className="w-4 h-4 mr-2" /> 上传资料
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-xl bg-white border-border p-0 max-w-md">
              <DialogHeader className="p-6 pb-2">
                <DialogTitle className="text-ink-800 font-display text-xl">上传学习资料</DialogTitle>
                <DialogDescription className="text-ink-500">支持 PDF、图片、纯文本文件</DialogDescription>
              </DialogHeader>
              <div className="px-6 space-y-4">
                <div className="space-y-2">
                  <Label className="text-ink-600 text-sm font-medium">资料标题</Label>
                  <Input placeholder="例如：线性代数第三章笔记" value={uploadTitle} onChange={e => setUploadTitle(e.target.value)} className="rounded-lg" />
                </div>
                <div
                  className={cn(
                    "border-2 border-dashed rounded-xl p-8 text-center transition-colors duration-200",
                    dragOver ? "border-ink-700 bg-ink-50" : "border-paper-300 hover:border-ink-400 bg-paper-50"
                  )}
                  onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                >
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-3">
                      {getFileIcon(selectedFile.name.split(".").pop() || "")}
                      <div>
                        <p className="font-medium text-ink-800">{selectedFile.name}</p>
                        <p className="text-sm text-ink-400">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedFile(null)} className="rounded-lg">更换</Button>
                    </div>
                  ) : (
                    <div>
                      <Upload className={cn("w-10 h-10 mx-auto mb-3 text-ink-400 transition-colors", dragOver && "text-ink-700")} />
                      <p className="text-ink-500 mb-1">拖拽文件到此处，或</p>
                      <label className="cursor-pointer">
                        <span className="text-ink-800 hover:text-ink-900 font-semibold transition-colors underline underline-offset-2">点击选择文件</span>
                        <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.txt,.md" onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f) }} />
                      </label>
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter className="p-6 pt-2">
                <Button variant="outline" onClick={() => setUploadDialogOpen(false)} className="rounded-lg">取消</Button>
                <Button onClick={handleUpload} disabled={!selectedFile || !uploadTitle.trim() || uploading} className="rounded-lg">
                  {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                  {uploading ? "上传中..." : "上传并解析"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </FadeIn>

      {/* Processing Progress Modal */}
      {processingMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-lg border border-border max-w-md w-full overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-lg bg-ink-50 border border-border flex items-center justify-center">
                  <Brain className="w-6 h-6 text-ink-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-ink-800 truncate font-display">{processingMaterial.title}</h3>
                  <p className="text-sm text-ink-500">AI 正在处理中...</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-ink-500">处理进度</span>
                  <span className="font-semibold text-ink-800">
                    {Math.round((currentStage / (PROCESSING_STAGES.length - 1)) * 100)}%
                  </span>
                </div>
                <Progress value={(currentStage / (PROCESSING_STAGES.length - 1)) * 100} className="h-2" />
              </div>

              {/* Stage list */}
              <div className="space-y-1">
                {PROCESSING_STAGES.map((stage, i) => {
                  const Icon = stage.icon
                  const isCompleted = i < currentStage
                  const isCurrent = i === currentStage && processingMaterial.status !== "completed" && processingMaterial.status !== "failed"
                  const isFailed = processingMaterial.status === "failed" && i === currentStage

                  return (
                    <div
                      key={stage.key}
                      className={cn(
                        "flex items-center gap-3 p-2.5 rounded-lg transition-colors",
                        isCompleted && "bg-success-bg",
                        isCurrent && !isFailed && "bg-ink-50",
                        isFailed && "bg-error-bg",
                        !isCompleted && !isCurrent && !isFailed && "opacity-50"
                      )}
                    >
                      <div className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center shrink-0",
                        isCompleted && "bg-success text-white",
                        isCurrent && !isFailed && "bg-ink-700 text-white",
                        isFailed && "bg-error text-white",
                        !isCompleted && !isCurrent && !isFailed && "bg-paper-200 text-ink-400"
                      )}>
                        {isCompleted ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : isFailed ? (
                          <AlertCircle className="w-4 h-4" />
                        ) : (
                          <Icon className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <span className={cn(
                        "text-sm font-medium flex-1",
                        isCompleted && "text-success",
                        isCurrent && !isFailed && "text-ink-800",
                        isFailed && "text-error",
                        !isCompleted && !isCurrent && !isFailed && "text-ink-400"
                      )}>
                        {stage.label}
                      </span>
                      {isCurrent && !isFailed && (
                        <Loader2 className="w-4 h-4 text-ink-700 animate-spin" />
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Completion state */}
              {processingMaterial.status === "completed" && (
                <div className="mt-6 pt-4 border-t border-border">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-ink-500">提取知识点</span>
                    <span className="text-sm font-bold text-success">
                      {processingMaterial.knowledge_point_count || 0} 个
                    </span>
                  </div>
                  <Button
                    onClick={() => handleReviewNow(processingMaterial.id)}
                    className="w-full rounded-lg"
                  >
                    <Play className="w-4 h-4 mr-2" /> 立即复习
                  </Button>
                </div>
              )}

              {processingMaterial.status !== "completed" && processingMaterial.status !== "failed" && (
                <div className="mt-4 text-center">
                  <p className="text-xs text-ink-400">
                    {getEstimatedTime(processingMaterial.status)}
                  </p>
                  <button
                    onClick={() => setProcessingMaterial(null)}
                    className="text-xs text-ink-600 hover:text-ink-800 mt-2 font-medium transition-colors underline underline-offset-2"
                  >
                    后台继续处理
                  </button>
                </div>
              )}

              {processingMaterial.status === "failed" && (
                <div className="mt-4">
                  <p className="text-sm text-error mb-3 text-center">
                    {processingMaterial.error_message || "处理过程中出现错误，请重试"}
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setProcessingMaterial(null)}
                    className="w-full rounded-lg"
                  >
                    关闭
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {materials.length === 0 ? (
        <FadeIn>
          <Card className="text-center py-16 border-dashed border-paper-300 bg-white">
            <CardContent>
              <BookOpen className="w-14 h-14 mx-auto text-ink-300 mb-4" />
              <h3 className="text-lg font-semibold text-ink-800 mb-2 font-display">还没有学习资料</h3>
              <p className="text-ink-500 mb-6 text-sm">上传你的第一份笔记，让 AI 帮你构建知识体系</p>
              <Button onClick={() => setUploadDialogOpen(true)} className="rounded-lg">
                <Upload className="w-4 h-4 mr-2" /> 上传资料
              </Button>
            </CardContent>
          </Card>
        </FadeIn>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {materials.map((m, i) => (
            <div key={m.id} className="stagger-item" style={{ animationDelay: `${i * 80}ms` }}>
              <MaterialCard
                material={m}
                onDelete={() => handleDelete(m.id)}
                onGenerate={() => handleGenerateFlashcards(m.id)}
                onReview={() => handleReviewNow(m.id)}
                onViewProgress={() => {
                  setProcessingMaterial(m)
                  setCurrentStage(getStageIndex(m.status))
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function MaterialCard({
  material,
  onDelete,
  onGenerate,
  onReview,
  onViewProgress,
}: {
  material: Material
  onDelete: () => void
  onGenerate: () => void
  onReview: () => void
  onViewProgress: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const isProcessing = material.status === "pending" || material.status === "extracting" || material.status === "generating"
  const progressValue = material.processing_stage
    ? (material.processing_stage / 5) * 100
    : isProcessing ? 30 : material.status === "completed" ? 100 : 0

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case "pdf": return <FileText className="w-5 h-5 text-error" />
      case "image": return <Image className="w-5 h-5 text-ink-600" />
      default: return <File className="w-5 h-5 text-ink-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="success" className="rounded-md shrink-0">
          <CheckCircle2 className="w-3 h-3 mr-1" />已完成
        </Badge>
      case "generating":
        return <Badge className="rounded-md bg-ink-100 text-ink-700 shrink-0">
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />生成中
        </Badge>
      case "extracting":
        return <Badge className="rounded-md bg-ink-100 text-ink-700 shrink-0">
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />解析中
        </Badge>
      case "pending":
        return <Badge variant="secondary" className="rounded-md shrink-0">
          <Clock className="w-3 h-3 mr-1" />待处理
        </Badge>
      case "failed":
        return <Badge variant="destructive" className="rounded-md shrink-0">
          <AlertCircle className="w-3 h-3 mr-1" />失败
        </Badge>
      default:
        return <Badge variant="outline" className="rounded-md shrink-0">{status}</Badge>
    }
  }

  return (
    <Card
      className={cn(
        "bg-white border-border shadow-sm hover:shadow-md transition-shadow duration-200 group h-full relative",
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-paper-100 border border-border flex items-center justify-center shrink-0">
              {getFileIcon(material.file_type)}
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base text-ink-800 truncate font-display">{material.title}</CardTitle>
              <CardDescription className="mt-0.5 text-ink-400 text-xs">
                {formatRelativeDate(material.created_at)}
              </CardDescription>
            </div>
          </div>
          {getStatusBadge(material.status)}
        </div>
      </CardHeader>
      <CardContent>
        {material.summary && <p className="text-sm text-ink-500 mb-4 line-clamp-3 leading-relaxed">{material.summary}</p>}

        {/* Progress bar for processing */}
        {isProcessing && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-[10px] text-ink-400 mb-1">
              <span>{material.status === "extracting" ? "正在解析..." : "正在生成闪卡..."}</span>
              <span>{getEstimatedTime(material.status)}</span>
            </div>
            <Progress value={progressValue} className="h-1.5" />
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-sm text-ink-500">
            <Brain className="w-4 h-4" /> {material.knowledge_point_count || 0} 知识点
          </span>
          <div className="flex items-center gap-1">
            {material.status === "completed" && (
              <>
                <Button variant="ghost" size="sm" onClick={onReview} title="立即复习" className="rounded-lg hover:bg-ink-50">
                  <Play className="w-4 h-4 text-ink-700" />
                </Button>
                <Button variant="ghost" size="sm" onClick={onGenerate} title="生成闪卡" className="rounded-lg hover:bg-amber-bg">
                  <Sparkles className="w-4 h-4 text-amber" />
                </Button>
              </>
            )}
            {isProcessing && (
              <Button variant="ghost" size="sm" onClick={onViewProgress} title="查看进度" className="rounded-lg hover:bg-ink-50">
                <Clock className="w-4 h-4 text-ink-600" />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onDelete} title="删除" className="rounded-lg hover:bg-error-bg">
              <Trash2 className="w-4 h-4 text-error" />
            </Button>
          </div>
        </div>
      </CardContent>

      {/* Hover tooltip with estimated time */}
      {isProcessing && hovered && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full px-3 py-1.5 bg-white border border-border text-ink-700 text-xs rounded-lg shadow-md z-10 whitespace-nowrap">
          {getEstimatedTime(material.status)}
          <div className="absolute left-1/2 -translate-x-1/2 top-full border-4 border-transparent border-t-white" />
        </div>
      )}
    </Card>
  )
}
