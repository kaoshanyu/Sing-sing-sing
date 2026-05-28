"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import { ChevronLeft, RotateCcw, ArrowRight, Gift, Award } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { SubmitResult, Grade, GRADE_CONFIG } from "./types"
import { GradeBadge } from "./shared"

interface ResultPageProps {
  result: SubmitResult
  levelId: number
  hasNextLevel: boolean
  onRetry: () => void
  onNextLevel: () => void
  onBackToUnit: () => void
}

export function ResultPage({ result, hasNextLevel, onRetry, onNextLevel, onBackToUnit }: ResultPageProps) {
  const hitRatio = result.statistics.hit_count + result.statistics.miss_count > 0
    ? result.statistics.hit_count / (result.statistics.hit_count + result.statistics.miss_count)
    : 0

  return (
    <div className="h-full bg-background flex flex-col">
      {/* Top Bar */}
      <div className="px-4 py-3 flex items-center gap-3 border-b border-border/50 shrink-0">
        <button
          onClick={onBackToUnit}
          className="w-9 h-9 rounded-full bg-card border border-border/50 flex items-center justify-center hover:bg-secondary transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <span className={cn(
          "text-sm font-semibold px-3 py-1 rounded-full",
          result.is_passed ? "bg-accent/20 text-accent-foreground" : "bg-destructive/20 text-destructive",
        )}>
          {result.is_passed ? "已通过 ✓" : "未通过"}
        </span>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto pb-4">
        {/* Score Display */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="mx-4 mt-6 p-6 rounded-3xl bg-card border border-border/50 flex flex-col items-center gap-3"
        >
          <span className="text-sm text-muted-foreground">本次得分</span>
          <span className="text-7xl font-black text-foreground">{Math.round(result.score)}</span>
          <GradeBadge grade={result.grade} size="lg" />
          <p className="text-sm text-muted-foreground text-center mt-1 max-w-xs">{result.feedback}</p>
        </motion.div>

        {/* Statistics Grid */}
        <div className="mx-4 mt-4 grid grid-cols-2 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-4 rounded-2xl bg-card border border-border/50"
          >
            <h4 className="text-xs font-medium text-muted-foreground mb-3">命中统计</h4>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-accent-foreground">命中 {result.statistics.hit_count}</span>
              <span className="text-sm font-semibold text-destructive">Miss {result.statistics.miss_count}</span>
            </div>
            <Progress value={hitRatio * 100} className="h-2 [&>div]:bg-accent" />
            <p className="text-xs text-muted-foreground mt-1">
              命中率 {Math.round(hitRatio * 100)}%
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="p-4 rounded-2xl bg-card border border-border/50"
          >
            <h4 className="text-xs font-medium text-muted-foreground mb-3">时间偏差</h4>
            <div className="space-y-2">
              <div>
                <span className="text-xs text-muted-foreground">平均</span>
                <p className="text-lg font-bold text-foreground">{Math.round(result.statistics.avg_deviation_ms)} ms</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">最大</span>
                <p className="text-lg font-bold text-foreground">{Math.round(result.statistics.max_deviation_ms)} ms</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Radar Chart (only for PRODUCER_SANDBOX) */}
        {result.radar_chart && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mx-4 mt-4 p-4 rounded-2xl bg-card border border-border/50"
          >
            <h4 className="text-sm font-semibold text-foreground mb-4">制作人能力雷达</h4>
            <RadarChart
              precision={result.radar_chart.precision}
              theory={result.radar_chart.theory_logic}
              complexity={result.radar_chart.complexity}
            />
          </motion.div>
        )}

        {/* Reward Card */}
        {result.reward && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mx-4 mt-4 p-4 rounded-2xl bg-primary/10 border border-primary/30 flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Gift className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">解锁新乐器：{result.reward.instrument_name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">可在节奏制作人中使用该乐器创作</p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="px-4 py-4 border-t border-border/50 bg-card/50 shrink-0">
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onRetry}>
            <RotateCcw className="w-4 h-4" /> 再来一次
          </Button>
          <Button variant="outline" className="flex-1" onClick={onBackToUnit}>
            返回关卡
          </Button>
          <Button
            className="flex-1"
            disabled={!hasNextLevel}
            onClick={onNextLevel}
          >
            <ArrowRight className="w-4 h-4" /> 下一关
          </Button>
        </div>
      </div>
    </div>
  )
}

// ===== Simple Radar Chart SVG =====
function RadarChart({ precision, theory, complexity }: { precision: number; theory: number; complexity: number }) {
  const cx = 100, cy = 100, r = 75

  const points = useMemo(() => {
    const toPoint = (value: number, angle: number) => {
      const rad = ((angle - 90) * Math.PI) / 180
      const dist = (value / 100) * r
      return { x: cx + dist * Math.cos(rad), y: cy + dist * Math.sin(rad) }
    }

    const p1 = toPoint(precision, 0)
    const p2 = toPoint(theory, 120)
    const p3 = toPoint(complexity, 240)

    return {
      data: `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`,
      grid0: `${cx},${cy - r} ${cx + r * Math.sin(120 * Math.PI / 180)},${cy + r * Math.cos(120 * Math.PI / 180)} ${cx + r * Math.sin(240 * Math.PI / 180)},${cy + r * Math.cos(240 * Math.PI / 180)}`,
      grid50: `${toPoint(50, 0).x},${toPoint(50, 0).y} ${toPoint(50, 120).x},${toPoint(50, 120).y} ${toPoint(50, 240).x},${toPoint(50, 240).y}`,
    }
  }, [precision, theory, complexity])

  return (
    <svg viewBox="0 0 200 200" className="w-full max-w-[200px] mx-auto">
      {/* Grid rings */}
      <polygon points={points.grid50} fill="none" stroke="var(--border)" strokeWidth="0.5" />
      <line x1={cx - r} y1={cy} x2={cx + r} y2={cy} stroke="var(--border)" strokeWidth="0.5" />
      <line x1={cx - r / 2} y1={cy - r * Math.sqrt(3) / 2} x2={cx + r / 2} y2={cy + r * Math.sqrt(3) / 2} stroke="var(--border)" strokeWidth="0.5" />
      <line x1={cx + r / 2} y1={cy - r * Math.sqrt(3) / 2} x2={cx - r / 2} y2={cy + r * Math.sqrt(3) / 2} stroke="var(--border)" strokeWidth="0.5" />

      {/* Data triangle */}
      <polygon points={points.data} fill="var(--primary)" fillOpacity="0.2" stroke="var(--primary)" strokeWidth="2" />

      {/* Labels */}
      <text x={cx} y={cy - r - 8} textAnchor="middle" className="text-[10px] fill-muted-foreground">精度 {Math.round(precision)}</text>
      <text x={cx + (r + 8) * Math.sin(120 * Math.PI / 180)} y={cy + (r + 8) * Math.cos(120 * Math.PI / 180)} textAnchor="start" className="text-[10px] fill-muted-foreground">乐理 {Math.round(theory)}</text>
      <text x={cx + (r + 8) * Math.sin(240 * Math.PI / 180)} y={cy + (r + 8) * Math.cos(240 * Math.PI / 180)} textAnchor="end" className="text-[10px] fill-muted-foreground">复杂度 {Math.round(complexity)}</text>
    </svg>
  )
}
