"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { AlertTriangle, ChevronLeft, Drum, Eraser, Hand, Music2, Play, RefreshCw, RotateCcw, Square, Volume2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchInstruments, generateQuestion, submitAnswer } from "./rhythm-api"
import { Instrument, NotePoolItem, NoteType, Question, SubmitResult } from "./types"
import { InfoTag, TutorialModal, useMetronome } from "./shared"

interface GamePageProps {
  unitId: number
  levelId: number
  onResult: (result: SubmitResult) => void
  onBack: () => void
}

const TITLE_BY_TYPE: Record<string, string> = {
  RHYTHM_CLASSIFICATION: "拍号听辨",
  ACCENT_DETECTION: "重音点击",
  RHYTHM_PUZZLE: "节奏计数",
  RHYTHM_ECHO: "节奏回声",
  UPBEAT_TRAINING: "反拍与切分",
  ANTI_DISTRACTION: "抗干扰强拍",
  SPLIT_BRAIN: "左右手复合节奏",
  PRODUCER_SANDBOX: "节奏制作人",
}

const DESCRIPTION_BY_TYPE: Record<string, string> = {
  RHYTHM_CLASSIFICATION: "听音频里的重音分组，判断它属于哪个拍号。复合拍题会出现 6/8、9/8、12/8。",
  ACCENT_DETECTION: "音频里会有稳定脉搏和更明显的目标重音。请只在目标重音出现的位置点击。",
  RHYTHM_PUZZLE: "先听完整节奏，再选择目标音一共出现了几次。",
  RHYTHM_ECHO: "目标音出现时跟着点击。遇到休止要忍住不点，遇到密集音要快速跟上。",
  UPBEAT_TRAINING: "底拍会保持稳定，目标音色会落在反拍或切分位置。跟着目标点点击，训练律动卡点。",
  ANTI_DISTRACTION: "忽略干扰音色，只点击更明亮的目标强拍。",
  SPLIT_BRAIN: "左右手分别跟随不同音色：低音对应左手，高音对应右手。",
  PRODUCER_SANDBOX: "选择乐器试听音色，点亮格子编写鼓组 Loop；播放头可以拖动回听任意位置。",
}

const NOTE_LABELS: Record<NoteType, string> = {
  WHOLE: "全音符",
  HALF: "二分",
  QUARTER: "四分",
  EIGHTH: "八分",
  SIXTEENTH: "十六分",
  REST: "休止",
}

const NOTE_SYMBOLS: Record<NoteType, string> = {
  WHOLE: "1",
  HALF: "1/2",
  QUARTER: "1/4",
  EIGHTH: "1/8",
  SIXTEENTH: "1/16",
  REST: "0",
}

type GameState = "loading" | "ready" | "playing" | "stopped" | "submitting"

