"use client"

import { motion } from "framer-motion"
import { Sparkles, Zap, Trophy, Flame, ChevronLeft, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { LEVEL_CONFIG } from "@/lib/game-context"
import { Button } from "@/components/ui/button"

export type ModuleLevel = "L1" | "L2" | "L3"

interface SessionEntryProps {
  moduleTitle: string
  moduleColor: string
  currentLevel: ModuleLevel
  points: number
  streak: number
  masteredLevels: ModuleLevel[]
  onStart: () => void
  onBack: () => void
}

const LEVEL_LABELS: Record<ModuleLevel, string> = {
  L1: "基础级",
  L2: "进阶级",
  L3: "大师级",
}

const LEVEL_NUM: Record<ModuleLevel, number> = {
  L1: 1,
  L2: 2,
  L3: 3,
}

export function SessionEntry({
  moduleTitle,
  moduleColor,
  currentLevel,
  points,
  streak,
  masteredLevels,
  onStart,
  onBack,
}: SessionEntryProps) {
  // 等级内进度：根据累计积分估算当前等级内的进度
  const inLevelPoints = Math.max(0, Math.min(LEVEL_CONFIG.RANGES[currentLevel], points - LEVEL_CONFIG.STARTS[currentLevel]))
  const progress = Math.round((inLevelPoints / LEVEL_CONFIG.RANGES[currentLevel]) * 100)
  const masteredCount = masteredLevels.length

  return (
    <div className="h-full bg-background flex flex-col">
      {/* Top */}
      <div className="px-4 pt-6 pb-2 flex items-center justify-between">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-card border border-border/50 flex items-center justify-center hover:bg-secondary transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <span className="text-sm text-muted-foreground font-medium">
          {moduleTitle}
        </span>
        <div className="w-9" />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-8">
        {/* Progress Ring */}
        <div className="relative w-44 h-44">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            {/* Background circle */}
            <circle
              cx="60" cy="60" r="52"
              fill="none"
              stroke="var(--border)"
              strokeWidth="6"
            />
            {/* Progress circle */}
            <motion.circle
              cx="60" cy="60" r="52"
              fill="none"
              stroke={moduleColor}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 52}`}
              initial={{ strokeDashoffset: 2 * Math.PI * 52 }}
              animate={{
                strokeDashoffset: 2 * Math.PI * 52 * (1 - progress / 100),
              }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
            {/* Level markers */}
            {[1, 2, 3].map((lvl) => {
              const angle = ((lvl - 1) / 3) * 360 - 90
              const rad = (angle * Math.PI) / 180
              const cx = 60 + 52 * Math.cos(rad)
              const cy = 60 + 52 * Math.sin(rad)
              const isActive = LEVEL_NUM[currentLevel] >= lvl
              return (
                <circle
                  key={lvl}
                  cx={cx} cy={cy} r="5"
                  fill={isActive ? moduleColor : "var(--border)"}
                  className="transition-colors duration-500"
                />
              )
            })}
          </svg>
          {/* Center */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-foreground">L{LEVEL_NUM[currentLevel]}</span>
            <span className="text-xs text-muted-foreground mt-0.5">{LEVEL_LABELS[currentLevel]}</span>
          </div>
        </div>

        {/* Module title */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-1">{moduleTitle}</h1>
          <p className="text-sm text-muted-foreground">今日学习 · 20 道练习</p>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="flex items-center gap-1 justify-center">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-lg font-bold text-foreground">{points}</span>
            </div>
            <p className="text-xs text-muted-foreground">积分</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center">
            <div className="flex items-center gap-1 justify-center">
              <Flame className={cn("w-4 h-4", streak > 0 ? "text-orange-400" : "text-muted-foreground")} />
              <span className="text-lg font-bold text-foreground">{streak}</span>
            </div>
            <p className="text-xs text-muted-foreground">连续天数</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center">
            <div className="flex items-center gap-1 justify-center">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="text-lg font-bold text-foreground">{masteredCount}/3</span>
            </div>
            <p className="text-xs text-muted-foreground">掌握等级</p>
          </div>
        </div>

        {/* Start button */}
        <Button
          size="lg"
          className="w-full max-w-xs h-14 text-base rounded-2xl shadow-lg"
          style={{ backgroundColor: moduleColor, color: "#fff" }}
          onClick={onStart}
        >
          开始学习 <ArrowRight className="w-4 h-4" />
        </Button>

        {/* Level info */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            {currentLevel === "L1" && "练到 80% 正确率升 L2"}
            {currentLevel === "L2" && "练到 82% 正确率升 L3 · 低于 55% 降回 L1"}
            {currentLevel === "L3" && "练到 85% 正确率掌握本模块 · 低于 58% 降回 L2"}
          </p>
        </div>
      </div>
    </div>
  )
}
