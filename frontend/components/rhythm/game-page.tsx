"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, Play, Square, RotateCcw, RefreshCw, Drum, Drumstick, Music, Hand, Ear, AlertTriangle, Zap, ArrowLeftRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Question, GameState, Level, Instrument, AudioTrack, NotePoolItem, ScoreNote, NoteType, SubmitResult } from "./types"
import { generateQuestion, submitAnswer, fetchInstruments, fetchAudioTracks } from "./rhythm-api"
import { TapPad, OptionButtons, NotePoolCard, ScoreSheetCard, TutorialModal, useMetronome, HitTimesPreview, BeatVisualizer, InfoTag } from "./shared"

// ===== Sight Reading Sub-Component =====
function SightReadingContent({
  scoreSheet,
  isPlaying,
  bpm,
  hitCount,
  onTap,
}: {
  scoreSheet: ScoreNote[]
  isPlaying: boolean
  bpm: number
  hitCount: number
  onTap: () => void
}) {
  const [scrollPos, setScrollPos] = useState(0)
  const animRef = useRef<number | null>(null)

  useEffect(() => {
    if (isPlaying) {
      const speed = bpm * 0.5
      const animate = () => {
        setScrollPos((prev) => {
          const next = prev + speed * 0.016
          return next > 2000 ? 0 : next
        })
        animRef.current = requestAnimationFrame(animate)
      }
      animRef.current = requestAnimationFrame(animate)
    }
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [isPlaying, bpm])

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4">
      <div className="w-full max-w-sm relative">
        <div className="absolute left-1/4 top-0 bottom-0 w-0.5 bg-primary z-10 shadow-[0_0_8px_rgba(232,180,160,0.5)]" />
        <div className="h-24 rounded-2xl bg-card border border-border/50 overflow-hidden relative">
          <div
            className="absolute inset-0 flex items-center gap-4"
            style={{ transform: `translateX(${200 - scrollPos}px)` }}
          >
            {scoreSheet.map((note, i) => (
              <div
                key={i}
                className={cn(
                  "h-10 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0",
                  note.note_type === "QUARTER" ? "w-16 bg-primary" :
                  note.note_type === "HALF" ? "w-20 bg-accent" :
                  note.note_type === "EIGHTH" ? "w-10 bg-amber-400" :
                  note.note_type === "WHOLE" ? "w-24 bg-violet-400" : "w-12 bg-muted-foreground"
                )}
              >
                {note.note_type}
              </div>
            ))}
          </div>
        </div>
        <button
          onClick={onTap}
          disabled={!isPlaying}
          className={cn(
            "w-full mt-4 h-16 rounded-2xl bg-card border-2 border-border/50 flex items-center justify-center gap-2 font-medium",
            isPlaying && "active:scale-[0.98] active:bg-primary/15 cursor-pointer",
          )}
        >
          <Music className="w-5 h-5 text-muted-foreground" />
          <span className="text-muted-foreground">音符到达判定线时点击</span>
        </button>
        <p className="text-center mt-2 text-2xl font-black text-primary">{hitCount}</p>
      </div>
    </div>
  )
}

// ===== Game Page Props =====
interface GamePageProps {
  unitId: number
  levelId: number
  onResult: (result: SubmitResult) => void
  onBack: () => void
}

