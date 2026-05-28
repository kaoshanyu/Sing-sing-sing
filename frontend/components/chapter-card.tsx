"use client"

import { CHAPTERS, useGame } from "@/lib/game-context"
import { cn } from "@/lib/utils"
import { Lock, Star, ChevronRight, Sparkles } from "lucide-react"

interface ChapterCardProps {
  chapter: typeof CHAPTERS[number]
  onSelect: (chapterId: number) => void
}

export function ChapterCard({ chapter, onSelect }: ChapterCardProps) {
  const { getChapterProgress, attemptChapterSkip } = useGame()
  const progress = getChapterProgress(chapter.id)
  
  const progressPercent = progress.unlocked 
    ? Math.min(100, (progress.totalStars / chapter.requiredStars) * 100)
    : 0

  const handleClick = () => {
    if (progress.unlocked) {
      onSelect(chapter.id)
    }
  }

  const handleSkipTest = (e: React.MouseEvent) => {
    e.stopPropagation()
    // 跳关测试
    attemptChapterSkip(chapter.id)
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        "relative overflow-hidden rounded-2xl transition-all duration-300",
        progress.unlocked 
          ? "cursor-pointer hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]" 
          : "opacity-60 cursor-not-allowed"
      )}
      style={{
        background: progress.unlocked 
          ? `linear-gradient(135deg, ${chapter.color}40 0%, ${chapter.color}20 100%)`
          : undefined,
      }}
    >
      {/* Glass overlay */}
      <div className="glass-card p-4">
        <div className="flex items-start justify-between">
          {/* Left: Chapter info */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span 
                className="px-2 py-0.5 rounded-full text-xs font-medium"
                style={{ 
                  backgroundColor: chapter.color,
                  color: '#4A3728'
                }}
              >
                第{chapter.id}章
              </span>
              {progress.completed && (
                <span className="flex items-center gap-1 text-xs text-accent-foreground bg-accent/50 px-2 py-0.5 rounded-full">
                  <Sparkles className="w-3 h-3" />
                  已通关
                </span>
              )}
            </div>
            
            <h3 className="text-lg font-semibold text-foreground mb-0.5">
              {chapter.title}
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              {chapter.subtitle}
            </p>

            {/* Stars display */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "w-4 h-4",
                      i < Math.floor(progress.totalStars / 3)
                        ? "fill-[var(--star-gold)] text-[var(--star-gold)]"
                        : "text-[var(--star-empty)]"
                    )}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                {progress.totalStars}/{chapter.totalStars} 星
              </span>
            </div>

            {/* Progress bar */}
            {progress.unlocked && (
              <div className="mt-3">
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500 relative"
                    style={{ 
                      width: `${progressPercent}%`,
                      backgroundColor: chapter.color,
                    }}
                  >
                    {progressPercent > 0 && (
                      <div className="absolute inset-0 progress-shimmer" />
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  需要 {chapter.requiredStars} 星通关
                </p>
              </div>
            )}
          </div>

          {/* Right: Icon or lock */}
          <div className="ml-4">
            {progress.unlocked ? (
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: chapter.color }}
              >
                <ChevronRight className="w-6 h-6 text-foreground" />
              </div>
            ) : (
              <button
                onClick={handleSkipTest}
                className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
              >
                <Lock className="w-5 h-5 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        {/* Skip test hint for locked chapters */}
        {!progress.unlocked && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <button
              onClick={handleSkipTest}
              className="text-xs text-primary hover:text-primary/80 transition-colors"
            >
              高手测试：跳过前置章节 →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
