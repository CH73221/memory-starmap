import { useEffect, useState, lazy, Suspense } from "react"
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom"
import { useAuthStore } from "@/stores/authStore"
import { ToastProvider } from "@/components/ui/toast"
import { Skeleton } from "@/components/ui/skeleton"
import { Tutorial, isTutorialCompleted } from "@/components/tutorial/Tutorial"
import { ErrorBoundary } from "@/components/ErrorBoundary"

const AppLayout = lazy(() => import("@/components/layout/AppLayout"))
const HomeLandingPage = lazy(() => import("@/pages/HomeLandingPage"))
const LoginPage = lazy(() => import("@/pages/LoginPage"))
const DashboardPage = lazy(() => import("@/pages/DashboardPage"))
const MaterialsPage = lazy(() => import("@/pages/MaterialsPage"))
const KnowledgeGraphPage = lazy(() => import("@/pages/KnowledgeGraphPage"))
const ReviewPage = lazy(() => import("@/pages/ReviewPage"))
const StatsPage = lazy(() => import("@/pages/StatsPage"))
const AIAssistantPage = lazy(() => import("@/pages/AIAssistantPage"))
const StudyPlanPage = lazy(() => import("@/pages/StudyPlanPage"))
const MemoryPalacePage = lazy(() => import("@/pages/MemoryPalacePage"))
const MistakesPage = lazy(() => import("@/pages/MistakesPage"))
const FocusPage = lazy(() => import("@/pages/FocusPage"))
const LeaderboardPage = lazy(() => import("@/pages/LeaderboardPage"))
const NotesListPage = lazy(() => import("@/pages/NotesListPage"))
const NoteEditorPage = lazy(() => import("@/pages/NoteEditorPage"))
const AchievementsPage = lazy(() => import("@/pages/AchievementsPage"))

function PageLoader() {
  return (
    <div className="p-6 space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

function TutorialGate() {
  const { isAuthenticated } = useAuthStore()
  const location = useLocation()
  const [showTutorial, setShowTutorial] = useState(false)

  useEffect(() => {
    if (
      isAuthenticated &&
      location.pathname === "/app" &&
      !isTutorialCompleted()
    ) {
      const timer = setTimeout(() => setShowTutorial(true), 800)
      return () => clearTimeout(timer)
    }
  }, [isAuthenticated, location.pathname])

  if (!showTutorial) return null

  return <Tutorial open={showTutorial} onComplete={() => setShowTutorial(false)} />
}

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <ErrorBoundary>
          {/* 噪声纹理叠加：极淡的胶片颗粒感 */}
          <div className="premium-noise-overlay" />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public landing page at root */}
              <Route path="/" element={<HomeLandingPage />} />

              {/* Auth */}
              <Route path="/login" element={<LoginPage />} />

              {/* App (authenticated) */}
              <Route
                path="/app"
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardPage />} />
                <Route path="materials" element={<MaterialsPage />} />
                <Route path="graph" element={<KnowledgeGraphPage />} />
                <Route path="review" element={<ReviewPage />} />
                <Route path="stats" element={<StatsPage />} />
                <Route path="plans" element={<StudyPlanPage />} />
                <Route path="ai" element={<AIAssistantPage />} />
                <Route path="palace" element={<MemoryPalacePage />} />
                <Route path="mistakes" element={<MistakesPage />} />
                <Route path="focus" element={<FocusPage />} />
                <Route path="leaderboard" element={<LeaderboardPage />} />
                <Route path="notes" element={<NotesListPage />} />
                <Route path="notes/:title" element={<NoteEditorPage />} />
                <Route path="achievements" element={<AchievementsPage />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
        <TutorialGate />
      </BrowserRouter>
    </ToastProvider>
  )
}

export default App
