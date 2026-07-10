import * as React from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

interface Toast {
  id: string
  title?: string
  description?: string
  variant?: "default" | "success" | "error"
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, "id">) => void
  removeToast: (id: string) => void
}

const ToastContext = React.createContext<ToastContextType | null>(null)

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) throw new Error("useToast must be used within a ToastProvider")
  return context
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])
  const addToast = React.useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { ...toast, id }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000)
  }, [])
  const removeToast = React.useCallback((id: string) => { setToasts((prev) => prev.filter((t) => t.id !== id)) }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <Toaster />
    </ToastContext.Provider>
  )
}

function Toaster() {
  const { toasts, removeToast } = useToast()
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => (
        <div key={toast.id} className={cn(
          "w-72 rounded-lg border p-4 shadow-lg transition-all animate-in slide-in-from-right-full",
          toast.variant === "success" && "border-success/20 bg-success/5",
          toast.variant === "error" && "border-error/20 bg-error/5",
          !toast.variant && "border-paper-300 bg-white"
        )}>
          <div className="flex items-start justify-between">
            <div>
              {toast.title && <p className="font-medium text-sm">{toast.title}</p>}
              {toast.description && <p className="text-sm text-muted-foreground mt-1">{toast.description}</p>}
            </div>
            <button onClick={() => removeToast(toast.id)} className="ml-2 shrink-0"><X className="h-4 w-4 text-muted-foreground" /></button>
          </div>
        </div>
      ))}
    </div>
  )
}

export { Toaster }
export type { Toast }