// ===== Main Game Page Component =====
export function GamePage({ unitId, levelId, onResult, onBack }: GamePageProps) {
  const [gameState, setGameState] = useState<GameState>("loading")
  const [question, setQuestion] = useState<Question | null>(null)
  const [showTutorial, setShowTutorial] = useState(true)
  const [countInText, setCountInText] = useState("")
  const [elapsed, setElapsed] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Game timing
  const startTimeRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Per-question-type state
  const [hitTimes, setHitTimes] = useState<number[]>([])
  const [leftTimes, setLeftTimes] = useState<number[]>([])
  const [rightTimes, setRightTimes] = useState<number[]>([])
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null)
  const [selectedNotes, setSelectedNotes] = useState<{ note_id: string; note_type: NoteType; position: number }[]>([])
  const [producerTracks, setProducerTracks] = useState<Record<number, number[]>>({})
  const [currentInstrumentId, setCurrentInstrumentId] = useState<number | null>(null)
  const [instruments, setInstruments] = useState<Instrument[]>([])
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([])

  const { playCountIn } = useMetronome()

  // Load question on mount
  const loadQuestion = useCallback(async () => {
    setGameState("loading")
    setError(null)
    setHitTimes([])
    setLeftTimes([])
    setRightTimes([])
    setSelectedAnswer(null)
    setSelectedPosition(null)
    setSelectedNotes([])
    setProducerTracks({})
    try {
      const q = await generateQuestion(levelId)
      setQuestion(q)
      setShowTutorial(true)
      setGameState("ready")

      // Preload instruments for producer sandbox
      if (q.question_type === "PRODUCER_SANDBOX") {
        const [insts, tracks] = await Promise.all([fetchInstruments(), fetchAudioTracks()])
        setInstruments(insts)
        setAudioTracks(tracks)
        if (insts.length > 0) setCurrentInstrumentId(insts[0].instrument_id)
      }
    } catch {
      setError("题目生成失败")
    }
  }, [levelId])

  useEffect(() => { loadQuestion() }, [loadQuestion])

  // Timer management
  const startTimer = useCallback((durationMs: number) => {
    startTimeRef.current = performance.now()
    timerRef.current = setInterval(() => {
      const e = performance.now() - startTimeRef.current
      setElapsed(e)
      if (e >= durationMs) {
        handleStop()
      }
    }, 100)
  }, [])

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTimer()
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [stopTimer])

  // ===== Start Game with Count-In =====
  const handleStart = async () => {
    if (!question) return
    setShowTutorial(false)
    setGameState("ready")
    setHitTimes([])
    setLeftTimes([])
    setRightTimes([])

    const bpm = question.bpm
    const timeSig = question.time_signature
    const beats = parseInt(timeSig.split("/")[0]) || 4

    // Count-in phase
    setCountInText(`预备拍 ${beats} 拍...`)
    await playCountIn(bpm, beats)
    setCountInText("")

    // Start game
    setGameState("playing")
    startTimeRef.current = performance.now()
    startTimer(question.duration_ms)

    // Play audio if available
    if (question.audio_url) {
      try {
        const audio = new Audio(question.audio_url)
        audio.volume = 0.35
        if (question.question_type === "PRODUCER_SANDBOX" || question.question_type === "SIGHT_READING") {
          audio.loop = true
        }
        audio.play().catch(() => {})
        audioRef.current = audio
      } catch { /* silent */ }
    }
  }

  // ===== Stop Game =====
  const handleStop = () => {
    stopTimer()
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setGameState("stopped")
  }

  // ===== Submit Answer =====
  const handleSubmit = async () => {
    if (!question) return
    setGameState("submitting")
    try {
      let answer: any
      const qType = question.question_type

      if (qType === "RHYTHM_CLASSIFICATION") {
        answer = { selected_answer: selectedAnswer }
      } else if (qType === "RHYTHM_PUZZLE") {
        answer = { selected_notes: selectedNotes }
      } else if (qType === "SPOT_THE_BUG") {
        answer = { selected_position: selectedPosition }
      } else if (qType === "SPLIT_BRAIN") {
        answer = { left_hand_timestamps_ms: leftTimes, right_hand_timestamps_ms: rightTimes }
      } else if (qType === "PRODUCER_SANDBOX") {
        const loop_tracks = Object.entries(producerTracks).map(([id, times]) => ({
          instrument_id: parseInt(id),
          hit_times_ms: times,
        }))
        answer = { loop_tracks }
      } else {
        answer = { hit_timestamps_ms: hitTimes }
      }

      const result = await submitAnswer(question.question_id, answer)
      onResult(result)
    } catch {
      setError("提交失败，请重试")
      setGameState("stopped")
    }
  }

  // ===== Tap handlers =====
  const handleTap = () => {
    const t = Math.round(performance.now() - startTimeRef.current)
    setHitTimes((prev) => [...prev, t])
  }

  const handleLeftTap = () => {
    const t = Math.round(performance.now() - startTimeRef.current)
    setLeftTimes((prev) => [...prev, t])
  }

  const handleRightTap = () => {
    const t = Math.round(performance.now() - startTimeRef.current)
    setRightTimes((prev) => [...prev, t])
  }

  const handleProducerTap = () => {
    if (currentInstrumentId === null) return
    const t = Math.round(performance.now() - startTimeRef.current)
    setProducerTracks((prev) => ({
      ...prev,
      [currentInstrumentId!]: [...(prev[currentInstrumentId!] || []), t],
    }))
  }

  // ===== Note pool toggle for RHYTHM_PUZZLE =====
  const addPuzzleNote = (item: NotePoolItem) => {
    setSelectedNotes((prev) => [
      ...prev,
      { note_id: item.note_id, note_type: item.note_type, position: prev.length },
    ])
  }

  const removePuzzleNote = (index: number) => {
    setSelectedNotes((prev) => prev.filter((_, i) => i !== index).map((n, i) => ({ ...n, position: i })))
  }

  // ===== Loading State =====
  if (gameState === "loading") {
    return (
      <div className="h-full bg-background flex flex-col">
        <div className="px-4 py-4 flex items-center gap-3 border-b border-border/50">
          <Skeleton className="w-9 h-9 rounded-full" />
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="space-y-4 w-64">
            <Skeleton className="h-48 rounded-3xl" />
            <Skeleton className="h-12 rounded-2xl" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full bg-background flex flex-col items-center justify-center gap-4 px-4">
        <AlertTriangle className="w-12 h-12 text-destructive" />
        <p className="text-muted-foreground">{error}</p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack}>返回</Button>
          <Button onClick={loadQuestion}>重试</Button>
        </div>
      </div>
    )
  }

  if (!question) return null

  const qType = question.question_type
  const remaining = Math.max(0, question.duration_ms - elapsed)
  const remainingSec = Math.ceil(remaining / 1000)
  const progressPct = Math.min(100, (elapsed / question.duration_ms) * 100)
  const isPlaying = gameState === "playing"

  // ===== Render Question-Specific UI =====
  const renderQuestionContent = () => {
    switch (qType) {
      case "RHYTHM_CLASSIFICATION":
        return (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4">
            <div className="flex items-center gap-3">
              <Ear className="w-8 h-8 text-primary" />
              <span className="text-lg text-muted-foreground">听音频，选择拍号</span>
            </div>
            <OptionButtons
              options={question.question_payload.options || ["2/4", "3/4", "4/4"]}
              selected={selectedAnswer}
              onSelect={setSelectedAnswer}
              disabled={!isPlaying && gameState !== "stopped"}
            />
          </div>
        )

      case "ACCENT_DETECTION":
        return (
          <TapPad
            onClick={handleTap}
            disabled={!isPlaying}
            hitCount={hitTimes.length}
            hintText="在每小节第一拍点击"
            icon={<Drum className="w-10 h-10" />}
          />
        )

      case "RHYTHM_PUZZLE": {
        const notePool = question.question_payload.note_pool || []
        const timeSigNum = parseInt(question.time_signature.split("/")[0]) || 4
        const totalBeats = selectedNotes.reduce((sum, n) => {
          const item = notePool.find((np) => np.note_id === n.note_id)
          return sum + (item ? item.duration_ms : 0)
        }, 0)
        const refBeat = 60000 / question.bpm
        const fillRatio = totalBeats / (timeSigNum * refBeat)

        return (
          <div className="flex-1 flex flex-col px-4 py-4 gap-4">
            {/* Measure container */}
            <div className="rounded-2xl border-2 border-dashed border-border/70 p-4 bg-card/50 min-h-[120px]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">小节填充</span>
                <span className="text-xs text-muted-foreground">{selectedNotes.length} 个音符</span>
              </div>
              <div className="flex flex-wrap gap-2 min-h-[48px] items-center">
                {selectedNotes.length === 0 && (
                  <span className="text-sm text-muted-foreground/50">点击下方音符添加到小节</span>
                )}
                {selectedNotes.map((n, i) => {
                  const item = notePool.find((np) => np.note_id === n.note_id)
                  return (
                    <button
                      key={i}
                      onClick={() => isPlaying && removePuzzleNote(i)}
                      className="px-3 py-2 rounded-lg bg-primary/15 text-primary text-sm font-medium hover:bg-primary/25 transition-colors"
                    >
                      {item?.note_type || "?"}
                    </button>
                  )
                })}
              </div>
              <div className="mt-3">
                <Progress
                  value={Math.min(100, fillRatio * 100)}
                  className={cn("h-2", fillRatio > 1 && "[&>div]:bg-destructive")}
                />
              </div>
            </div>

            {/* Note Pool */}
            <div>
              <span className="text-xs font-medium text-muted-foreground mb-2 block">音符池</span>
              <div className="grid grid-cols-3 gap-2">
                {notePool.map((item, i) => (
                  <NotePoolCard
                    key={item.note_id || i}
                    noteType={item.note_type}
                    durationMs={item.duration_ms}
                    name={item.note_type}
                    symbol={item.note_type === "REST" ? "𝄽" : item.note_type === "WHOLE" ? "𝅝" : item.note_type === "HALF" ? "𝅗𝅥" : item.note_type === "QUARTER" ? "♩" : item.note_type === "EIGHTH" ? "♪" : "𝅘𝅥𝅯"}
                    onClick={() => isPlaying && addPuzzleNote(item)}
                  />
                ))}
              </div>
            </div>
          </div>
        )
      }

      case "UPBEAT_TRAINING":
        return (
          <div className="flex-1 flex flex-col items-center gap-2">
            <BeatVisualizer bpm={question.bpm} isPlaying={isPlaying} />
            <TapPad
              onClick={handleTap}
              disabled={!isPlaying}
              hitCount={hitTimes.length}
              hintText="在反拍位置点击"
              icon={<Hand className="w-10 h-10" />}
            />
          </div>
        )

      case "SIGHT_READING": {
        const scoreSheet = question.question_payload.score_sheet || []
        return (
          <SightReadingContent
            scoreSheet={scoreSheet}
            isPlaying={isPlaying}
            bpm={question.bpm}
            hitCount={hitTimes.length}
            onTap={handleTap}
          />
        )
      }

      case "SPOT_THE_BUG": {
        const scoreSheet = question.question_payload.score_sheet || []
        return (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <span className="text-sm text-muted-foreground">找出听起来和看起来不一样的那个音符</span>
            </div>
            <div className="flex flex-wrap gap-3 justify-center">
              {scoreSheet.map((note, i) => (
                <ScoreSheetCard
                  key={i}
                  index={i}
                  noteType={note.note_type}
                  isSelected={selectedPosition === i}
                  onClick={() => isPlaying && setSelectedPosition(i)}
                  disabled={!isPlaying && gameState !== "stopped"}
                />
              ))}
            </div>
            {selectedPosition !== null && (
              <p className="text-sm text-muted-foreground">已选择位置 #{selectedPosition + 1}</p>
            )}
          </div>
        )
      }

      case "METRIC_MODULATION":
        return (
          <div className="flex-1 flex flex-col items-center gap-2 px-4">
            <div className="w-full max-w-sm p-4 rounded-2xl bg-card border border-border/50 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <ArrowLeftRight className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">当前密度</span>
              </div>
              <span className="text-2xl font-black text-foreground">
                {hitTimes.length % 3 === 0 ? "三连音" : hitTimes.length % 3 === 1 ? "八分" : "十六分"}
              </span>
            </div>
            <TapPad
              onClick={handleTap}
              disabled={!isPlaying}
              hitCount={hitTimes.length}
              hintText="根据上方提示切换敲击密度"
              icon={<Zap className="w-10 h-10" />}
            />
          </div>
        )

      case "SPLIT_BRAIN":
        return (
          <div className="flex-1 flex px-1 gap-1">
            {/* Left hand */}
            <div className="flex-1 flex flex-col items-center justify-center gap-2">
              <span className="text-xs font-bold text-accent-foreground bg-accent/20 px-3 py-1 rounded-full">左手区域</span>
              <TapPad
                onClick={handleLeftTap}
                disabled={!isPlaying}
                hitCount={leftTimes.length}
                hintText="左手"
                className="!p-1"
              />
            </div>
            {/* Divider */}
            <div className="w-px bg-border/50 my-4" />
            {/* Right hand */}
            <div className="flex-1 flex flex-col items-center justify-center gap-2">
              <span className="text-xs font-bold text-primary bg-primary/20 px-3 py-1 rounded-full">右手区域</span>
              <TapPad
                onClick={handleRightTap}
                disabled={!isPlaying}
                hitCount={rightTimes.length}
                hintText="右手"
                className="!p-1"
              />
            </div>
          </div>
        )

      case "ANTI_DISTRACTION": {
        const distractionLevel = Math.min(5, levelId % 5 + 1)
        return (
          <div className="flex-1 flex flex-col items-center gap-2">
            <div className="w-full max-w-sm px-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">干扰强度</span>
                <span className="text-xs font-medium text-destructive">{distractionLevel}/5</span>
              </div>
              <Progress value={(distractionLevel / 5) * 100} className="h-1.5 [&>div]:bg-destructive" />
            </div>
            <TapPad
              onClick={handleTap}
              disabled={!isPlaying}
              hitCount={hitTimes.length}
              hintText="忽略干扰，只打强拍和次强拍"
              icon={<Ear className="w-10 h-10" />}
            />
          </div>
        )
      }

      case "PRODUCER_SANDBOX":
        return (
          <div className="flex-1 flex flex-col px-4 py-2 gap-3">
            {/* Instrument Tracks */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {instruments.map((inst) => {
                const isActive = currentInstrumentId === inst.instrument_id
                const trackHits = producerTracks[inst.instrument_id] || []
                return (
                  <button
                    key={inst.instrument_id}
                    onClick={() => isPlaying && setCurrentInstrumentId(inst.instrument_id)}
                    className={cn(
                      "flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all shrink-0 min-w-[80px]",
                      isActive
                        ? "border-primary bg-primary/10"
                        : "border-border/50 bg-card hover:border-primary/30",
                    )}
                  >
                    <span className="text-2xl">{inst.icon}</span>
                    <span className="text-xs font-medium text-foreground">{inst.name}</span>
                    <span className={cn("text-xs font-bold", trackHits.length > 0 ? "text-primary" : "text-muted-foreground")}>
                      {trackHits.length}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Recording Area */}
            <div className="flex-1 flex flex-col items-center justify-center">
              <TapPad
                onClick={handleProducerTap}
                disabled={!isPlaying}
                hitCount={producerTracks[currentInstrumentId || 0]?.length || 0}
                hintText={isPlaying ? "按节奏点击录制" : "点击开始后录制"}
                icon={<Drumstick className="w-10 h-10" />}
              />
            </div>
          </div>
        )

      default:
        // Fallback tap pad for unknown types
        return (
          <TapPad
            onClick={handleTap}
            disabled={!isPlaying}
            hitCount={hitTimes.length}
            hintText="按节奏点击"
          />
        )
    }
  }

  // ===== Tutorial Description =====
  const tutorialDescriptions: Record<string, string> = {
    RHYTHM_CLASSIFICATION: "系统会播放一段音乐，你需要判断它是几拍子的。2/4 拍像进行曲，3/4 拍像华尔兹，4/4 拍是流行乐最常见的节奏。",
    ACCENT_DETECTION: "系统播放节拍器，你需要在每小节第一拍（强拍）点击屏幕。跟着强拍的节奏，准确地点击下去！",
    RHYTHM_PUZZLE: "听到一段节奏后，从音符池中选择正确的音符块，把它们填满小节。注意时值的组合要准确哦！",
    UPBEAT_TRAINING: "背景会持续播放底鼓（强拍），你需要在两个底鼓之间的反拍位置点击。感受反拍的律动！",
    SIGHT_READING: "乐谱从左向右滚动，当音符经过判定线时点击。就像音乐游戏一样！",
    SPOT_THE_BUG: "系统显示乐谱并播放音频，但音频中某个音符被替换了。找出那个听起来和看起来不一样的音符。",
    METRIC_MODULATION: "底鼓速度不变，但你需要根据屏幕提示瞬间切换敲击密度。从一种节奏无缝切换到另一种！",
    SPLIT_BRAIN: "双手独立操作！屏幕一分为二，左右手分别打出不同的节奏型。挑战你的协调能力！",
    ANTI_DISTRACTION: "清晰底鼓循环中，只打强拍和次强拍。忽略干扰音轨，保持专注！",
    PRODUCER_SANDBOX: "在背景音乐上叠加录制多轨打击乐。选择乐器，按节奏点击，创建属于你的节奏 Loop！",
  }

  // ===== Tutorial Title =====
  const tutorialTitles: Record<string, string> = {
    RHYTHM_CLASSIFICATION: "律动分类帽",
    ACCENT_DETECTION: "重音识别",
    RHYTHM_PUZZLE: "节奏拼图",
    UPBEAT_TRAINING: "反拍训练",
    SIGHT_READING: "视奏跑酷",
    SPOT_THE_BUG: "听音纠错",
    METRIC_MODULATION: "律动变速",
    SPLIT_BRAIN: "左右互搏",
    ANTI_DISTRACTION: "抗干扰训练",
    PRODUCER_SANDBOX: "节奏制作人",
  }

  return (
    <div className="h-full bg-background flex flex-col">
      {/* Top Status Bar */}
      <div className="px-4 py-3 flex items-center gap-3 border-b border-border/50 shrink-0">
        <button
          onClick={onBack}
          disabled={isPlaying}
          className="w-9 h-9 rounded-full bg-card border border-border/50 flex items-center justify-center hover:bg-secondary transition-colors disabled:opacity-30"
        >
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{tutorialTitles[qType] || qType}</p>
          <p className="text-xs text-muted-foreground">第 {Math.floor(levelId % 100)} 关挑战</p>
        </div>
        <div className="flex items-center gap-2">
          <InfoTag>{question.bpm} BPM</InfoTag>
          <InfoTag>{question.time_signature}</InfoTag>
          <span className={cn(
            "text-sm font-mono font-bold min-w-[2rem] text-right",
            remainingSec <= 5 && isPlaying ? "text-destructive animate-pulse" : "text-foreground",
          )}>
            {remainingSec}s
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <Progress value={progressPct} className="rounded-none h-1 shrink-0" />

      {/* Count-In Overlay */}
      <AnimatePresence>
        {countInText && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 bg-background/90 flex flex-col items-center justify-center"
          >
            <p className="text-2xl font-bold text-foreground mb-2">{countInText}</p>
            <div className="flex items-center gap-2">
              <InfoTag>{question.bpm} BPM</InfoTag>
              <InfoTag>{question.time_signature}</InfoTag>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Content Area */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {renderQuestionContent()}

        {/* Hit Times Preview (debug) */}
        {gameState === "stopped" && hitTimes.length > 0 && (
          <div className="px-4 pb-2">
            <HitTimesPreview timesMs={hitTimes} />
          </div>
        )}
      </div>

      {/* Bottom Action Bar */}
      <div className="px-4 py-4 border-t border-border/50 bg-card/50 shrink-0">
        {gameState === "ready" && (
          <Button size="lg" className="w-full text-base" onClick={handleStart}>
            <Play className="w-5 h-5" /> 开始
          </Button>
        )}

        {gameState === "playing" && (
          <Button variant="outline" size="lg" className="w-full text-base" onClick={handleStop}>
            <Square className="w-5 h-5" /> 停止并提交
          </Button>
        )}

        {gameState === "stopped" && (
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={loadQuestion}>
              <RefreshCw className="w-4 h-4" /> 换一题
            </Button>
            <Button variant="outline" className="flex-1" onClick={handleStart}>
              <RotateCcw className="w-4 h-4" /> 重来
            </Button>
            <Button className="flex-1" onClick={handleSubmit}>
              提交评分
            </Button>
          </div>
        )}

        {gameState === "submitting" && (
          <Button size="lg" className="w-full text-base" disabled>
            提交中...
          </Button>
        )}
      </div>

      {/* Tutorial Modal */}
      <TutorialModal
        open={showTutorial && gameState === "ready"}
        title={tutorialTitles[qType] || qType}
        description={tutorialDescriptions[qType] || "按节奏点击"}
        onStart={handleStart}
      />
    </div>
  )
}
