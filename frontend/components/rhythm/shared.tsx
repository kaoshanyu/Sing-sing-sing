"use client"

import { useRef, useCallback, useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Grade, GRADE_CONFIG, NoteType } from "./types"
import { Volume2, Lock, Play, CheckCircle2 } from "lucide-react"

// ===== Difficulty Stars =====
export function DifficultyStars({ difficulty, size = "md" }: { difficulty: number; size?: "sm" | "md" | "lg" }) {
  const sizeMap = { sm: "w-3.5 h-3.5", md: "w-4 h-4", lg: "w-5 h-5" }
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={cn(sizeMap[size], i < difficulty ? "text-amber-400" : "text-muted-foreground/30")}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

// ===== Grade Badge =====
export function GradeBadge({ grade, size = "md" }: { grade: Grade; size?: "sm" | "md" | "lg" }) {
  const sizeMap = { sm: "w-7 h-7 text-xs", md: "w-10 h-10 text-sm", lg: "w-14 h-14 text-lg" }
  return (
    <div
      className={cn(
        "rounded-full border-2 flex items-center justify-center font-bold shrink-0",
        sizeMap[size],
        GRADE_CONFIG[grade].color,
      )}
      style={{ borderColor: "currentColor" }}
    >
      {grade}
    </div>
  )
}

// ===== Tap Pad (for all tap-based question types) =====
interface TapPadProps {
  onClick: () => void
  disabled?: boolean
  hitCount: number
  hintText: string
  icon?: React.ReactNode
  className?: string
}

export function TapPad({ onClick, disabled, hitCount, hintText, icon, className }: TapPadProps) {
  const [flash, setFlash] = useState(false)
  const handleClick = useCallback(() => {
    if (disabled) return
    setFlash(true)
    onClick()
    setTimeout(() => setFlash(false), 150)
  }, [disabled, onClick])

  return (
    <div className={cn("flex-1 flex flex-col items-center justify-center gap-4 select-none", className)}>
      <div
        onClick={handleClick}
        className={cn(
          "w-full max-w-sm min-h-[280px] rounded-3xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-100 select-none",
          "bg-card border-2 border-border/50",
          flash && "bg-primary/15 scale-[0.99]",
          disabled ? "opacity-50" : "hover:border-primary/30 active:scale-[0.99]",
        )}
      >
        {icon && <div className="text-4xl">{icon}</div>}
        {!icon && <Volume2 className="w-10 h-10 text-primary" />}
        <span className="text-5xl font-black text-primary">{hitCount}</span>
        <span className="text-sm text-muted-foreground">点击次数</span>
        <span className="text-base text-muted-foreground mt-1">{hintText}</span>
      </div>
    </div>
  )
}

// ===== Option Buttons (for RHYTHM_CLASSIFICATION) =====
interface OptionButtonsProps {
  options: string[]
  selected: string | null
  onSelect: (option: string) => void
  disabled?: boolean
}

export function OptionButtons({ options, selected, onSelect, disabled }: OptionButtonsProps) {
  return (
    <div className="flex flex-col gap-3 w-full max-w-sm mx-auto">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onSelect(opt)}
          disabled={disabled}
          className={cn(
            "w-full h-20 rounded-2xl text-2xl font-bold transition-all border-2",
            selected === opt
              ? "bg-primary border-primary text-primary-foreground"
              : "bg-card border-border/50 text-foreground hover:border-primary/50",
            disabled && "opacity-50",
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

// ===== Note Pool Cards (for RHYTHM_PUZZLE) =====
interface NotePoolCardProps {
  noteType: NoteType
  durationMs: number
  name: string
  symbol: string
  onClick: () => void
}

export function NotePoolCard({ noteType, durationMs, name, symbol, onClick }: NotePoolCardProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl bg-card border border-border/50 hover:border-primary/50 transition-colors min-h-[80px]"
    >
      <span className="text-xl">{symbol}</span>
      <span className="text-sm font-medium text-foreground">{name}</span>
      <span className="text-xs text-muted-foreground">{durationMs}ms</span>
    </button>
  )
}

// ===== Score Sheet Card (for SPOT_THE_BUG) =====
interface ScoreSheetCardProps {
  index: number
  noteType: string
  isSelected: boolean
  onClick: () => void
  disabled?: boolean
}

export function ScoreSheetCard({ index, noteType, isSelected, onClick, disabled }: ScoreSheetCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex flex-col items-center justify-center gap-1 p-3 rounded-xl border-2 transition-all min-w-[72px] min-h-[72px]",
        isSelected
          ? "bg-destructive/15 border-destructive text-destructive"
          : "bg-card border-border/50 text-foreground hover:border-primary/50",
      )}
    >
      <span className="text-lg font-bold">#{index + 1}</span>
      <span className="text-xs font-medium">{noteType}</span>
    </button>
  )
}

