"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ChevronLeft, Lock, Play, CheckCircle2, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Unit, Level, getGrade } from "./types"
import { fetchUnit, fetchLevels } from "./rhythm-api"
import { DifficultyStars, GradeBadge, InfoTag, ConfirmDialog, ErrorState } from "./shared"

interface UnitDetailProps {
  unitId: number
  onStartLevel: (levelId: number) => void
  onBack: () => void
}

export function UnitDetail({ unitId, onStartLevel, onBack }: UnitDetailProps) {
  const [unit, setUnit] = useState<Unit | null>(null)
  const [levels, setLevels] = useState<Level[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pendingLockedLevel, setPendingLockedLevel] = useState<number | null>(null)

  const load = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [u, l] = await Promise.all([fetchUnit(unitId), fetchLevels(unitId)])
      setUnit(u)
      setLevels(l)
    } catch {
      setError("加载关卡数据失败")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { load() }, [unitId])

  const handleLevelClick = (level: Level) => {
    if (level.is_unlocked) {
      onStartLevel(level.level_id)
    } else {
      setPendingLockedLevel(level.level_id)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-background">
        <div className="px-4 pt-6 pb-4 border-b border-border/50">
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-5 w-48 mb-1" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return <ErrorState message={error} onRetry={load} onBack={onBack} />
  }

  if (!unit) {
    return <ErrorState message="单元不存在" onBack={onBack} />
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 border-b border-border/50">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-card border border-border/50 flex items-center justify-center hover:bg-secondary transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <span className="text-xs font-mono font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full">
            单元 {String(unit.unit_order).padStart(2, "0")}
          </span>
        </div>
        <h1 className="text-xl font-bold text-foreground ml-12">{unit.unit_name}</h1>
        <p className="text-sm text-muted-foreground mt-1 ml-12">{unit.unit_description}</p>
      </div>

      {/* Level List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 space-y-3">
        {levels.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-muted-foreground">该单元暂无可用关卡</p>
          </div>
        )}

        {levels.map((level, i) => {
          const isUnlocked = level.is_unlocked
          const isCompleted = level.is_completed
          return (
            <motion.div
              key={level.level_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn(
                "rounded-2xl bg-card border transition-all duration-200 p-4",
                isUnlocked
                  ? "border-border/50 hover:shadow-md hover:border-primary/30"
                  : "border-border/30 opacity-60",
              )}
            >
              <div className="flex items-center gap-4">
                {/* Status Icon */}
                <div
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                    isCompleted && "bg-accent/30",
                    isUnlocked && !isCompleted && "bg-primary/15",
                    !isUnlocked && "bg-muted",
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-6 h-6 text-accent-foreground" />
                  ) : isUnlocked ? (
                    <Play className="w-5 h-5 text-primary ml-0.5" />
                  ) : (
                    <Lock className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground">第 {i + 1} 关</h3>
                    <DifficultyStars difficulty={level.difficulty} size="sm" />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <InfoTag>{level.bpm_range_min}-{level.bpm_range_max} BPM</InfoTag>
                    <InfoTag>{level.time_signature}</InfoTag>
                    <InfoTag>Level {level.subdivision_level}</InfoTag>
                    {level.best_score !== null && (
                      <InfoTag>最高 {level.best_score}</InfoTag>
                    )}
                  </div>
                </div>

                {/* Action */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {isCompleted ? (
                    <span className="text-xs font-medium text-accent-foreground">已完成</span>
                  ) : isUnlocked ? (
                    <span className="text-xs font-medium text-primary">可挑战</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">未解锁</span>
                  )}
                  <Button
                    size="sm"
                    variant={isUnlocked ? "default" : "outline"}
                    onClick={() => handleLevelClick(level)}
                    className="text-xs h-8"
                  >
                    {isUnlocked ? "开始挑战" : "跳过锁定"}
                  </Button>
                </div>
              </div>

              {/* Score Progress */}
              {level.best_score !== null && (
                <div className="mt-3">
                  <Progress value={level.best_score} className="h-1.5" />
                </div>
              )}
            </motion.div>
          )
        })}
      </div>

      <ConfirmDialog
        open={pendingLockedLevel !== null}
        title="跳过关卡锁定确认"
        description="该关卡尚未解锁。建议按顺序挑战以获得最佳体验。确定要跳过锁定直接挑战吗？"
        confirmText="跳过锁定，直接挑战"
        onConfirm={() => {
          if (pendingLockedLevel !== null) {
            const id = pendingLockedLevel
            setPendingLockedLevel(null)
            onStartLevel(id)
          }
        }}
        onCancel={() => setPendingLockedLevel(null)}
      />
    </div>
  )
}
