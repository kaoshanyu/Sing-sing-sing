"use client"

import { LevelConfig, CHAPTERS, useGame } from "@/lib/game-context"
import { Button } from "./ui/button"
import { Star, RotateCcw, ChevronRight, Home, Trophy, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"

interface LevelCompleteProps {
  level: LevelConfig
  stars: number
  accuracy: number
  onRetry: () => void
  onNext: () => void
  onHome: () => void
}

export function LevelComplete({
  level,
  stars,
  accuracy,
  onRetry,
  onNext,
  onHome,
}: LevelCompleteProps) {
  const { getChapterProgress } = useGame()
  const chapter = CHAPTERS.find(c => c.id === level.chapterId)
  const chapterProgress = getChapterProgress(level.chapterId)
  const [showConfetti, setShowConfetti] = useState(false)

  // 检查是否有下一关
  const hasNextLevel = level.levelNumber < (chapter?.levels || 0)
  const nextChapter = CHAPTERS.find(c => c.id === level.chapterId + 1)
  const canUnlockNextChapter = chapterProgress.totalStars >= (chapter?.requiredStars || 0)

  // 星星动画
  useEffect(() => {
    if (stars > 0) {
      setShowConfetti(true)
      const timer = setTimeout(() => setShowConfetti(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [stars])

  return (
    <div className="flex flex-col h-full bg-background relative">
      {/* Exit button - top right */}
      <button
        onClick={onHome}
        className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
      >
        <X className="w-5 h-5 text-muted-foreground" />
      </button>

      {/* Confetti effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-3 h-3 rounded-full animate-[fall_2s_ease-out_forwards]"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-20px',
                backgroundColor: [
                  chapter?.color,
                  '#FFD700',
                  '#A8D5BA',
                  '#E8B4D4',
                ][Math.floor(Math.random() * 4)],
                animationDelay: `${Math.random() * 0.5}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Stars display */}
        <div className="relative mb-8">
          <div 
            className="w-32 h-32 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${chapter?.color}30` }}
          >
            {stars >= 3 ? (
              <Trophy className="w-16 h-16" style={{ color: chapter?.color }} />
            ) : (
              <div className="text-4xl font-bold" style={{ color: chapter?.color }}>
                {stars}
              </div>
            )}
          </div>
          
          {/* Orbiting stars */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-40 h-40">
              {[0, 1, 2].map((i) => {
                const angle = (i * 120 - 90) * (Math.PI / 180)
                const x = 50 + 45 * Math.cos(angle)
                const y = 50 + 45 * Math.sin(angle)
                
                return (
                  <Star
                    key={i}
                    className={cn(
                      "absolute w-8 h-8 transform -translate-x-1/2 -translate-y-1/2",
                      "transition-all duration-500",
                      i < stars
                        ? "fill-[var(--star-gold)] text-[var(--star-gold)] scale-100"
                        : "text-[var(--star-empty)] scale-75"
                    )}
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                      transitionDelay: `${i * 0.2}s`,
                    }}
                  />
                )
              })}
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-foreground mb-2">
          {stars === 3 && '完美通关!'}
          {stars === 2 && '表现优秀!'}
          {stars === 1 && '成功过关!'}
          {stars === 0 && '继续加油!'}
        </h1>

        <p className="text-muted-foreground mb-6">
          {chapter?.title} - {level.description}
        </p>

        {/* Stats */}
        <div className="w-full max-w-xs space-y-3 mb-8">
          <div className="flex items-center justify-between p-3 rounded-xl bg-secondary">
            <span className="text-sm text-muted-foreground">准确率</span>
            <span className="font-semibold">{accuracy.toFixed(0)}%</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-secondary">
            <span className="text-sm text-muted-foreground">获得星星</span>
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <Star
                  key={i}
                  className={cn(
                    "w-5 h-5",
                    i < stars
                      ? "fill-[var(--star-gold)] text-[var(--star-gold)]"
                      : "text-[var(--star-empty)]"
                  )}
                />
              ))}
            </div>
          </div>
          {stars < 3 && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-secondary">
              <span className="text-sm text-muted-foreground">三星目标</span>
              <span className="font-semibold">{level.targetAccuracy}%</span>
            </div>
          )}
        </div>

        {/* Chapter progress */}
        <div className="w-full max-w-xs mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">章节进度</span>
            <span className="text-sm font-medium">
              {chapterProgress.totalStars}/{chapter?.totalStars} 星
            </span>
          </div>
          <div className="h-3 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-500"
              style={{ 
                width: `${(chapterProgress.totalStars / (chapter?.totalStars || 1)) * 100}%`,
                backgroundColor: chapter?.color,
              }}
            />
          </div>
          {!chapterProgress.completed && (
            <p className="text-xs text-muted-foreground mt-1">
              再获得 {(chapter?.requiredStars || 0) - chapterProgress.totalStars} 星解锁下一章
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="w-full max-w-xs space-y-3">
          {stars < 3 && (
            <Button 
              variant="outline" 
              className="w-full"
              onClick={onRetry}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              再试一次
            </Button>
          )}
          
          {hasNextLevel ? (
            <Button 
              className="w-full text-foreground"
              style={{ backgroundColor: chapter?.color }}
              onClick={onNext}
            >
              下一关
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : canUnlockNextChapter && nextChapter ? (
            <Button 
              className="w-full text-foreground"
              style={{ backgroundColor: nextChapter.color }}
              onClick={onNext}
            >
              进入下一章: {nextChapter.title}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button 
              className="w-full"
              onClick={onHome}
            >
              <Home className="w-4 h-4 mr-2" />
              返回地图
            </Button>
          )}

          <Button 
            variant="ghost" 
            className="w-full"
            onClick={onHome}
          >
            返回章节列表
          </Button>
        </div>
      </div>

      {/* Custom animation styles */}
      <style jsx>{`
        @keyframes fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}
