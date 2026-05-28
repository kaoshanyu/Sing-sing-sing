"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Lock, Unlock, ChevronRight, Music, BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Unit } from "./types"
import { fetchUnits } from "./rhythm-api"
import { ConfirmDialog, EmptyState, ErrorState, GradeBadge } from "./shared"
import { getGrade } from "./types"

interface UnitHallProps {
  onSelectUnit: (unitId: number) => void
  onBack: () => void
}

export function UnitHall({ onSelectUnit, onBack }: UnitHallProps) {
  const [units, setUnits] = useState<Unit[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pendingLockedUnit, setPendingLockedUnit] = useState<Unit | null>(null)

  const load = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await fetchUnits()
      setUnits(data)
    } catch {
      setError("加载单元数据失败")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleUnitClick = (unit: Unit) => {
    if (unit.is_unlocked) {
      onSelectUnit(unit.unit_id)
    } else {
      setPendingLockedUnit(unit)
    }
  }

  const unlockedCount = units.filter((u) => u.is_unlocked).length
  const bestScore = Math.max(...units.map((u) => u.best_score ?? 0), 0)

  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-background">
        <div className="px-4 pt-6 pb-4 border-b border-border/50">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return <ErrorState message={error} onRetry={load} onBack={onBack} />
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 border-b border-border/50">
        <div className="flex items-center gap-2 mb-1">
          <button onClick={onBack} className="text-muted-foreground hover:text-foreground">
            <ChevronRight className="w-5 h-5 rotate-180" />
          </button>
          <span className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full">
            Rhythm Mastery
          </span>
        </div>
        <h1 className="text-2xl font-bold text-foreground mt-2">单元大厅</h1>
        <p className="text-sm text-muted-foreground mt-1">从基础拍号到节奏制作，6 个单元按序解锁</p>
      </div>

      {/* Overview Banner */}
      <div className="mx-4 mt-4 p-4 rounded-2xl bg-card border border-border/50">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">已解锁</span>
            </div>
            <span className="text-2xl font-bold text-foreground">
              {unlockedCount}/{units.length}
            </span>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">最高分</div>
            <span className="text-2xl font-bold text-primary">{bestScore || "--"}</span>
          </div>
        </div>
        <Progress value={units.length > 0 ? (unlockedCount / units.length) * 100 : 0} className="mt-3 h-2" />
      </div>

      {/* Unit Grid */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        {units.length === 0 ? (
          <EmptyState icon={<Music className="w-12 h-12" />} title="暂无单元数据" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {units.map((unit, i) => (
              <motion.button
                key={unit.unit_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => handleUnitClick(unit)}
                className={cn(
                  "text-left p-5 rounded-2xl bg-card border transition-all duration-200 flex flex-col gap-3",
                  unit.is_unlocked
                    ? "border-border/50 hover:shadow-md hover:border-primary/50 active:scale-[0.98] cursor-pointer"
                    : "border-border/30 opacity-60 cursor-default",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-medium text-muted-foreground">
                    单元 {String(unit.unit_order).padStart(2, "0")}
                  </span>
                  {unit.is_unlocked ? (
                    <Unlock className="w-4 h-4 text-primary" />
                  ) : (
                    <Lock className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <h3 className="text-base font-bold text-foreground leading-snug">{unit.unit_name}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 min-h-[2.5em]">
                  {unit.unit_description}
                </p>
                <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/30">
                  {unit.best_score !== null ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{unit.best_score}</span>
                      <GradeBadge grade={getGrade(unit.best_score)} size="sm" />
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">未挑战</span>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={pendingLockedUnit !== null}
        title="跳过单元锁定确认"
        description={`「${pendingLockedUnit?.unit_name}」尚未解锁。建议按顺序学习以获得最佳体验。确定要跳过锁定直接进入吗？`}
        confirmText="跳过锁定，进入单元"
        onConfirm={() => {
          if (pendingLockedUnit) {
            const id = pendingLockedUnit.unit_id
            setPendingLockedUnit(null)
            onSelectUnit(id)
          }
        }}
        onCancel={() => setPendingLockedUnit(null)}
      />
    </div>
  )
}