export function GamePage({ unitId, levelId, onResult, onBack }: GamePageProps) {
  const [gameState, setGameState] = useState<GameState>("loading")
  const [question, setQuestion] = useState<Question | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showTutorial, setShowTutorial] = useState(true)
  const [elapsed, setElapsed] = useState(0)
  const [countInText, setCountInText] = useState("")

  const [hitTimes, setHitTimes] = useState<number[]>([])
  const [leftTimes, setLeftTimes] = useState<number[]>([])
  const [rightTimes, setRightTimes] = useState<number[]>([])
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [selectedCount, setSelectedCount] = useState<number | null>(null)
  const [selectedPattern, setSelectedPattern] = useState<string | null>(null)
  const [selectedNotes, setSelectedNotes] = useState<{ note_id: string; note_type: NoteType; position: number }[]>([])
  const [producerTracks, setProducerTracks] = useState<Record<number, number[]>>({})
  const [instruments, setInstruments] = useState<Instrument[]>([])
  const [currentInstrumentId, setCurrentInstrumentId] = useState<number | null>(null)
  const [producerStep, setProducerStep] = useState(0)

  const startTimeRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const producerTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const producerStepRef = useRef(0)
  const producerTracksRef = useRef<Record<number, number[]>>({})
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const { playCountIn } = useMetronome()

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
  }, [])

  const stopProducerLoop = useCallback(() => {
    if (producerTimerRef.current) {
      clearInterval(producerTimerRef.current)
      producerTimerRef.current = null
    }
  }, [])

  const handleStop = useCallback(() => {
    stopTimer()
    stopAudio()
    stopProducerLoop()
    setGameState("stopped")
  }, [stopAudio, stopProducerLoop, stopTimer])

  const startTimer = useCallback(
    (durationMs: number) => {
      startTimeRef.current = performance.now()
      timerRef.current = setInterval(() => {
        const nextElapsed = performance.now() - startTimeRef.current
        setElapsed(nextElapsed)
        if (nextElapsed >= durationMs) {
          handleStop()
        }
      }, 80)
    },
    [handleStop],
  )

  const resetAnswerState = () => {
    setElapsed(0)
    setHitTimes([])
    setLeftTimes([])
    setRightTimes([])
    setSelectedAnswer(null)
    setSelectedCount(null)
    setSelectedPattern(null)
    setSelectedNotes([])
    setProducerTracks({})
    setProducerStep(0)
    producerStepRef.current = 0
  }

  const loadQuestion = useCallback(async () => {
    setGameState("loading")
    setError(null)
    resetAnswerState()
    try {
      const nextQuestion = await generateQuestion(levelId)
      setQuestion(nextQuestion)
      setShowTutorial(true)
      setGameState("ready")
      if (nextQuestion.question_type === "PRODUCER_SANDBOX") {
        const nextInstruments = await fetchInstruments()
        const availableIds = nextQuestion.question_payload.available_instruments || nextInstruments.map((instrument) => instrument.instrument_id)
        setInstruments(nextInstruments)
        setCurrentInstrumentId(availableIds[0] ?? nextInstruments[0]?.instrument_id ?? null)
      }
    } catch {
      setError("题目生成失败，请检查后端节奏素材库。")
      setGameState("ready")
    }
  }, [levelId])

  useEffect(() => {
    loadQuestion()
    return () => {
      stopTimer()
      stopAudio()
      stopProducerLoop()
    }
  }, [loadQuestion, stopAudio, stopProducerLoop, stopTimer])

  useEffect(() => {
    producerTracksRef.current = producerTracks
  }, [producerTracks])

  const getProducerStepCount = () => question?.question_payload.step_count || 16
  const getProducerStepMs = () => question?.question_payload.quantize_grid_ms || 160

  const playInstrumentSound = useCallback(
    (instrumentId: number) => {
      const instrument = instruments.find((item) => item.instrument_id === instrumentId)
      if (!instrument?.sound_url) return
      const audio = new Audio(instrument.sound_url)
      audio.volume = 0.72
      audio.play().catch(() => undefined)
    },
    [instruments],
  )

  const playProducerStep = useCallback(
    (step: number) => {
      const stepMs = getProducerStepMs()
      Object.entries(producerTracksRef.current).forEach(([instrumentId, times]) => {
        const hasHit = times.some((time) => Math.round(time / stepMs) === step)
        if (hasHit) playInstrumentSound(Number(instrumentId))
      })
    },
    [playInstrumentSound],
  )

  const moveProducerStep = (step: number) => {
    const nextStep = Math.max(0, Math.min(getProducerStepCount() - 1, step))
    producerStepRef.current = nextStep
    setProducerStep(nextStep)
    setElapsed(nextStep * getProducerStepMs())
  }

  const startProducerLoop = useCallback(() => {
    stopTimer()
    stopAudio()
    stopProducerLoop()
    setShowTutorial(false)
    setGameState("playing")

    const stepCount = getProducerStepCount()
    const stepMs = getProducerStepMs()
    playProducerStep(producerStepRef.current)
    setElapsed(producerStepRef.current * stepMs)

    producerTimerRef.current = setInterval(() => {
      const nextStep = (producerStepRef.current + 1) % stepCount
      producerStepRef.current = nextStep
      setProducerStep(nextStep)
      setElapsed(nextStep * stepMs)
      playProducerStep(nextStep)
    }, stepMs)
  }, [playProducerStep, stopAudio, stopProducerLoop, stopTimer])

  const toggleProducerStep = (instrumentId: number, step: number) => {
    if (gameState === "submitting") return
    const stepMs = getProducerStepMs()
    const time = step * stepMs
    setCurrentInstrumentId(instrumentId)
    setProducerTracks((prev) => {
      const current = prev[instrumentId] || []
      const exists = current.some((item) => Math.round(item / stepMs) === step)
      const nextTimes = exists ? current.filter((item) => Math.round(item / stepMs) !== step) : [...current, time].sort((a, b) => a - b)
      return { ...prev, [instrumentId]: nextTimes }
    })
    playInstrumentSound(instrumentId)
  }

  const clearProducerTrack = (instrumentId: number) => {
    setProducerTracks((prev) => ({ ...prev, [instrumentId]: [] }))
  }

  const clearProducerAll = () => {
    setProducerTracks({})
    moveProducerStep(0)
  }

  const applyProducerPreset = (tracks: { instrument_id: number; steps: number[] }[]) => {
    const stepMs = getProducerStepMs()
    const nextTracks = tracks.reduce<Record<number, number[]>>((acc, track) => {
      acc[track.instrument_id] = track.steps.map((step) => step * stepMs)
      return acc
    }, {})
    setProducerTracks(nextTracks)
    setCurrentInstrumentId(tracks[0]?.instrument_id ?? currentInstrumentId)
    moveProducerStep(0)
    tracks.forEach((track) => {
      if (track.steps.includes(0)) playInstrumentSound(track.instrument_id)
    })
  }

  const handleStart = async () => {
    if (!question) return
    if (question.question_type === "PRODUCER_SANDBOX") {
      startProducerLoop()
      return
    }

    resetAnswerState()
    setShowTutorial(false)

    const beats = Math.min(4, Math.max(1, Number.parseInt(question.time_signature.split("/")[0] || "4", 10)))
    setCountInText(`预备 ${beats} 拍`)
    await playCountIn(question.bpm, beats)
    setCountInText("")

    setGameState("playing")
    startTimeRef.current = performance.now()
    startTimer(question.duration_ms)

    if (question.audio_url) {
      const audio = new Audio(question.audio_url)
      audio.volume = 0.45
      audio.loop = false
      audio.play().catch(() => undefined)
      audioRef.current = audio
    }
  }

  const currentMs = () => Math.max(0, Math.round(performance.now() - startTimeRef.current))

  const handleTap = () => {
    if (gameState !== "playing") return
    setHitTimes((prev) => [...prev, currentMs()])
  }

  const handleLeftTap = () => {
    if (gameState !== "playing") return
    setLeftTimes((prev) => [...prev, currentMs()])
  }

  const handleRightTap = () => {
    if (gameState !== "playing") return
    setRightTimes((prev) => [...prev, currentMs()])
  }

  const addPuzzleNote = (item: NotePoolItem) => {
    setSelectedNotes((prev) => [...prev, { note_id: item.note_id, note_type: item.note_type, position: prev.length }])
  }

  const removePuzzleNote = (index: number) => {
    setSelectedNotes((prev) => prev.filter((_, i) => i !== index).map((note, i) => ({ ...note, position: i })))
  }

  const handleSubmit = async () => {
    if (!question) return
    setGameState("submitting")
    try {
      let answer: any = { hit_timestamps_ms: hitTimes }
      if (question.question_type === "RHYTHM_CLASSIFICATION") {
        answer = { selected_answer: selectedAnswer }
      } else if (question.question_type === "RHYTHM_PUZZLE") {
        answer = selectedCount !== null ? { selected_count: selectedCount } : selectedPattern ? { selected_pattern: selectedPattern } : { selected_notes: selectedNotes }
      } else if (question.question_type === "RHYTHM_ECHO") {
        answer = { hit_timestamps_ms: hitTimes }
      } else if (question.question_type === "SPLIT_BRAIN") {
        answer = { left_hand_timestamps_ms: leftTimes, right_hand_timestamps_ms: rightTimes }
      } else if (question.question_type === "PRODUCER_SANDBOX") {
        answer = {
          loop_tracks: Object.entries(producerTracks).map(([instrumentId, times]) => ({
            instrument_id: Number(instrumentId),
            hit_times_ms: times,
          })),
        }
      }

      const result = await submitAnswer(question.question_id, answer)
      onResult(result)
    } catch {
      setError("提交失败，请重试。")
      setGameState("stopped")
    }
  }

  if (gameState === "loading") {
    return (
      <div className="h-full bg-background flex flex-col">
        <div className="px-4 py-4 flex items-center gap-3 border-b border-border/50">
          <Skeleton className="w-9 h-9 rounded-full" />
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="space-y-4 w-64">
            <Skeleton className="h-48 rounded-2xl" />
            <Skeleton className="h-12 rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  if (error && !question) {
    return (
      <div className="h-full bg-background flex flex-col items-center justify-center gap-4 px-4">
        <AlertTriangle className="w-12 h-12 text-destructive" />
        <p className="text-muted-foreground text-center">{error}</p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack}>返回</Button>
          <Button onClick={loadQuestion}>重试</Button>
        </div>
      </div>
    )
  }

  if (!question) return null

  const title = TITLE_BY_TYPE[question.question_type] || question.question_type
  const description = DESCRIPTION_BY_TYPE[question.question_type] || "听音频并完成节奏任务。"
  const canAnswer = question.question_type === "PRODUCER_SANDBOX" ? gameState !== "submitting" : gameState === "playing" || gameState === "stopped"
  const isPlaying = gameState === "playing"
  const displayDurationMs = question.question_type === "PRODUCER_SANDBOX" ? question.question_payload.loop_duration_ms || getProducerStepCount() * getProducerStepMs() : question.duration_ms
  const progressPct = Math.min(100, (elapsed / displayDurationMs) * 100)
  const remainingSec = Math.max(0, Math.ceil((displayDurationMs - elapsed) / 1000))

  const renderTapPad = (onClick: () => void, count: number, hint: string, icon = <Drum className="w-10 h-10" />) => (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4 select-none">
      <button
        onClick={onClick}
        disabled={!isPlaying}
        className={cn(
          "w-full max-w-sm min-h-[260px] rounded-2xl bg-card border-2 border-border/50 flex flex-col items-center justify-center gap-3 transition-all",
          isPlaying ? "hover:border-primary/40 active:scale-[0.99]" : "opacity-55",
        )}
      >
        <div className="text-primary">{icon}</div>
        <span className="text-5xl font-black text-primary">{count}</span>
        <span className="text-sm text-muted-foreground">点击次数</span>
        <span className="text-base text-muted-foreground">{hint}</span>
      </button>
    </div>
  )

  const renderQuestionContent = () => {
    if (question.question_type === "RHYTHM_CLASSIFICATION") {
      const options = question.question_payload.options || ["2/4", "3/4", "4/4"]
      return (
        <div className="flex-1 flex flex-col items-center justify-center gap-5 px-4">
          <Music2 className="w-9 h-9 text-primary" />
          <p className="text-sm text-muted-foreground text-center">听完整段后选择最符合的拍号</p>
          <div className="grid grid-cols-3 gap-3 w-full max-w-sm">
            {options.map((option) => (
              <button
                key={option}
                disabled={!canAnswer}
                onClick={() => setSelectedAnswer(option)}
                className={cn(
                  "h-20 rounded-xl border-2 text-xl font-bold transition-all",
                  selectedAnswer === option
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-foreground border-border/50 hover:border-primary/50",
                  !canAnswer && "opacity-55",
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )
    }

    if (question.question_type === "RHYTHM_PUZZLE") {
      const countOptions = question.question_payload.count_options || []
      if (countOptions.length > 0) {
        return (
          <div className="flex-1 flex flex-col items-center justify-center gap-5 px-4 py-4">
            <Music2 className="w-9 h-9 text-primary" />
            <div className="text-center max-w-sm">
              <p className="text-base font-semibold text-foreground">目标音出现了几次？</p>
              <p className="text-sm text-muted-foreground mt-1">
                听完整段后，只数更明亮的目标音。底拍只是辅助，不需要计算进去。
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
              {countOptions.map((count) => (
                <button
                  key={count}
                  disabled={!canAnswer}
                  onClick={() => setSelectedCount(count)}
                  className={cn(
                    "h-24 rounded-xl border-2 bg-card transition-all flex flex-col items-center justify-center gap-1",
                    selectedCount === count ? "border-primary bg-primary/10 text-primary" : "border-border/50 text-foreground",
                    canAnswer && "hover:border-primary/50",
                    !canAnswer && "opacity-55",
                  )}
                >
                  <span className="text-4xl font-black">{count}</span>
                  <span className="text-xs text-muted-foreground">次</span>
                </button>
              ))}
            </div>
          </div>
        )
      }

      const patternOptions = question.question_payload.pattern_options || []
      const notePool = question.question_payload.note_pool || []
      if (patternOptions.length > 0) {
        return (
          <div className="flex-1 flex flex-col gap-4 px-4 py-4">
            <div className="rounded-xl bg-card border border-border/50 p-4">
              <p className="text-sm font-semibold text-foreground">选择听到的节奏形状</p>
              <p className="text-xs text-muted-foreground mt-1">短块代表短音，空心块代表休止。先听长短关系，再选最接近的一组。</p>
            </div>
            <div className="grid gap-3">
              {patternOptions.map((option) => {
                const selected = selectedPattern === option.pattern_id
                return (
                  <button
                    key={option.pattern_id}
                    disabled={!canAnswer}
                    onClick={() => setSelectedPattern(option.pattern_id)}
                    className={cn(
                      "rounded-xl border-2 bg-card p-3 text-left transition-colors",
                      selected ? "border-primary bg-primary/10" : "border-border/50",
                      canAnswer && "hover:border-primary/50",
                      !canAnswer && "opacity-55",
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-foreground">{option.label}</span>
                      <span className={cn("w-5 h-5 rounded-full border-2", selected ? "border-primary bg-primary" : "border-border")} />
                    </div>
                    <div className="mt-3 grid gap-1" style={{ gridTemplateColumns: `repeat(${option.grid_steps || 16}, minmax(0, 1fr))` }}>
                      {Array.from({ length: option.grid_steps || 16 }, (_, index) => {
                        const hit = option.hit_steps?.includes(index)
                        return (
                          <span
                            key={`${option.pattern_id}-${index}`}
                            className={cn(
                              "h-8 rounded-md border transition-colors",
                              hit ? "border-primary bg-primary/80" : "border-border/60 bg-background",
                              index % 4 === 0 && !hit && "bg-secondary/70",
                            )}
                          />
                        )
                      })}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )
      }

      return (
        <div className="flex-1 flex flex-col gap-4 px-4 py-4">
          <div className="rounded-2xl border-2 border-dashed border-border/70 bg-card/60 p-4 min-h-[126px]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-foreground">你的答案</span>
              <span className="text-xs text-muted-foreground">{selectedNotes.length} 个音符块</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedNotes.length === 0 && (
                <span className="text-sm text-muted-foreground">听完后点击下方音符块，还原听到的节奏。</span>
              )}
              {selectedNotes.map((note, index) => (
                <button
                  key={`${note.note_id}-${index}`}
                  disabled={!canAnswer}
                  onClick={() => removePuzzleNote(index)}
                  className="px-3 py-2 rounded-lg bg-primary/15 text-primary text-sm font-semibold"
                >
                  {NOTE_LABELS[note.note_type]}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {notePool.map((item) => (
              <button
                key={item.note_id}
                disabled={!canAnswer}
                onClick={() => addPuzzleNote(item)}
                className={cn(
                  "min-h-[78px] rounded-xl bg-card border border-border/50 flex flex-col items-center justify-center gap-1 transition-colors",
                  canAnswer && "hover:border-primary/50",
                  !canAnswer && "opacity-55",
                )}
              >
                <span className="text-lg font-black text-primary">{NOTE_SYMBOLS[item.note_type]}</span>
                <span className="text-sm font-medium">{NOTE_LABELS[item.note_type]}</span>
                <span className="text-xs text-muted-foreground">{item.duration_ms}ms</span>
              </button>
            ))}
          </div>
        </div>
      )
    }

    if (question.question_type === "RHYTHM_ECHO") {
      const gridSteps = question.question_payload.grid_steps || 16
      const echoSteps = question.question_payload.echo_steps || []
      return (
        <div className="flex-1 flex flex-col gap-4 px-4 py-4">
          <div className="rounded-xl bg-card border border-border/50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">听到目标音就点击</p>
                <p className="text-xs text-muted-foreground mt-1">亮格代表这一关的节奏形状，真正得分看你点击是否跟上音频。</p>
              </div>
              <span className="text-3xl font-black text-primary">{hitTimes.length}</span>
            </div>
            <div className="mt-4 grid gap-1" style={{ gridTemplateColumns: `repeat(${gridSteps}, minmax(0, 1fr))` }}>
              {Array.from({ length: gridSteps }, (_, index) => {
                const active = echoSteps.includes(index)
                return (
                  <span
                    key={index}
                    className={cn(
                      "h-8 rounded-md border",
                      active ? "border-primary bg-primary/75" : "border-border/60 bg-background",
                      index % 4 === 0 && !active && "bg-secondary/70",
                    )}
                  />
                )
              })}
            </div>
          </div>
          {renderTapPad(handleTap, hitTimes.length, "跟着目标音点击", <Hand className="w-10 h-10" />)}
        </div>
      )
    }

    if (question.question_type === "SPLIT_BRAIN") {
      return (
        <div className="flex-1 grid grid-cols-2 gap-2 px-3 py-4">
          <div className="flex flex-col items-center justify-center gap-2">
            <span className="text-xs font-bold text-accent-foreground bg-accent/25 px-3 py-1 rounded-full">左手低音</span>
            {renderTapPad(handleLeftTap, leftTimes.length, "左手", <Hand className="w-9 h-9" />)}
          </div>
          <div className="flex flex-col items-center justify-center gap-2">
            <span className="text-xs font-bold text-primary bg-primary/20 px-3 py-1 rounded-full">右手高音</span>
            {renderTapPad(handleRightTap, rightTimes.length, "右手", <Hand className="w-9 h-9" />)}
          </div>
        </div>
      )
    }

    if (question.question_type === "PRODUCER_SANDBOX") {
      const stepCount = getProducerStepCount()
      const stepMs = getProducerStepMs()
      const availableIds = question.question_payload.available_instruments || instruments.map((instrument) => instrument.instrument_id)
      const availableInstruments = instruments.filter((instrument) => availableIds.includes(instrument.instrument_id))
      const activeInstrument = availableInstruments.find((instrument) => instrument.instrument_id === currentInstrumentId)
      const groovePresets = question.question_payload.groove_presets || []
      const totalHits = Object.values(producerTracks).reduce((sum, times) => sum + times.length, 0)
      const steps = Array.from({ length: stepCount }, (_, index) => index)
      const isStepActive = (instrumentId: number, step: number) =>
        (producerTracks[instrumentId] || []).some((time) => Math.round(time / stepMs) === step)

      return (
        <div className="flex-1 flex flex-col gap-4 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{activeInstrument?.name || "选择乐器"}</p>
              <p className="text-xs text-muted-foreground">{totalHits} 个节奏点 · {stepCount} 步循环</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => currentInstrumentId && clearProducerTrack(currentInstrumentId)} disabled={!canAnswer || !currentInstrumentId}>
                <Eraser className="w-4 h-4" /> 当前轨
              </Button>
              <Button variant="outline" size="sm" onClick={clearProducerAll} disabled={!canAnswer}>
                <Eraser className="w-4 h-4" /> 全部
              </Button>
            </div>
          </div>

          {groovePresets.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {groovePresets.map((preset) => (
                <button
                  key={preset.preset_id}
                  disabled={!canAnswer}
                  onClick={() => applyProducerPreset(preset.tracks)}
                  className={cn(
                    "min-w-[92px] rounded-xl border bg-secondary/70 px-3 py-2 text-xs font-semibold text-foreground transition-colors",
                    canAnswer && "hover:border-primary/50 hover:bg-primary/10",
                    !canAnswer && "opacity-55",
                  )}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-2 overflow-x-auto pb-1">
            {availableInstruments.map((instrument) => {
              const count = producerTracks[instrument.instrument_id]?.length || 0
              const active = currentInstrumentId === instrument.instrument_id
              return (
                <button
                  key={instrument.instrument_id}
                  disabled={!canAnswer}
                  onClick={() => {
                    setCurrentInstrumentId(instrument.instrument_id)
                    playInstrumentSound(instrument.instrument_id)
                  }}
                  className={cn(
                    "min-w-[86px] rounded-xl border-2 bg-card p-3 flex flex-col items-center gap-1",
                    active ? "border-primary bg-primary/10" : "border-border/50",
                  )}
                >
                  <span className="text-lg font-black text-primary">{instrument.icon}</span>
                  <span className="text-xs font-semibold">{instrument.name}</span>
                  <span className="text-xs text-muted-foreground">{count}</span>
                </button>
              )
            })}
          </div>

          <div className="rounded-xl bg-card border border-border/50 p-3">
            <div className="flex items-center gap-3">
              <Volume2 className="w-4 h-4 text-primary shrink-0" />
              <input
                aria-label="Loop 播放位置"
                type="range"
                min={0}
                max={stepCount - 1}
                value={producerStep}
                onChange={(event) => moveProducerStep(Number(event.target.value))}
                className="w-full accent-primary"
              />
              <span className="text-xs font-mono text-muted-foreground w-12 text-right">{producerStep + 1}/{stepCount}</span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border/50 bg-card">
            <div className="min-w-[620px] p-3 space-y-2">
              <div className="grid gap-1 pl-20" style={{ gridTemplateColumns: `repeat(${stepCount}, minmax(0, 1fr))` }}>
                {steps.map((step) => (
                  <span
                    key={`beat-${step}`}
                    className={cn(
                      "h-5 rounded text-[10px] flex items-center justify-center text-muted-foreground",
                      step % 4 === 0 && "font-bold text-primary",
                      producerStep === step && "bg-primary/15",
                    )}
                  >
                    {step % 4 === 0 ? step / 4 + 1 : ""}
                  </span>
                ))}
              </div>

              {availableInstruments.map((instrument) => (
                <div key={instrument.instrument_id} className="grid gap-2 items-center" style={{ gridTemplateColumns: `72px repeat(${stepCount}, minmax(0, 1fr))` }}>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentInstrumentId(instrument.instrument_id)
                      playInstrumentSound(instrument.instrument_id)
                    }}
                    className={cn(
                      "h-9 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1",
                      currentInstrumentId === instrument.instrument_id ? "border-primary bg-primary/10 text-primary" : "border-border/50 bg-background text-foreground",
                    )}
                  >
                    <span>{instrument.icon}</span>
                    <span className="truncate">{instrument.name}</span>
                  </button>
                  {steps.map((step) => {
                    const active = isStepActive(instrument.instrument_id, step)
                    const strongBeat = step % 4 === 0
                    return (
                      <button
                        key={`${instrument.instrument_id}-${step}`}
                        type="button"
                        disabled={!canAnswer}
                        onClick={() => toggleProducerStep(instrument.instrument_id, step)}
                        className={cn(
                          "h-9 rounded-md border transition-all",
                          active ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-border/50 bg-background hover:border-primary/50",
                          strongBeat && !active && "bg-secondary/70",
                          producerStep === step && "ring-2 ring-primary/35",
                          !canAnswer && "opacity-55",
                        )}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          </div>

        </div>
      )
    }

    if (question.question_type === "ANTI_DISTRACTION") {
      return renderTapPad(handleTap, hitTimes.length, "只点目标强拍", <Drum className="w-10 h-10" />)
    }

    if (question.question_type === "UPBEAT_TRAINING") {
      return renderTapPad(handleTap, hitTimes.length, "跟随目标反拍", <Hand className="w-10 h-10" />)
    }

    return renderTapPad(handleTap, hitTimes.length, "按节奏点击")
  }

  return (
    <div className="h-full bg-background flex flex-col">
      <div className="px-4 py-3 flex items-center gap-3 border-b border-border/50 shrink-0">
        <button
          onClick={onBack}
          disabled={isPlaying}
          className="w-9 h-9 rounded-full bg-card border border-border/50 flex items-center justify-center hover:bg-secondary transition-colors disabled:opacity-30"
        >
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{title}</p>
          <p className="text-xs text-muted-foreground">单元 {unitId} · 第 {levelId % 100} 关</p>
        </div>
        <div className="flex items-center gap-2">
          <InfoTag>{question.bpm} BPM</InfoTag>
          <InfoTag>{question.time_signature}</InfoTag>
          <span className={cn("text-sm font-mono font-bold min-w-[2rem] text-right", remainingSec <= 5 && isPlaying ? "text-destructive animate-pulse" : "text-foreground")}>
            {remainingSec}s
          </span>
        </div>
      </div>

      <Progress value={progressPct} className="rounded-none h-1 shrink-0" />

      {(question.question_payload.prompt || question.question_payload.skill_goal) && (
        <div className="px-4 py-2 border-b border-border/50 bg-secondary/45 shrink-0">
          {question.question_payload.skill_goal && (
            <p className="text-xs font-semibold text-foreground truncate">{question.question_payload.skill_goal}</p>
          )}
          {question.question_payload.prompt && (
            <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{question.question_payload.prompt}</p>
          )}
        </div>
      )}

      {countInText && (
        <div className="absolute inset-0 z-20 bg-background/90 flex flex-col items-center justify-center">
          <p className="text-2xl font-bold text-foreground mb-2">{countInText}</p>
          <div className="flex items-center gap-2">
            <InfoTag>{question.bpm} BPM</InfoTag>
            <InfoTag>{question.time_signature}</InfoTag>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-y-auto">{renderQuestionContent()}</div>

      {error && (
        <div className="px-4 pb-2">
          <p className="text-sm text-destructive text-center">{error}</p>
        </div>
      )}

      <div className="px-4 py-4 border-t border-border/50 bg-card/50 shrink-0">
        {gameState === "ready" && (
          <Button size="lg" className="w-full text-base" onClick={handleStart}>
            <Play className="w-5 h-5" /> {question.question_type === "PRODUCER_SANDBOX" ? "播放 Loop" : "开始"}
          </Button>
        )}

        {gameState === "playing" && (
          <Button variant="outline" size="lg" className="w-full text-base" onClick={handleStop}>
            <Square className="w-5 h-5" /> {question.question_type === "PRODUCER_SANDBOX" ? "暂停回听" : "停止并作答"}
          </Button>
        )}

        {gameState === "stopped" && (
          <div className="grid grid-cols-3 gap-3">
            <Button variant="outline" onClick={loadQuestion}>
              <RefreshCw className="w-4 h-4" /> 换题
            </Button>
            <Button variant="outline" onClick={handleStart}>
              <RotateCcw className="w-4 h-4" /> {question.question_type === "PRODUCER_SANDBOX" ? "播放" : "重来"}
            </Button>
            <Button onClick={handleSubmit}>提交</Button>
          </div>
        )}

        {gameState === "submitting" && (
          <Button size="lg" className="w-full text-base" disabled>
            提交中...
          </Button>
        )}
      </div>

      <TutorialModal
        open={showTutorial && gameState === "ready"}
        title={title}
        description={description}
        onStart={handleStart}
      />
    </div>
  )
}
