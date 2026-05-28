"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Mic, Volume2, Pause } from "lucide-react"

// 音符频率表 C2–C6
const NOTES = [
  { note: 'C2', freq: 65.41 }, { note: 'C#2', freq: 69.30 }, { note: 'D2', freq: 73.42 }, { note: 'D#2', freq: 77.78 }, { note: 'E2', freq: 82.41 }, { note: 'F2', freq: 87.31 }, { note: 'F#2', freq: 92.50 }, { note: 'G2', freq: 98.00 }, { note: 'G#2', freq: 103.83 }, { note: 'A2', freq: 110.00 }, { note: 'A#2', freq: 116.54 }, { note: 'B2', freq: 123.47 },
  { note: 'C3', freq: 130.81 }, { note: 'C#3', freq: 138.59 }, { note: 'D3', freq: 146.83 }, { note: 'D#3', freq: 155.56 }, { note: 'E3', freq: 164.81 }, { note: 'F3', freq: 174.61 }, { note: 'F#3', freq: 185.00 }, { note: 'G3', freq: 196.00 }, { note: 'G#3', freq: 207.65 }, { note: 'A3', freq: 220.00 }, { note: 'A#3', freq: 233.08 }, { note: 'B3', freq: 246.94 },
  { note: 'C4', freq: 261.63 }, { note: 'C#4', freq: 277.18 }, { note: 'D4', freq: 293.66 }, { note: 'D#4', freq: 311.13 }, { note: 'E4', freq: 329.63 }, { note: 'F4', freq: 349.23 }, { note: 'F#4', freq: 369.99 }, { note: 'G4', freq: 392.00 }, { note: 'G#4', freq: 415.30 }, { note: 'A4', freq: 440.00 }, { note: 'A#4', freq: 466.16 }, { note: 'B4', freq: 493.88 },
  { note: 'C5', freq: 523.25 }, { note: 'C#5', freq: 554.37 }, { note: 'D5', freq: 587.33 }, { note: 'D#5', freq: 622.25 }, { note: 'E5', freq: 659.25 }, { note: 'F5', freq: 698.46 }, { note: 'F#5', freq: 739.99 }, { note: 'G5', freq: 783.99 }, { note: 'G#5', freq: 830.61 }, { note: 'A5', freq: 880.00 }, { note: 'A#5', freq: 932.33 }, { note: 'B5', freq: 987.77 },
  { note: 'C6', freq: 1046.50 },
]

const NOTE_NAMES = NOTES.map(n => n.note)
const TOTAL_NOTES = NOTES.length

function freqToNote(freq: number): { note: string; index: number; cents: number } {
  // Find closest note by frequency
  let closest = 0
  let minDiff = Infinity
  for (let i = 0; i < TOTAL_NOTES; i++) {
    const diff = Math.abs(freq - NOTES[i].freq)
    if (diff < minDiff) {
      minDiff = diff
      closest = i
    }
  }
  // Compute cents deviation
  const ratio = freq / NOTES[closest].freq
  const cents = 1200 * Math.log2(ratio)
  return { note: NOTES[closest].note, index: closest, cents: Math.round(cents) }
}

function midiToNoteName(midi: number): string {
  const names = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
  return names[midi % 12] + Math.floor(midi / 12)
}

interface PitchMeterProps {
  onComplete?: (lowest: string, highest: string) => void
  /** 跟踪模式：记录最低/最高音。false = 仅显示实时音高 */
  tracking?: boolean
  /** 初始音域（回显已有数据时用） */
  initialRange?: { lowest: string; highest: string }
  autoStart?: boolean
}

