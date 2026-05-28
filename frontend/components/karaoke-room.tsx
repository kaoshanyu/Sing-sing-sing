"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { ChevronLeft, Play, Pause, Mic, Music2, ChevronDown, Disc3, Settings2, TrendingUp } from "lucide-react"
import type { Song, LyricLine } from "@/lib/ai-singing"

interface Props {
  onBack: () => void
}

// ====== Songs with full lyrics ======

const SONGS: (Song & { lyrics: LyricLine[] })[] = [
  {
    id: 'star', title: '小星星', artist: '儿歌精选', key: 'C', difficulty: '入门', coverInitial: '星', status: 'ready',
    lyrics: [
      { time: 0, text: "一闪一闪亮晶晶" }, { time: 4, text: "满天都是小星星" },
      { time: 8, text: "挂在天上放光明" }, { time: 12, text: "好像许多小眼睛" },
      { time: 16, text: "一闪一闪亮晶晶" }, { time: 20, text: "满天都是小星星" },
    ],
  },
  {
    id: 'moon', title: '月亮代表我的心', artist: '经典金曲', key: 'F', difficulty: '中音', coverInitial: '月', status: 'ready',
    lyrics: [
      { time: 0, text: "你问我爱你有多深" }, { time: 4.5, text: "我爱你有几分" },
      { time: 8, text: "我的情也真" }, { time: 10.5, text: "我的爱也真" },
      { time: 13, text: "月亮代表我的心" }, { time: 18, text: "你问我爱你有多深" },
      { time: 22.5, text: "我爱你有几分" }, { time: 26, text: "我的情不移" },
      { time: 28.5, text: "我的爱不变" }, { time: 31, text: "月亮代表我的心" },
      { time: 36, text: "轻轻的一个吻" }, { time: 40, text: "已经打动我的心" },
      { time: 44, text: "深深的一段情" }, { time: 48, text: "教我思念到如今" },
      { time: 52, text: "你问我爱你有多深" }, { time: 56.5, text: "我爱你有几分" },
      { time: 60, text: "你去想一想" }, { time: 62.5, text: "你去看一看" },
      { time: 65, text: "月亮代表我的心" },
    ],
  },
  {
    id: 'moment', title: '瞬间的瞬间', artist: '本地示例', key: 'G', difficulty: '中高音', coverInitial: '瞬', status: 'ready',
    lyrics: [
      { time: 0, text: "就在那一瞬间" }, { time: 4, text: "时间仿佛停止" },
      { time: 8, text: "你的笑容定格在" }, { time: 12, text: "我记忆的深处" },
      { time: 16, text: "每一个瞬间" }, { time: 20, text: "都是永恒的诗篇" },
      { time: 24, text: "时光流转不停歇" }, { time: 28, text: "唯有思念不变" },
    ],
  },
]

// Generate a reference melody (pitch values 0-1)
function generateMelody(length: number): number[] {
  const m: number[] = []
  let v = 0.5
  for (let i = 0; i < length; i++) {
    v += (Math.random() - 0.5) * 0.25
    v = Math.max(0.1, Math.min(0.9, v))
    m.push(v)
  }
  return m
}

const REF_MELODY = generateMelody(400)

