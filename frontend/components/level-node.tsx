"use client"

import { cn } from "@/lib/utils"
import { Star, Lock, Play, Check } from "lucide-react"
import { LevelConfig, useGame } from "@/lib/game-context"

interface LevelNodeProps {
  level: LevelConfig
  chapterColor: string
  position: { x: number; y: number }
  isFirst: boolean
  isLast: boolean
  onSelect: (level: LevelConfig) => void
}

export function LevelNode({ 
  level, 
  chapterColor, 
  position, 
  onSelect 
}: LevelNodeProps) {
  const { getLevelProgress, isLevelUnlocked } = useGame()
  const progress = getLevelProgress(level.chapterId, level.levelNumber)
  const unlocked = isLevelUnlocked(level.chapterId, level.levelNumber)
  
  const isCurrent = unlocked && !progress.completed
  const isCompleted = progress.completed

  const handleClick = () => {
    if (unlocked) {
      onSelect(level)
    }
  }

  // 难度对应的大小
  const sizeClass = {
    easy: "w-16 h-16",
    medium: "w-18 h-18",
    hard: "w-20 h-20",
  }[level.difficulty]

  return (
    <div
      className="absolute transform -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${position.x}%`, top: `${position.y}%` }}
    >
      {/* Glow effect for current level */}
      {isCurrent && (
        <div 
          className="absolute inset-0 rounded-full node-current"
          style={{ 
            width: '120%', 
            height: '120%',
            left: '-10%',
            top: '-10%',
            backgroundColor: `${chapterColor}40`,
          }}
        />
      )}

      <button
        onClick={handleClick}
        disabled={!unlocked}
        className={cn(
          "relative rounded-full flex flex-col items-center justify-center transition-all duration-300",
          sizeClass,
          unlocked 
            ? "hover:scale-110 active:scale-95 cursor-pointer" 
            : "cursor-not-allowed opacity-50",
          isCompleted && "ring-2 ring-accent ring-offset-2 ring-offset-background"
        )}
        style={{
          backgroundColor: unlocked ? chapterColor : '#E8DDD5',
          boxShadow: unlocked ? `0 4px 20px ${chapterColor}60` : 'none',
        }}
      >
        {/* Inner content */}
        {!unlocked ? (
          <Lock className="w-5 h-5 text-muted-foreground" />
        ) : isCompleted ? (
          <Check className="w-6 h-6 text-foreground" />
        ) : (
          <Play className="w-5 h-5 text-foreground ml-0.5" />
        )}

        {/* Level number badge */}
        <div 
          className={cn(
            "absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-xs font-bold",
            unlocked ? "bg-card text-foreground" : "bg-secondary text-muted-foreground"
          )}
        >
          {level.levelNumber}
        </div>
      </button>

      {/* Stars display */}
      {progress.stars > 0 && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex gap-0.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <Star
              key={i}
              className={cn(
                "w-3 h-3",
                i < progress.stars
                  ? "fill-[var(--star-gold)] text-[var(--star-gold)] star-animate"
                  : "text-transparent"
              )}
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      )}

      {/* Level title tooltip */}
      {unlocked && (
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <span className="text-xs text-muted-foreground font-medium">
            {level.description}
          </span>
        </div>
      )}
    </div>
  )
}
