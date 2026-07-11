import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { useAuthStore } from "@/stores/authStore"
import "./index.css"
import App from "./App"
import { useServiceWorker } from "@/hooks/useServiceWorker"

// Load auth state from localStorage on startup
useAuthStore.getState().loadFromStorage()

// React Query client configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
})

// Register PWA service worker
function PWABootstrap() {
  useServiceWorker()
  return null
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <PWABootstrap />
      <App />
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  </StrictMode>
)

// 安全清理：React 挂载后移除内联加载器（防止残留）
setTimeout(() => {
  const loader = document.getElementById("initial-loader")
  if (loader) {
    loader.classList.add("hidden")
    setTimeout(() => loader.remove(), 500)
  }
}, 100)
