"use client"

import { motion } from "framer-motion"
import { Trophy, Zap, TrendingUp, TrendingDown, ChevronLeft, RotateCcw, ArrowRight, Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import type { ModuleLevel } from "./session-entry"

const CONFETTI_COLORS = ["#FF6B6B", "#FFE66D", "#4ECDC4", "#A78BFA", "#F472B6", "#34D399", "#FB923C", "#60A5FA"]

function Confetti() {
  const particles = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    rotation: Math.random() * 720 - 360,
    scale: Math.random() * 0.6 + 0.4,
    delay: Math.random() * 0.5,
    duration: Math.random() * 1.5 + 1.5,
  }))

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute w-2.5 h-2.5 rounded-full"
          style={{ left: `${p.x}%`, backgroundColor: p.color, top: -10 }}
          initial={{ y: -20, opacity: 1, rotate: 0, scale: p.scale }}
          animate={{
            y: "110vh",
            opacity: [1, 1, 0],
            rotate: p.rotation,
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: "easeIn",
            repeat: 2,
            repeatDelay: 2,
          }}
        />
      ))}
    </div>
  )
}

interface SessionCompleteProps {
  moduleTitle: string
  moduleColor: string
  accuracy: number
  correctCount: number
  totalCount: number
  pointsEarned: number
  currentLevel: ModuleLevel
  nextLevel: ModuleLevel
  shouldPromote: boolean
  shouldDemote: boolean
  isMastered: boolean
  onRetry: () => void
  onContinue: () => void
}

const LEVEL_LABELS: Record<ModuleLevel, string> = {
  L1: "基础级",
  L2: "进阶级",
  L3: "大师级",
}

export function SessionComplete({
  moduleTitle,
  moduleColor,
  accuracy,
  correctCount,
  totalCount,
  pointsEarned,
  currentLevel,
  nextLevel,
  shouldPromote,
  shouldDemote,
  isMastered,
  onRetry,
  onContinue,
}: SessionCompleteProps) {
  const getFeedback = () => {
    if (isMastered) return "太强了！已掌握最高等级！"
    if (shouldPromote) return `恭喜晋级！下一轮进入 ${LEVEL_LABELS[nextLevel]}`
    if (shouldDemote) return `别灰心，回到 ${LEVEL_LABELS[nextLevel]} 继续巩固`
    return "继续加油，保持稳定练习"
  }

  return (
    <div className="h-full bg-background flex flex-col">
      {(shouldPromote || isMastered) && <Confetti />}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {/* Result Card */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="rounded-3xl bg-card border border-border/50 p-6 text-center"
        >
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
            className={cn(
              "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4",
              shouldPromote || isMastered ? "bg-accent/30" : shouldDemote ? "bg-destructive/20" : "bg-secondary",
            )}
          >
            {isMastered ? (
              <Trophy className="w-10 h-10 text-amber-400" />
            ) : shouldPromote ? (
              <TrendingUp className="w-10 h-10 text-accent-foreground" />
            ) : shouldDemote ? (
              <TrendingDown className="w-10 h-10 text-destructive" />
            ) : (
              <Star className="w-10 h-10 text-primary" />
            )}
          </motion.div>

          <h2 className="text-2xl font-black text-foreground mb-2">{getFeedback()}</h2>

          {/* Score ring */}
          <div className="relative w-32 h-32 mx-auto my-4">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="none" stroke="var(--border)" strokeWidth="6" />
              <motion.circle
                cx="60" cy="60" r="50"
                fill="none"
                stroke={moduleColor}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 50}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 50 }}
                animate={{
                  strokeDashoffset: 2 * Math.PI * 50 * (1 - accuracy),
                }}
                transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-foreground">{Math.round(accuracy * 100)}%</span>
              <span className="text-xs text-muted-foreground">正确率</span>
            </div>
          </div>

          {/* Level badges */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-sm">
              <span className="text-muted-foreground">等级</span>
              {shouldDemote ? (
                <>
                  <span className="text-muted-foreground line-through">{LEVEL_LABELS[currentLevel]}</span>
                  <TrendingDown className="w-3.5 h-3.5 text-destructive" />
                  <span className="font-bold text-destructive">{LEVEL_LABELS[nextLevel]}</span>
                </>
              ) : shouldPromote ? (
                <>
                  <span className="text-muted-foreground line-through">{LEVEL_LABELS[currentLevel]}</span>
                  <TrendingUp className="w-3.5 h-3.5 text-accent-foreground" />
                  <span className="font-bold text-accent-foreground">{LEVEL_LABELS[nextLevel]}</span>
                </>
              ) : (
                <span className="font-bold text-foreground">{LEVEL_LABELS[currentLevel]}</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-sm">
              <Zap className="w-3.5 h-3.5 text-primary" />
              <span className="text-muted-foreground">+{pointsEarned}</span>
              <span className="text-xs text-muted-foreground">积分</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="p-3 rounded-xl bg-secondary/50">
              <p className="text-lg font-bold text-foreground">{correctCount}/{totalCount}</p>
              <p className="text-xs text-muted-foreground">正确/总数</p>
            </div>
            <div className="p-3 rounded-xl bg-secondary/50">
              <p className="text-lg font-bold text-foreground">{pointsEarned}</p>
              <p className="text-xs text-muted-foreground">获得积分</p>
            </div>
          </div>

          {/* Level progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>L1</span>
              <span>L2</span>
              <span>L3</span>
            </div>
            <Progress
              value={nextLevel === "L1" ? 16 : nextLevel === "L2" ? 50 : 83}
              className="h-2"
            />
          </div>
        </motion.div>
      </div>

      {/* Bottom */}
      <div className="px-4 py-4 border-t border-border/50 flex gap-3">
        <Button variant="outline" className="flex-1 h-12 rounded-2xl" onClick={onRetry}>
          <RotateCcw className="w-4 h-4" /> 再练一轮
        </Button>
        <Button
          className="flex-1 h-12 rounded-2xl"
          style={{ backgroundColor: moduleColor }}
          onClick={onContinue}
        >
          返回教程 <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
