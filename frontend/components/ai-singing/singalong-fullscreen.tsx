"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { ChevronLeft, Play, Pause, Mic, Music2, Volume2, Square, RotateCcw } from "lucide-react"
import type { Song, ConversionResult } from "@/lib/ai-singing"

interface Props {
  song: Song
  conversionResult: ConversionResult
  onBack: () => void
}

// Generate a smooth melody contour (pitch values 0-1) with musical phrases
function generateMelody(length: number): number[] {
  const melody: number[] = []
  let current = 0.5
  let phrase = 0
  for (let i = 0; i < length; i++) {
    phrase += (Math.random() - 0.5) * 0.08
    phrase = Math.max(-1, Math.min(1, phrase))
    current += phrase * 0.02 + (Math.random() - 0.5) * 0.06
    current = Math.max(0.15, Math.min(0.85, current))
    melody.push(current)
  }
  return melody
}

const MELODY = generateMelody(300)

interface RecordedTake {
  id: number
  url: string
  duration: number
}

export function SingalongFullScreen({ song, conversionResult, onBack }: Props) {
  const [playing, setPlaying] = useState(false)
  const [aiVolume, setAiVolume] = useState(80)
  const [accVolume, setAccVolume] = useState(80)
  const [aiEnabled, setAiEnabled] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [showVolume, setShowVolume] = useState(false)

  // Recording state
  const [recording, setRecording] = useState(false)
  const [recordTime, setRecordTime] = useState(0)
  const [recordedTakes, setRecordedTakes] = useState<RecordedTake[]>([])
  const [playingTakeId, setPlayingTakeId] = useState<number | null>(null)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const scrollOffsetRef = useRef(0)
  const audioRef = useRef<HTMLAudioElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval>>()
  const lyricsContainerRef = useRef<HTMLDivElement>(null)

  // Recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const recordTimerRef = useRef<ReturnType<typeof setInterval>>()
  const recordStreamRef = useRef<MediaStream | null>(null)
  const recordAudioRef = useRef<HTMLAudioElement>(null)
  const takeIdRef = useRef(0)

  const duration = song.lyrics.length > 0
    ? Math.max(song.lyrics[song.lyrics.length - 1].time + 5, 30)
    : 30

  // Find current lyric line index
  const currentLyricIndex = (() => {
    const lyrics = song.lyrics
    for (let i = lyrics.length - 1; i >= 0; i--) {
      if (currentTime >= lyrics[i].time) return i
    }
    return -1
  })()

  // Auto-scroll lyrics to keep current line centered
  useEffect(() => {
    if (currentLyricIndex < 0 || !lyricsContainerRef.current) return
    const container = lyricsContainerRef.current
    const activeEl = container.children[currentLyricIndex] as HTMLElement
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
  }, [currentLyricIndex])

  // Canvas animation loop — 全民K歌 style scrolling pitch contour
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

    // Pre-compute smooth pitch curve
    const pitchPoints = MELODY.map((p, i, arr) => {
      const prev = arr[Math.max(0, i - 1)]
      const next = arr[Math.min(arr.length - 1, i + 1)]
      return (prev + p + next) / 3
    })

    const draw = () => {
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      ctx.clearRect(0, 0, w, h)

      const speed = playing ? 1.2 : 0.2
      scrollOffsetRef.current = (scrollOffsetRef.current + speed)

      const stepX = w / 120
      const centerY = h / 2
      const rangeY = h * 0.6

      // Center reference line
      ctx.strokeStyle = 'rgba(232, 180, 160, 0.1)'
      ctx.lineWidth = 1
      ctx.setLineDash([3, 4])
      ctx.beginPath()
      ctx.moveTo(0, centerY)
      ctx.lineTo(w, centerY)
      ctx.stroke()
      ctx.setLineDash([])

      // Pitch contour — scrolls from right to left
      const startIdx = Math.floor(scrollOffsetRef.current)
      ctx.beginPath()
      for (let i = 0; i <= w / stepX + 2; i++) {
        const idx = Math.max(0, Math.min(pitchPoints.length - 1, startIdx + i))
        const x = w - i * stepX
        const y = centerY + (pitchPoints[idx] - 0.5) * rangeY
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }

      // Outer glow
      ctx.shadowColor = 'rgba(232, 180, 160, 0.3)'
      ctx.shadowBlur = 8
      ctx.strokeStyle = '#E8B4A0'
      ctx.lineWidth = 2.5
      ctx.stroke()

      // Inner bright line
      ctx.shadowBlur = 0
      ctx.strokeStyle = 'rgba(255, 220, 200, 0.6)'
      ctx.lineWidth = 1.5
      ctx.stroke()

      // Vertical scan line at center
      if (playing) {
        const scanX = w / 2
        const grad = ctx.createLinearGradient(scanX, 0, scanX, h)
        grad.addColorStop(0, 'transparent')
        grad.addColorStop(0.3, 'rgba(232, 180, 160, 0.3)')
        grad.addColorStop(0.5, 'rgba(232, 180, 160, 0.6)')
        grad.addColorStop(0.7, 'rgba(232, 180, 160, 0.3)')
        grad.addColorStop(1, 'transparent')
        ctx.fillStyle = grad
        ctx.fillRect(scanX - 1.5, 0, 3, h)

        // Bright dot on the pitch line at scan position
        const beatIdx = Math.max(0, Math.min(pitchPoints.length - 1, startIdx + Math.floor(w / 2 / stepX)))
        const dotY = centerY + (pitchPoints[beatIdx] - 0.5) * rangeY
        ctx.shadowColor = 'rgba(232, 180, 160, 0.8)'
        ctx.shadowBlur = 10
        ctx.fillStyle = '#FFE8DD'
        ctx.beginPath()
        ctx.arc(w / 2, dotY, 3.5, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
      }

      animRef.current = requestAnimationFrame(draw)
    }
    animRef.current = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [playing])

  // Timer for playback
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

  // Recording timer
  useEffect(() => {
    if (recording) {
      recordTimerRef.current = setInterval(() => {
        setRecordTime(t => t + 1)
      }, 1000)
    } else {
      clearInterval(recordTimerRef.current)
    }
    return () => clearInterval(recordTimerRef.current)
  }, [recording])

  const togglePlay = useCallback(() => {
    if (playingTakeId !== null) {
      // If a take is playing, stop it
      recordAudioRef.current?.pause()
      setPlayingTakeId(null)
    }
    setPlaying(p => !p)
  }, [playingTakeId])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  // ===== Recording =====
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      recordStreamRef.current = stream
      chunksRef.current = []
      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = e => chunksRef.current.push(e.data)
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(blob)
        takeIdRef.current++
        setRecordedTakes(prev => [...prev, {
          id: takeIdRef.current,
          url,
          duration: recordTime,
        }])
        setRecordTime(0)
        stream.getTracks().forEach(t => t.stop())
        recordStreamRef.current = null
      }

      recorder.start()
      setRecording(true)
      setRecordTime(0)
    } catch {
      alert('需要麦克风权限才能录音')
    }
  }, [recordTime])

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop()
    setRecording(false)
    clearInterval(recordTimerRef.current)
  }, [])

  const playTake = useCallback((take: RecordedTake) => {
    if (recordAudioRef.current) {
      recordAudioRef.current.src = take.url
      recordAudioRef.current.play()
      setPlayingTakeId(take.id)
      recordAudioRef.current.onended = () => setPlayingTakeId(null)
    }
  }, [])

  const clearTakes = useCallback(() => {
    recordedTakes.forEach(t => URL.revokeObjectURL(t.url))
    setRecordedTakes([])
    setPlayingTakeId(null)
  }, [recordedTakes])

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-[#2A2420] to-[#1A1614] flex flex-col">
      {/* Hidden audio for demo playback */}
      <audio
        ref={audioRef}
        src={conversionResult.urls.final_mix}
        loop
        className="hidden"
      />

      {/* Top bar */}
      <div className="px-4 pt-5 pb-3 flex items-center gap-3 shrink-0">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <div className="flex-1 text-center">
          <h1 className="text-base font-bold text-white">{song.title}</h1>
          <p className="text-xs text-white/50">{song.artist} · {song.key}调</p>
        </div>
        <span className="text-xs text-white/60 font-mono">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>

      {/* Progress bar */}
      <div className="px-4 mb-2 shrink-0">
        <div className="h-1 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Main area: pitch visualizer on top, lyrics below */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Pitch visualizer — thin karaoke-style strip */}
        <div className="relative h-14 shrink-0">
          <canvas
            ref={canvasRef}
            className="w-full h-full"
          />
        </div>

        {/* Lyrics — remaining space */}
        <div className="flex-1 relative min-h-0">
          <div className="absolute inset-0 flex flex-col items-center justify-center px-8">
            <div
              ref={lyricsContainerRef}
              className="w-full max-w-lg max-h-full overflow-y-auto scrollbar-hide py-6"
              style={{ scrollbarWidth: 'none' }}
            >
              {song.lyrics.length === 0 && (
                <p className="text-base text-white/40 text-center">暂无歌词</p>
              )}
              {song.lyrics.map((line, i) => {
                const isCurrent = i === currentLyricIndex && currentLyricIndex >= 0
                const isPast = i < currentLyricIndex
                const isUpcoming = i > currentLyricIndex

                const timeUntil = isUpcoming ? line.time - currentTime : 0
                const opacity = isCurrent ? 1 : isPast ? 0.5 : Math.min(1, Math.max(0.2, 1 - timeUntil / 4))
                const scale = isCurrent ? 1 : 0.85

                return (
                  <div
                    key={i}
                    className="text-center transition-all duration-300 py-2.5"
                    style={{ opacity, transform: `scale(${scale})` }}
                  >
                    <p
                      className={`font-bold transition-all duration-300 ${
                        isCurrent
                          ? 'text-white text-2xl drop-shadow-lg'
                          : isPast
                          ? 'text-white/40 text-base'
                          : 'text-white/20 text-base'
                      }`}
                    >
                      {line.text}
                    </p>
                    {/* Underline for current line — 全民K歌 style */}
                    {isCurrent && (
                      <div className="h-0.5 w-16 mx-auto mt-1.5 rounded-full bg-primary/60" />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

        </div>
      </div>

      {/* Recorded takes bar */}
      {recordedTakes.length > 0 && (
        <div className="px-4 py-2 shrink-0">
          <div className="bg-white/10 rounded-xl p-2">
            <div className="flex items-center gap-2 overflow-x-auto">
              {recordedTakes.map(take => {
                const isPlaying = playingTakeId === take.id
                return (
                  <button
                    key={take.id}
                    onClick={() => isPlaying ? (recordAudioRef.current?.pause(), setPlayingTakeId(null)) : playTake(take)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors shrink-0 ${
                      isPlaying
                        ? 'bg-primary/30 text-primary'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    {isPlaying ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                    录音 #{take.id} ({formatTime(take.duration)})
                  </button>
                )
              })}
              <button
                onClick={clearTakes}
                className="px-2 py-1.5 rounded-lg text-xs text-white/40 hover:text-white/70 hover:bg-white/10 transition-colors shrink-0"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden audio for take playback */}
      <audio ref={recordAudioRef} className="hidden" />

      {/* Bottom controls */}
      <div className="px-6 pb-6 pt-3 shrink-0 flex flex-col items-center">
        {/* Volume controls — fixed overlay above controls */}
        {showVolume && (
          <div className="fixed left-1/2 -translate-x-1/2 bottom-28 z-50 w-[90%] max-w-sm bg-[#2A2420] rounded-2xl p-3 space-y-2 shadow-2xl border border-white/10">
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
        <div className="flex items-center justify-center gap-5">
          {/* Record button */}
          <button
            onClick={recording ? stopRecording : startRecording}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              recording
                ? 'bg-destructive text-white scale-110 animate-pulse shadow-lg shadow-destructive/30'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            {recording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Volume toggle */}
          <button
            onClick={() => setShowVolume(v => !v)}
            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <Volume2 className="w-4 h-4 text-white/70" />
          </button>

          {/* Big play button */}
          <button
            onClick={togglePlay}
            className="w-16 h-16 rounded-full bg-primary flex items-center justify-center
              hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-primary/30"
          >
            {playing ? (
              <Pause className="w-7 h-7 text-white" />
            ) : (
              <Play className="w-7 h-7 text-white ml-1" />
            )}
          </button>

          {/* AI领唱 toggle */}
          <button
            onClick={() => setAiEnabled(!aiEnabled)}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
              aiEnabled ? 'bg-primary/30 text-primary' : 'bg-white/10 text-white/50'
            }`}
          >
            <Mic className="w-4 h-4" />
          </button>

          {/* Recording indicator */}
          {recording && (
            <div className="flex items-center gap-1.5 text-xs text-destructive">
              <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
              {formatTime(recordTime)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
