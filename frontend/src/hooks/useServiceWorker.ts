import { useEffect, useState } from "react"

// Register service worker on mount
export function useServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator && import.meta.env.PROD) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").then(
          (reg) => {
            console.log("[PWA] Service worker registered:", reg.scope)
          },
          (err) => console.warn("[PWA] Registration failed:", err)
        )
      })
    }
  }, [])
}

// Detect online/offline status
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true)
  useEffect(() => {
    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)
    window.addEventListener("online", goOnline)
    window.addEventListener("offline", goOffline)
    return () => {
      window.removeEventListener("online", goOnline)
      window.removeEventListener("offline", goOffline)
    }
  }, [])
  return online
}