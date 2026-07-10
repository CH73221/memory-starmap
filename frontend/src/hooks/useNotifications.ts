import { useEffect, useState } from "react"

interface NotificationState {
  permission: NotificationPermission | "unsupported"
  supported: boolean
  subscribed: boolean
}

export function useNotifications() {
  const [state, setState] = useState<NotificationState>({
    permission: "default",
    supported: false,
    subscribed: false,
  })

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setState({ permission: "unsupported", supported: false, subscribed: false })
      return
    }

    const subscribed = localStorage.getItem("notifications_subscribed") === "true"
    setState({
      permission: Notification.permission,
      supported: true,
      subscribed,
    })
  }, [])

  const requestPermission = async (): Promise<boolean> => {
    if (!("Notification" in window)) return false
    try {
      const permission = await Notification.requestPermission()
      const ok = permission === "granted"
      if (ok) localStorage.setItem("notifications_subscribed", "true")
      setState({ permission, supported: true, subscribed: ok })
      return ok
    } catch {
      return false
    }
  }

  const notify = (title: string, options?: NotificationOptions) => {
    if (!("Notification" in window)) return
    if (Notification.permission !== "granted") return
    new Notification(title, {
      icon: "/icons/icon-192.svg",
      badge: "/icons/icon-192.svg",
      ...options,
    })
  }

  // Schedule review reminders
  const scheduleDailyReminder = (hour = 20, minute = 0) => {
    const now = new Date()
    const next = new Date()
    next.setHours(hour, minute, 0, 0)
    if (next <= now) next.setDate(next.getDate() + 1)
    const delay = next.getTime() - now.getTime()

    setTimeout(() => {
      notify("⏰ 该复习了！", {
        body: "今天还有闪卡待复习，保持连续学习节奏",
        tag: "daily-review-reminder",
      })
      // Reschedule for next day
      scheduleDailyReminder(hour, minute)
    }, delay)
  }

  return { ...state, requestPermission, notify, scheduleDailyReminder }
}