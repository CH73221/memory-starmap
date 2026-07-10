import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "@/stores/authStore"

export function useAuth() {
  const { user, isAuthenticated, logout, loadFromStorage } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    loadFromStorage()
  }, [loadFromStorage])

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return {
    user,
    isAuthenticated,
    logout: handleLogout,
  }
}
