import { useEffect, useState } from "react"
import { leaderboardService } from "@/services/extraService"
import type { LeaderboardResponse } from "@/services/extraService"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { FadeIn } from "@/components/ui/page-transition"
import {
  Trophy, Crown, Medal, Award, TrendingUp, Share2, Flame, Star,
  Calendar, Target, CheckCircle2, ChevronUp,
} from "lucide-react"
import { cn } from "@/lib/utils"

type Period = "today" | "week" | "total"

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<Period>("today")
  const [data, setData] = useState<LeaderboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [shareCopied, setShareCopied] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const d = await leaderboardService.get(period)
      setData(d)
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [period])

  const handleShare = async () => {
    const text = `我在记忆星图${data?.period_label || "今日"}复习榜上排名第 ${data?.your_rank}，超越了 ${data?.your_percentile}% 的学习者！一起来精进记忆吧`
    try {
      await navigator.clipboard.writeText(text)
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 2000)
    } catch (e) { console.error(e) }
  }

  // 领奖台样式：左侧3px色条，白底
  const getPodiumStyle = (rank: number) => {
    if (rank === 1) return {
      stripeColor: "#c87941", // amber 金
      stripeBg: "bg-amber-50",
      icon: Crown,
    }
    if (rank === 2) return {
      stripeColor: "#c9c9da", // ink-200 银
      stripeBg: "bg-paper-100",
      icon: Medal,
    }
    if (rank === 3) return {
      stripeColor: "#ddd8d1", // paper-300 铜
      stripeBg: "bg-paper-50",
      icon: Award,
    }
    return null
  }

  const you = data?.entries.find((e) => e.is_you)
  const topThree = data?.entries.slice(0, 3) || []
  const others = data?.entries.slice(3) || []

  // 获取首字母头像
  const getInitial = (name: string) => name?.charAt(0)?.toUpperCase() || "?"

  return (
    <div className="space-y-6 relative">
      <FadeIn className="spring-enter">
        <div className="flex items-center justify-between flex-wrap gap-3 relative">
          <div>
            <h1 className="text-3xl font-display font-extrabold flex items-center gap-3 text-ink-800">
              <Trophy className="w-7 h-7 text-amber" />
              学习排行榜
            </h1>
            <p className="text-sm text-ink-400 mt-1.5">和全国学习者一起精进</p>
          </div>
          <Button
            onClick={handleShare}
            className="rounded-lg bg-ink-800 hover:bg-ink-700 text-white shadow-sm hover:shadow-md transition-all"
          >
            {shareCopied ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <Share2 className="w-4 h-4 mr-2" />}
            {shareCopied ? "已复制分享文案" : "分享我的成绩"}
          </Button>
        </div>
      </FadeIn>

      {/* Period Tabs - 下划线风格 */}
      <FadeIn delay={50}>
        <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <TabsList className="h-auto p-0 bg-transparent gap-6">
            <TabsTrigger
              value="today"
              className="data-[state=active]:bg-transparent data-[state=active]:text-ink-800 data-[state=active]:shadow-none rounded-none border-b-2 data-[state=active]:border-ink-800 border-transparent px-1 py-2 text-ink-400 hover:text-ink-600 transition-colors"
            >
              <Calendar className="w-3.5 h-3.5 mr-1.5" />今日榜
            </TabsTrigger>
            <TabsTrigger
              value="week"
              className="data-[state=active]:bg-transparent data-[state=active]:text-ink-800 data-[state=active]:shadow-none rounded-none border-b-2 data-[state=active]:border-ink-800 border-transparent px-1 py-2 text-ink-400 hover:text-ink-600 transition-colors"
            >
              <TrendingUp className="w-3.5 h-3.5 mr-1.5" />本周榜
            </TabsTrigger>
            <TabsTrigger
              value="total"
              className="data-[state=active]:bg-transparent data-[state=active]:text-ink-800 data-[state=active]:shadow-none rounded-none border-b-2 data-[state=active]:border-ink-800 border-transparent px-1 py-2 text-ink-400 hover:text-ink-600 transition-colors"
            >
              <Trophy className="w-3.5 h-3.5 mr-1.5" />总榜
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </FadeIn>

      {/* Your rank highlight - 白纸 + 左侧3px ink色条 */}
      {data && you && (
        <FadeIn delay={100}>
          <Card>
            <CardContent className="p-6 relative">
              {/* 左侧 3px 墨蓝色条 */}
              <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-ink-800 rounded-r" />
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-ink-100 flex items-center justify-center">
                    <span className="text-lg font-semibold text-ink-600">{getInitial(you.username)}</span>
                  </div>
                  <div>
                    <p className="text-xs text-ink-400 font-medium">你的排名</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-4xl font-display font-bold text-ink-800">
                        #{data.your_rank}
                      </p>
                      <p className="text-sm text-ink-400">/ {data.entries.length}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs text-ink-400 font-medium">超越全国</p>
                    <p className="text-2xl font-display font-bold text-amber">
                      {data.your_percentile}%
                    </p>
                    <p className="text-[10px] text-ink-400 mt-0.5">学习者</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-ink-400 font-medium">{data.period_label}复习</p>
                    <p className="text-2xl font-display font-bold text-ink-800">
                      {period === "today" ? you.today_reviews : period === "week" ? you.week_reviews : you.total_reviews}
                    </p>
                    <p className="text-[10px] text-ink-400 mt-0.5">次</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      )}

      {loading ? (
        <Skeleton className="h-96 w-full rounded-xl" />
      ) : (
        <>
          {/* Top 3 Podium - 领奖台样式，白底 + 左侧3px色条 */}
          {topThree.length >= 3 && (
            <FadeIn className="spring-enter" delay={150}>
              <div className="grid grid-cols-3 gap-4 mb-4 items-end">
                {/* 2nd - 银牌 */}
                {(() => {
                  const e = topThree[1]
                  const style = getPodiumStyle(2)!
                  const Icon = style.icon
                  const reviews = period === "today" ? e.today_reviews : period === "week" ? e.week_reviews : e.total_reviews
                  return (
                    <div className="pt-8">
                      <Card className="relative overflow-hidden transition-shadow hover:shadow-md">
                        {/* 左侧3px色条 */}
                        <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ backgroundColor: style.stripeColor }} />
                        <CardContent className="p-5 text-center pt-6 pl-6">
                          <div className="relative inline-block mb-3">
                            <div className="w-14 h-14 rounded-full bg-ink-100 flex items-center justify-center">
                              <span className="text-lg font-semibold text-ink-600">{getInitial(e.username)}</span>
                            </div>
                            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                              <Icon className="w-3 h-3" style={{ color: style.stripeColor }} />
                            </div>
                          </div>
                          <p className="font-bold text-ink-800 truncate">{e.username}</p>
                          <p className="text-xs text-ink-400 mt-0.5">{e.grade} · {e.major}</p>
                          <div className={cn("mt-3 p-2.5 rounded-lg", style.stripeBg)}>
                            <p className="text-2xl font-display font-bold text-ink-800">
                              {reviews}
                            </p>
                            <p className="text-[10px] text-ink-400 mt-0.5">复习次数</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )
                })()}
                {/* 1st - 金牌 */}
                {(() => {
                  const e = topThree[0]
                  const style = getPodiumStyle(1)!
                  const Icon = style.icon
                  const reviews = period === "today" ? e.today_reviews : period === "week" ? e.week_reviews : e.total_reviews
                  return (
                    <div className="-mt-4">
                      <Card className="relative overflow-hidden transition-shadow hover:shadow-md">
                        {/* 左侧3px色条 */}
                        <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ backgroundColor: style.stripeColor }} />
                        <CardContent className="p-6 text-center pt-7 pl-6 relative">
                          <div className="relative inline-block mb-3">
                            <div className="w-[72px] h-[72px] rounded-full bg-amber-50 border-2 flex items-center justify-center" style={{ borderColor: style.stripeColor }}>
                              <span className="text-xl font-semibold text-ink-800">{getInitial(e.username)}</span>
                            </div>
                            <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                              <Icon className="w-4 h-4" style={{ color: style.stripeColor }} />
                            </div>
                          </div>
                          <p className="font-bold text-ink-800 truncate text-base">{e.username}</p>
                          <p className="text-xs text-ink-400 mt-0.5">{e.grade} · {e.major}</p>
                          <div className={cn("mt-3 p-3 rounded-lg", style.stripeBg)}>
                            <p className="text-3xl font-display font-bold text-ink-800">
                              {reviews}
                            </p>
                            <p className="text-[10px] text-ink-400 mt-0.5">复习次数</p>
                          </div>
                          <Badge className="mt-3 bg-amber text-white border-none font-medium">
                            擂主
                          </Badge>
                        </CardContent>
                      </Card>
                    </div>
                  )
                })()}
                {/* 3rd - 铜牌 */}
                {(() => {
                  const e = topThree[2]
                  const style = getPodiumStyle(3)!
                  const Icon = style.icon
                  const reviews = period === "today" ? e.today_reviews : period === "week" ? e.week_reviews : e.total_reviews
                  return (
                    <div className="pt-12">
                      <Card className="relative overflow-hidden transition-shadow hover:shadow-md">
                        {/* 左侧3px色条 */}
                        <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ backgroundColor: style.stripeColor }} />
                        <CardContent className="p-5 text-center pt-6 pl-6">
                          <div className="relative inline-block mb-3">
                            <div className="w-14 h-14 rounded-full bg-ink-100 flex items-center justify-center">
                              <span className="text-lg font-semibold text-ink-600">{getInitial(e.username)}</span>
                            </div>
                            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                              <Icon className="w-3 h-3" style={{ color: style.stripeColor }} />
                            </div>
                          </div>
                          <p className="font-bold text-ink-800 truncate">{e.username}</p>
                          <p className="text-xs text-ink-400 mt-0.5">{e.grade} · {e.major}</p>
                          <div className={cn("mt-3 p-2.5 rounded-lg", style.stripeBg)}>
                            <p className="text-2xl font-display font-bold text-ink-800">
                              {reviews}
                            </p>
                            <p className="text-[10px] text-ink-400 mt-0.5">复习次数</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )
                })()}
              </div>
            </FadeIn>
          )}

          {/* Others (rank 4+) - 分割线分隔列表 */}
          {others.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="w-4 h-4 text-ink-700" />
                    完整榜单
                  </CardTitle>
                  <CardDescription>所有 {data?.entries.length} 名学习者</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-gray-100">
                    {others.map((e, idx) => {
                      const reviews = period === "today" ? e.today_reviews : period === "week" ? e.week_reviews : e.total_reviews
                      return (
                        <div
                          key={e.username}
                          className={cn(
                            "stagger-item flex items-center gap-3 px-6 py-3 transition-colors",
                            e.is_you
                              ? "bg-ink-50"
                              : "hover:bg-paper-50"
                          )}
                          style={{ animationDelay: `${idx * 50}ms` }}
                        >
                          <div className="w-8 h-8 flex items-center justify-center shrink-0">
                            <span className={cn(
                              "text-sm font-semibold tabular-nums",
                              e.is_you ? "text-ink-800" : "text-ink-400"
                            )}>#{e.rank}</span>
                          </div>
                          {/* 头像：ink-100 纯色圆形 + 首字母 ink-600 */}
                          <div className="w-9 h-9 rounded-full bg-ink-100 flex items-center justify-center shrink-0">
                            <span className="text-sm font-semibold text-ink-600">{getInitial(e.username)}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-medium text-ink-800 truncate">{e.username}</p>
                              {e.is_you && (
                                <Badge className="rounded-md bg-ink-800 text-white text-[9px] border-0 px-1.5 py-0">
                                  YOU
                                </Badge>
                              )}
                            </div>
                            <p className="text-[10px] text-ink-400 truncate flex items-center gap-1">
                              {e.grade} · {e.major} · <Flame className="w-3 h-3 text-amber" /> {e.streak}天连续
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-base font-display font-bold text-ink-800 tabular-nums">
                              {reviews}
                            </p>
                            <p className="text-[10px] text-ink-400">复习</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
          )}
        </>
      )}
    </div>
  )
}
