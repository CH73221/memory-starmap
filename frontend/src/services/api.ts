import axios from "axios"

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
})

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 排除登录/注册端点：这些端点的 401 是正常的业务错误（密码错误等），
      // 不应触发自动登出和页面刷新，否则错误提示会被刷新吞掉。
      // 使用精确匹配避免误判包含该子串的其他路径。
      const url = error.config?.url || ""
      const isAuthEndpoint = url === "/auth/login" || url === "/auth/register" || url.endsWith("/auth/login") || url.endsWith("/auth/register")
      if (!isAuthEndpoint) {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        window.location.href = "/login"
      }
    }
    return Promise.reject(error)
  }
)

export default api