export function KaraokeRoom({ onBack }: Props) {
  const [currentSong, setCurrentSong] = useState(SONGS[0])
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [showSongList, setShowSongList] = useState(false)
  const [showVolume, setShowVolume] = useState(false)

  const timerRef = useRef<ReturnType<typeof setInterval>>()
  const lyricsRef = useRef<HTMLDivElement>(null)
  const pitchCanvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const scrollRef = useRef(0)

  const duration = currentSong.lyrics[currentSong.lyrics.length - 1].time + 10

  // Current lyric line
  const currentLineIndex = (() => {
    for (let i = currentSong.lyrics.length - 1; i >= 0; i--) {
      if (currentTime >= currentSong.lyrics[i].time) return i
    }
    return 0
  })()

  const lineProgress = (() => {
    if (currentLineIndex >= currentSong.lyrics.length - 1) return 1
    const cur = currentSong.lyrics[currentLineIndex]
    const next = currentSong.lyrics[currentLineIndex + 1]
    const d = next.time - cur.time
    return d > 0 ? Math.min(1, Math.max(0, (currentTime - cur.time) / d)) : 1
  })()

  // Timer
  useEffect(() => {
    if (playing) {
      timerRef.current = setInterval(() => {
        setCurrentTime(t => { const n = t + 0.05; return n >= duration ? 0 : n })
      }, 50)
    } else clearInterval(timerRef.current)
    return () => clearInterval(timerRef.current)
  }, [playing, duration])

  useEffect(() => { setCurrentTime(0); setPlaying(false) }, [currentSong])

  // Auto-scroll lyrics
  useEffect(() => {
    if (lyricsRef.current) {
      const el = lyricsRef.current.querySelector('[data-current="true"]') as HTMLElement | null
      if (el) {
        const cr = el.getBoundingClientRect()
        const sr = lyricsRef.current.getBoundingClientRect()
        const offset = el.offsetTop - sr.top - sr.height / 2 + cr.height / 2
        lyricsRef.current.scrollTo({ top: offset, behavior: 'smooth' })
      }
    }
  }, [currentLineIndex])

  // Pitch visualizer canvas (全民K歌 style - reference vs your voice)
  useEffect(() => {
    const canvas = pitchCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      canvas.width = w * window.devicePixelRatio
      canvas.height = h * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }
    resize()
    window.addEventListener('resize', resize)

    const barSpacing = 8
    const speed = playing ? 1.2 : 0.2

    const draw = () => {
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      ctx.clearRect(0, 0, w, h)

      scrollRef.current = (scrollRef.current + speed) % barSpacing
      const centerY = h / 2
      const count = Math.ceil(w / barSpacing) + 4

      for (let i = 0; i < count; i++) {
        const idx = Math.floor((i * barSpacing + scrollRef.current) / barSpacing) % REF_MELODY.length
        const refPitch = REF_MELODY[idx]

        // Simulate user's voice: mostly follows reference but sometimes deviates
        const deviation = Math.sin(currentTime * 2 + i * 0.5) * 0.08 + Math.sin(i * 0.3) * 0.04
        const userPitch = refPitch + deviation

        const x = i * barSpacing - (scrollRef.current % barSpacing)
        const refH = 2 + Math.random() * 6
        const userH = 3 + Math.random() * 5

        const refY = centerY - refH / 2 + (refPitch - 0.5) * (h * 0.35)
        const userY = centerY - userH / 2 + (userPitch - 0.5) * (h * 0.35)

        // Reference melody bar (dim, background)
        ctx.fillStyle = playing
          ? `rgba(232, 180, 160, ${0.2 + Math.random() * 0.15})`
          : `rgba(232, 180, 160, ${0.1 + Math.random() * 0.1})`
        ctx.fillRect(x - 1, refY, 4, refH)

        // User voice bar (bright, foreground) - only when playing
        if (playing) {
          const isHigher = deviation > 0.02
          const isLower = deviation < -0.02
          ctx.fillStyle = isHigher
            ? `rgba(232, 180, 160, ${0.6 + Math.random() * 0.3})`  // warm = on pitch
            : isLower
            ? `rgba(168, 213, 186, ${0.5 + Math.random() * 0.3})`   // green = slightly off
            : `rgba(232, 180, 160, ${0.7 + Math.random() * 0.3})`   // pink = on pitch
          ctx.fillRect(x + 1, userY, 3, userH)

          // Show direction indicator on significant deviation
          if (Math.abs(deviation) > 0.06) {
            ctx.fillStyle = deviation > 0
              ? 'rgba(232, 160, 160, 0.6)'   // red = too high
              : 'rgba(160, 200, 232, 0.6)'   // blue = too low
            const indY = deviation > 0 ? userY - 4 : userY + userH + 2
            ctx.beginPath()
            ctx.arc(x + 2, indY, 2, 0, Math.PI * 2)
            ctx.fill()
          }
        }
      }

      // Center zone glow
      if (playing) {
        const grad = ctx.createLinearGradient(0, centerY - 40, 0, centerY + 40)
        grad.addColorStop(0, 'transparent')
        grad.addColorStop(0.5, 'rgba(232, 180, 160, 0.08)')
        grad.addColorStop(1, 'transparent')
        ctx.fillStyle = grad
        ctx.fillRect(0, centerY - 1, w, 2)
      }

      animRef.current = requestAnimationFrame(draw)
    }
    animRef.current = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [playing, currentTime])

  const togglePlay = useCallback(() => setPlaying(p => !p), [])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* ===== Top Bar ===== */}
      <div className="px-4 pt-5 pb-3 flex items-center gap-3 shrink-0 border-b border-border/30">
        <button onClick={onBack} className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1 text-center">
          <h1 className="text-base font-bold text-foreground">{currentSong.title}</h1>
          <p className="text-[11px] text-muted-foreground">{currentSong.artist}</p>
        </div>
        <button
          onClick={() => setShowSongList(true)}
          className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center"
        >
          <Disc3 className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* ===== Progress bar ===== */}
      <div className="px-4 pt-3 pb-2 shrink-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-muted-foreground/60 font-mono">{formatTime(currentTime)}</span>
          <span className="text-[10px] text-muted-foreground/60 font-mono">{formatTime(duration)}</span>
        </div>
        <div className="h-1 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full bg-primary transition-all duration-100" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* ===== Pitch Comparison Visualizer (全民K歌 style) ===== */}
      <div className="h-24 shrink-0 bg-secondary/30 border-y border-border/20">
        <div className="px-4 pt-1 pb-0.5 flex items-center justify-between">
          <span className="text-[9px] text-muted-foreground/50 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> 音高线
          </span>
          <span className="text-[9px] text-muted-foreground/40 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-primary/40" /> 参考
            <span className="inline-block w-2 h-2 rounded-full bg-primary" /> 你
          </span>
        </div>
        <canvas ref={pitchCanvasRef} className="w-full h-[calc(100%-18px)]" />
      </div>

      {/* ===== Lyrics Area ===== */}
      <div ref={lyricsRef} className="flex-1 overflow-y-auto px-6 scroll-smooth">
        <div className="flex flex-col items-center justify-center min-h-full py-8 gap-2">
          {currentSong.lyrics.map((line, index) => {
            const isCurrent = index === currentLineIndex
            const isPast = index < currentLineIndex
            return (
              <div
                key={index}
                data-current={isCurrent ? "true" : "false"}
                className="transition-all duration-300 text-center w-full"
                style={{ minHeight: isCurrent ? '64px' : '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                {isCurrent ? (
                  <div className="relative w-full max-w-lg mx-auto">
                    <span
                      className="block text-2xl md:text-3xl font-bold text-foreground text-center leading-relaxed tracking-wide"
                    >
                      {line.text}
                    </span>
                    <div className="mt-2 h-1 rounded-full bg-muted overflow-hidden max-w-sm mx-auto">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-100"
                        style={{ width: `${lineProgress * 100}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <span className={`block text-lg text-center leading-relaxed tracking-wide transition-all duration-300 ${
                    isPast ? 'text-muted-foreground/20' : 'text-muted-foreground/40'
                  }`}>
                    {line.text}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ===== Time ===== */}
      <div className="text-center py-1 shrink-0">
        <span className="text-xs text-muted-foreground/50 font-mono">{formatTime(currentTime)}</span>
      </div>

      {/* ===== Bottom Controls (全民K歌 style) ===== */}
      <div className="px-8 pb-8 pt-2 shrink-0 border-t border-border/20">
        <div className="flex items-center justify-center gap-10">
          {/* 音效 button */}
          <button
            onClick={() => setShowVolume(!showVolume)}
            className="flex flex-col items-center gap-1"
          >
            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
              <Settings2 className="w-5 h-5 text-muted-foreground" />
            </div>
            <span className="text-[10px] text-muted-foreground/60">音效</span>
          </button>

          {/* Big play button */}
          <button
            onClick={togglePlay}
            className="w-20 h-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center
              hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-primary/30"
          >
            {playing ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
          </button>

          {/* 伴唱 button */}
          <button
            onClick={() => setShowVolume(!showVolume)}
            className="flex flex-col items-center gap-1"
          >
            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
              <Mic className="w-5 h-5 text-muted-foreground" />
            </div>
            <span className="text-[10px] text-muted-foreground/60">伴唱</span>
          </button>
        </div>

        {/* Volume panel */}
        {showVolume && (
          <div className="mt-4 w-full max-w-xs mx-auto bg-secondary/70 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Mic className="w-4 h-4 text-muted-foreground shrink-0" />
              <input type="range" min={0} max={100} defaultValue={80}
                className="flex-1 h-1 rounded-full appearance-none bg-muted cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3
                  [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-primary" />
            </div>
            <div className="flex items-center gap-3">
              <Music2 className="w-4 h-4 text-muted-foreground shrink-0" />
              <input type="range" min={0} max={100} defaultValue={70}
                className="flex-1 h-1 rounded-full appearance-none bg-muted cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3
                  [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-primary" />
            </div>
          </div>
        )}
      </div>

      {/* ===== Song selection overlay ===== */}
      {showSongList && (
        <div className="absolute inset-0 z-60 bg-background/80 backdrop-blur-sm flex items-center justify-center p-8">
          <div className="w-full max-w-sm bg-card rounded-2xl overflow-hidden border border-border/50 shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
              <h3 className="text-foreground font-bold">选择歌曲</h3>
              <button onClick={() => setShowSongList(false)} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="p-3 space-y-2 max-h-[400px] overflow-y-auto">
              {SONGS.map(song => (
                <button key={song.id}
                  onClick={() => { setCurrentSong(song); setShowSongList(false) }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                    currentSong.id === song.id ? 'bg-primary/10 border border-primary/30' : 'hover:bg-secondary/50 border border-transparent'
                  }`}>
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary text-base font-bold shrink-0">
                    {song.coverInitial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground font-medium truncate">{song.title}</p>
                    <p className="text-xs text-muted-foreground">{song.artist} · {song.key}调</p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/15 text-accent-foreground">{song.difficulty}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
