"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { ChevronLeft, Play, Pause, Mic, Music2, Volume2 } from "lucide-react"
import type { Song, ConversionResult } from "@/lib/ai-singing"

interface Props {
  song: Song
  conversionResult: ConversionResult
  onBack: () => void
}

// Generate a melody pattern (pitch values 0-1)
function generateMelody(length: number): number[] {
  const melody: number[] = []
  let current = 0.5
  for (let i = 0; i < length; i++) {
    current += (Math.random() - 0.5) * 0.3
    current = Math.max(0.1, Math.min(0.9, current))
    melody.push(current)
  }
  return melody
}

// Pre-generate melody - use a seed-based approach for consistency
const MELODY = generateMelody(300)

interface RollingBar {
  x: number
  pitch: number
  height: number
  opacity: number
}

export function SingalongFullScreen({ song, conversionResult, onBack }: Props) {
  const [playing, setPlaying] = useState(false)
  const [aiVolume, setAiVolume] = useState(80)
  const [accVolume, setAccVolume] = useState(80)
  const [aiEnabled, setAiEnabled] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [showVolume, setShowVolume] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const scrollOffsetRef = useRef(0)
  const audioRef = useRef<HTMLAudioElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval>>()
  const barsRef = useRef<RollingBar[]>([])

  const duration = 210 // seconds (mock)

  // Initialize bars
  useEffect(() => {
    const bars: RollingBar[] = []
    const barSpacing = 12
    const count = Math.ceil(window.innerWidth / barSpacing) + 10
    for (let i = 0; i < count; i++) {
      bars.push({
        x: i * barSpacing,
        pitch: MELODY[i % MELODY.length],
        height: 4 + Math.random() * 12,
        opacity: 0.3 + Math.random() * 0.5,
      })
    }
    barsRef.current = bars
  }, [])

  // Canvas animation loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = canvas.clientWidth * window.devicePixelRatio
      canvas.height = canvas.clientHeight * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }
    resize()
    window.addEventListener('resize', resize)

    const barSpacing = 12
    const speed = playing ? 1.8 : 0.3

    const draw = () => {
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      ctx.clearRect(0, 0, w, h)

      scrollOffsetRef.current = (scrollOffsetRef.current + speed) % barSpacing

      // Update bar positions
      const centerY = h / 2
      const bars: RollingBar[] = []
      const count = Math.ceil(w / barSpacing) + 4
      for (let i = 0; i < count; i++) {
        const idx = Math.floor((i * barSpacing + scrollOffsetRef.current) / barSpacing) % MELODY.length
        bars.push({
          x: i * barSpacing - (scrollOffsetRef.current % barSpacing),
          pitch: MELODY[idx],
          height: 4 + Math.random() * 12, // slight variance
          opacity: 0.3 + Math.random() * 0.4,
        })
      }
      barsRef.current = bars

      // Draw bars
      const gradient = ctx.createLinearGradient(0, 0, 0, h)
      gradient.addColorStop(0, 'rgba(232, 180, 160, 0.15)')
      gradient.addColorStop(0.5, 'rgba(232, 180, 160, 0.6)')
      gradient.addColorStop(1, 'rgba(168, 213, 186, 0.15)')

      bars.forEach(bar => {
        const barHeight = bar.height * 4
        const y = centerY - barHeight / 2 + (bar.pitch - 0.5) * (h * 0.5)
        const alpha = Math.min(1, bar.opacity * (playing ? 1.2 : 0.6))
        ctx.fillStyle = `rgba(232, 180, 160, ${alpha})`
        ctx.fillRect(bar.x, y, 4, barHeight)
      })

      // Center glow line
      if (playing) {
        const grad = ctx.createLinearGradient(0, 0, 0, h)
        grad.addColorStop(0, 'transparent')
        grad.addColorStop(0.5, 'rgba(232, 180, 160, 0.3)')
        grad.addColorStop(1, 'transparent')
        ctx.fillStyle = grad
        ctx.fillRect(w / 2 - 1, 0, 2, h)
      }

      animRef.current = requestAnimationFrame(draw)
    }
    animRef.current = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [playing])

  // Timer
  useEffect(() => {
    if (playing) {
      timerRef.current = setInterval(() => {
        setCurrentTime(t => Math.min(t + 1, duration))
      }, 1000)
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [playing, duration])

  const togglePlay = useCallback(() => {
    setPlaying(p => !p)
  }, [])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-[#2A2420] to-[#1A1614] flex flex-col">
      {/* Hidden audio */}
      <audio
        ref={audioRef}
        src={conversionResult.urls.final_mix}
        loop
        className="hidden"
      />

      {/* Top bar */}
      <div className="px-4 pt-5 pb-3 flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <div className="flex-1 text-center">
          <h1 className="text-base font-bold text-white">{song.title}</h1>
          <p className="text-xs text-white/50">{song.artist}</p>
        </div>
        <span className="text-xs text-white/60 font-mono">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>

      {/* Progress bar */}
      <div className="px-4 mb-2">
        <div className="h-1 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Rolling pitch visualizer */}
      <div className="flex-1 relative">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
        />

        {/* Center lyrics area */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center px-8">
            {playing ? (
              <div>
                <p className="text-lg text-white/80 font-medium mb-2">用你的AI音色唱出这首歌</p>
                <div className="flex items-center justify-center gap-1.5">
                  {[1, 2, 3, 4, 5, 4, 3, 2, 1].map((h, i) => (
                    <div
                      key={i}
                      className="w-1 bg-primary/80 rounded-full"
                      style={{
                        height: `${h * 4}px`,
                        animation: `pulse-bar 0.6s ${i * 0.08}s infinite alternate`
                      }}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-base text-white/40">点击下方按钮开始跟唱</p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="px-6 pb-8 pt-4 flex flex-col items-center gap-4">
        {/* Volume controls (expandable) */}
        {showVolume && (
          <div className="w-full max-w-sm bg-white/10 rounded-2xl p-4 space-y-3 animate-in slide-in-from-bottom-2">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setAiEnabled(!aiEnabled)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  aiEnabled ? 'bg-primary/30 text-primary' : 'bg-white/10 text-white/50'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                领唱
              </button>
              <div className="flex-1 flex items-center gap-2">
                <Volume2 className="w-3 h-3 text-white/40 shrink-0" />
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={aiEnabled ? aiVolume : 0}
                  onChange={e => setAiVolume(Number(e.target.value))}
                  className="flex-1 h-1 rounded-full appearance-none bg-white/20 cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3
                    [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-primary"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/10 text-white/50">
                <Music2 className="w-3.5 h-3.5" />
                伴奏
              </span>
              <div className="flex-1 flex items-center gap-2">
                <Volume2 className="w-3 h-3 text-white/40 shrink-0" />
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={accVolume}
                  onChange={e => setAccVolume(Number(e.target.value))}
                  className="flex-1 h-1 rounded-full appearance-none bg-white/20 cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3
                    [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-primary"
                />
              </div>
            </div>
          </div>
        )}

        {/* Main controls row */}
        <div className="flex items-center justify-center gap-8">
          {/* Volume toggle */}
          <button
            onClick={() => setShowVolume(v => !v)}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <Volume2 className="w-5 h-5 text-white/70" />
          </button>

          {/* Big play button - 全民K歌 style */}
          <button
            onClick={togglePlay}
            className="w-20 h-20 rounded-full bg-primary flex items-center justify-center
              hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-primary/30"
          >
            {playing ? (
              <Pause className="w-9 h-9 text-white" />
            ) : (
              <Play className="w-9 h-9 text-white ml-1" />
            )}
          </button>

          {/* AI领唱 toggle */}
          <button
            onClick={() => setAiEnabled(!aiEnabled)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              aiEnabled ? 'bg-primary/30 text-primary' : 'bg-white/10 text-white/50'
            }`}
          >
            <Mic className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