export function PitchMeter({ onComplete, tracking = false, initialRange, autoStart = false }: PitchMeterProps) {
  const [isActive, setIsActive] = useState(false)
  const [currentNote, setCurrentNote] = useState<{ note: string; index: number; cents: number } | null>(null)
  const [currentFreq, setCurrentFreq] = useState<number | null>(null)
  const [lowestIndex, setLowestIndex] = useState<number | null>(null)
  const [highestIndex, setHighestIndex] = useState<number | null>(null)
  const [hasSignal, setHasSignal] = useState(false)
  const [permissionError, setPermissionError] = useState(false)

  // Refs for audio resources
  const streamRef = useRef<MediaStream | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const rafRef = useRef<number | null>(null)
  const isActiveRef = useRef(false)

  // Init range from initialRange
  useEffect(() => {
    if (initialRange) {
      const li = NOTE_NAMES.indexOf(initialRange.lowest)
      const hi = NOTE_NAMES.indexOf(initialRange.highest)
      if (li >= 0) setLowestIndex(li)
      if (hi >= 0) setHighestIndex(hi)
    }
  }, [initialRange])

  // Cleanup
  useEffect(() => {
    return () => { stop() }
  }, [])

  const stop = useCallback(() => {
    isActiveRef.current = false
    setIsActive(false)
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close()
      audioCtxRef.current = null
    }
  }, [])

  const start = useCallback(async () => {
    setPermissionError(false)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      })
      streamRef.current = stream

      const ctx = new AudioContext()
      audioCtxRef.current = ctx
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 2048
      source.connect(analyser)

      isActiveRef.current = true
      setIsActive(true)
      detectLoop(analyser, ctx)
    } catch {
      setPermissionError(true)
    }
  }, [])

  // Auto-start
  useEffect(() => {
    if (autoStart) { start() }
  }, [autoStart, start])

  const detectLoop = (analyser: AnalyserNode, ctx: AudioContext) => {
    const buffer = new Float32Array(analyser.fftSize)

    const tick = () => {
      if (!isActiveRef.current) return
      analyser.getFloatTimeDomainData(buffer)

      // RMS
      let sumSq = 0
      for (let i = 0; i < buffer.length; i++) sumSq += buffer[i] * buffer[i]
      const rms = Math.sqrt(sumSq / buffer.length)

      if (rms > 0.008) {
        setHasSignal(true)
        // Autocorrelation
        const corr = new Float32Array(buffer.length)
        for (let lag = 0; lag < buffer.length; lag++) {
          let c = 0
          for (let i = 0; i < buffer.length - lag; i++) c += buffer[i] * buffer[i + lag]
          corr[lag] = c
        }
        let maxCorr = 0, maxLag = 0
        const minLag = Math.floor(ctx.sampleRate / 1000)
        const maxLagLimit = Math.floor(ctx.sampleRate / 50)
        for (let lag = minLag; lag < Math.min(maxLagLimit, buffer.length); lag++) {
          if (corr[lag] > maxCorr) { maxCorr = corr[lag]; maxLag = lag }
        }
        if (maxLag > 0 && maxCorr > corr[0] * 0.4) {
          const freq = ctx.sampleRate / maxLag
          if (freq >= 60 && freq <= 1200) {
            setCurrentFreq(freq)
            const result = freqToNote(freq)
            setCurrentNote(result)

            if (tracking) {
              setLowestIndex(prev => prev === null ? result.index : Math.min(prev, result.index))
              setHighestIndex(prev => prev === null ? result.index : Math.max(prev, result.index))
            }
          }
        }
      } else {
        setHasSignal(false)
        setCurrentNote(null)
        setCurrentFreq(null)
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    tick()
  }

  const handleComplete = () => {
    if (tracking && lowestIndex !== null && highestIndex !== null) {
      onComplete?.(NOTES[lowestIndex].note, NOTES[highestIndex].note)
    }
    stop()
  }

  // Compute cent deviation bar position: -50..+50 → 0..100%
  const centPercent = currentNote ? Math.max(-50, Math.min(50, currentNote.cents)) / 100 * 50 + 50 : 50
  const isInTune = currentNote && Math.abs(currentNote.cents) <= 5
  const isSlightlyOff = currentNote && Math.abs(currentNote.cents) > 5 && Math.abs(currentNote.cents) <= 20

  return (
    <div className="flex flex-col items-center px-6 py-8">
      {/* Permission error */}
      {permissionError && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 w-full max-w-sm">
          <p className="text-sm text-red-600 text-center">无法访问麦克风，请在浏览器设置中允许麦克风权限</p>
        </div>
      )}

      {/* Status */}
      <div className="flex items-center gap-2 mb-6">
        <span className={`w-2 h-2 rounded-full ${isActive ? (hasSignal ? 'bg-green-500' : 'bg-amber-400') : 'bg-gray-300'}`} />
        <span className="text-sm text-muted-foreground">
          {!isActive ? '点击开始' : hasSignal ? (isInTune ? '音准稳定 ✓' : isSlightlyOff ? '微调中...' : '识别中...') : '等待输入...'}
        </span>
      </div>

      {/* Note display */}
      <div className="relative mb-6">
        <motion.div
          className="w-48 h-48 rounded-full flex flex-col items-center justify-center"
          animate={{
            backgroundColor: isActive && hasSignal
              ? isInTune ? 'rgba(34,197,94,0.12)' : isSlightlyOff ? 'rgba(250,204,21,0.10)' : 'rgba(99,102,241,0.08)'
              : 'rgba(0,0,0,0.03)',
          }}
          style={{ backgroundColor: 'rgba(0,0,0,0.03)' }}
        >
          {currentNote && hasSignal ? (
            <motion.div
              key={currentNote.note}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center"
            >
              <p className="text-5xl font-black tracking-tight text-foreground">{currentNote.note}</p>
              <p className="text-sm text-muted-foreground mt-1 font-mono">
                {currentFreq?.toFixed(1)} Hz
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {currentNote.cents > 0 ? `+${currentNote.cents}¢` : `${currentNote.cents}¢`}
              </p>
            </motion.div>
          ) : (
            <div className="text-center">
              <Volume2 className={`w-10 h-10 mx-auto mb-1 ${isActive ? 'text-primary/40' : 'text-muted-foreground/30'}`} />
              <p className="text-sm text-muted-foreground/50">—</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Cent deviation gauge */}
      <div className="w-full max-w-xs mb-8">
        <div className="relative h-12">
          {/* Background track */}
          <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-2 rounded-full bg-gradient-to-r from-blue-300 via-green-300 to-orange-300" />
          {/* Center mark */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-5 bg-muted-foreground/40 rounded" />
          {/* Labels */}
          <span className="absolute -bottom-4 left-0 text-[10px] text-muted-foreground">♭ -50¢</span>
          <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground">0</span>
          <span className="absolute -bottom-4 right-0 text-[10px] text-muted-foreground">+50¢ ♯</span>
          {/* Needle */}
          {currentNote && hasSignal && (
            <motion.div
              className="absolute top-1/2 -translate-y-1/2 w-1 h-8 rounded-full"
              style={{
                backgroundColor: isInTune ? '#22c55e' : isSlightlyOff ? '#eab308' : '#6366f1',
                left: `${centPercent}%`,
                marginLeft: '-2px',
                boxShadow: '0 0 6px rgba(0,0,0,0.2)',
              }}
              layout
              layoutId="needle"
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            />
          )}
        </div>
      </div>

      {/* Range tracking display */}
      {tracking && (
        <div className="w-full max-w-sm mb-6">
          <div className="bg-card rounded-2xl border border-border/50 p-4">
            <p className="text-xs text-muted-foreground font-medium mb-3 text-center">已检测音域</p>
            <div className="flex items-center justify-between mb-2">
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground">最低</p>
                <p className="text-lg font-bold text-foreground">{lowestIndex !== null ? NOTES[lowestIndex].note : '—'}</p>
              </div>
              <div className="flex-1 mx-3">
                <div className="h-2 rounded-full bg-gradient-to-r from-blue-400 via-green-400 to-orange-400 relative">
                  {lowestIndex !== null && highestIndex !== null && (
                    <div
                      className="absolute inset-y-0 rounded-full bg-accent/50"
                      style={{
                        left: `${(lowestIndex / (TOTAL_NOTES - 1)) * 100}%`,
                        right: `${100 - (highestIndex / (TOTAL_NOTES - 1)) * 100}%`,
                      }}
                    />
                  )}
                  {/* Piano key mini visualization */}
                </div>
                <div className="flex justify-between text-[8px] text-muted-foreground/60 mt-0.5">
                  <span>C2</span>
                  <span>C3</span>
                  <span>C4</span>
                  <span>C5</span>
                  <span>C6</span>
                </div>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground">最高</p>
                <p className="text-lg font-bold text-foreground">{highestIndex !== null ? NOTES[highestIndex].note : '—'}</p>
              </div>
            </div>
            <p className="text-xs text-center text-muted-foreground">
              唱出你的最低音到最高音，音域会自动记录
            </p>
          </div>
        </div>
      )}

      {/* Control button */}
      {!isActive ? (
        <button
          onClick={start}
          className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:opacity-90 transition-all active:scale-95"
        >
          <Mic className="w-7 h-7" />
        </button>
      ) : (
        <div className="flex gap-4">
          {tracking && (
            <button
              onClick={handleComplete}
              disabled={lowestIndex === null || highestIndex === null}
              className="h-12 px-6 rounded-2xl bg-green-500 text-white font-medium text-sm shadow-lg hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              完成测试 ✓
            </button>
          )}
          <button
            onClick={stop}
            className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive/20 transition-all"
          >
            <Pause className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Hint */}
      {!isActive && !tracking && (
        <p className="text-xs text-muted-foreground mt-4">点击麦克风开始检测音高</p>
      )}
      {!isActive && tracking && (
        <p className="text-xs text-muted-foreground mt-4">点击麦克风，从低到高唱出你的音域</p>
      )}
    </div>
  )
}