// ===== Metronome Count-In =====
export function useMetronome() {
  const playCountIn = useCallback((bpm: number, beats: number): Promise<void> => {
    return new Promise((resolve) => {
      const ctx = new AudioContext()
      const interval = 60000 / bpm

      beats = Math.max(1, beats)

      for (let i = 0; i < beats; i++) {
        const time = ctx.currentTime + (i * interval) / 1000
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = "sine"
        osc.frequency.value = i === 0 ? 880 : 660
        gain.gain.setValueAtTime(0.3, time)
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(time)
        osc.stop(time + 0.1)
      }

      const totalTime = (beats * interval) / 1000
      setTimeout(() => {
        ctx.close()
        resolve()
      }, totalTime * 1000 + 100)
    })
  }, [])

  return { playCountIn }
}

// ===== Countdown Timer Display =====
export function useCountdownTimer(durationMs: number, onTimeUp: () => void) {
  const [remaining, setRemaining] = useState(durationMs)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const start = useCallback(() => {
    const startTime = performance.now()
    intervalRef.current = setInterval(() => {
      const elapsed = performance.now() - startTime
      const left = Math.max(0, durationMs - elapsed)
      setRemaining(left)
      if (left <= 0) {
        if (intervalRef.current) clearInterval(intervalRef.current)
        onTimeUp()
      }
    }, 100)
  }, [durationMs, onTimeUp])
  const stop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
  }, [])
  return { remaining, start, stop, setRemaining }
}

// ===== Confirm Dialog (for skipping locked content) =====
interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmText: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ open, title, description, confirmText, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onCancel() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-destructive" />
            {title}
          </DialogTitle>
          <DialogDescription className="mt-2">{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onCancel}>取消</Button>
          <Button variant="default" onClick={onConfirm}>{confirmText}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ===== Tutorial Modal =====
interface TutorialModalProps {
  open: boolean
  title: string
  description: string
  onStart: () => void
}

export function TutorialModal({ open, title, description, onStart }: TutorialModalProps) {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-sm" showCloseButton={false}>
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Play className="w-5 h-5 text-primary" />
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription className="text-base leading-relaxed mt-2">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-2">
          <Button size="lg" className="w-full text-base" onClick={onStart}>
            知道了，开始挑战
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ===== Skeleton Card =====
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl bg-muted animate-pulse", className)} />
  )
}

// ===== Small Badge for BPM / Time Signature / Level info =====
export function InfoTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-secondary text-secondary-foreground">
      {children}
    </span>
  )
}

// ===== Empty State =====
interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center gap-3">
      <div className="text-muted-foreground/50">{icon}</div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      {description && <p className="text-sm text-muted-foreground max-w-xs">{description}</p>}
      {action}
    </div>
  )
}

// ===== Error State =====
interface ErrorStateProps {
  message: string
  onRetry?: () => void
  onBack?: () => void
}

export function ErrorState({ message, onRetry, onBack }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center gap-4">
      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
        <span className="text-2xl">!</span>
      </div>
      <p className="text-muted-foreground">{message}</p>
      <div className="flex gap-3">
        {onRetry && <Button variant="default" onClick={onRetry}>重新加载</Button>}
        {onBack && <Button variant="outline" onClick={onBack}>返回</Button>}
      </div>
    </div>
  )
}

// ===== Hit Times Preview (collapsible debug panel) =====
export function HitTimesPreview({ timesMs }: { timesMs: number[] }) {
  const [open, setOpen] = useState(false)
  if (!timesMs || timesMs.length === 0) return null
  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen(!open)}
        className="text-xs text-muted-foreground hover:text-foreground underline"
      >
        {open ? "收起" : "展开"}目标时间点参考 ({timesMs.length})
      </button>
      {open && (
        <div className="mt-2 flex flex-wrap gap-1">
          {timesMs.map((t, i) => (
            <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">
              {t}ms
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ===== Beat Visualizer (for UPBEAT_TRAINING) =====
export function BeatVisualizer({ bpm, isPlaying }: { bpm: number; isPlaying: boolean }) {
  const [beatIndex, setBeatIndex] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (isPlaying) {
      const interval = (60000 / bpm) / 2
      intervalRef.current = setInterval(() => {
        setBeatIndex((prev) => (prev + 1) % 4)
      }, interval)
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isPlaying, bpm])

  useEffect(() => {
    if (!isPlaying) {
      setBeatIndex(0)
    }
  }, [isPlaying])

  return (
    <div className="flex gap-3 justify-center">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className={cn(
            "w-3 h-3 rounded-full transition-all duration-75",
            beatIndex === i
              ? i % 2 === 0
                ? "bg-muted-foreground scale-110"
                : "bg-primary scale-110"
              : "bg-border",
          )}
        />
      ))}
    </div>
  )
}
