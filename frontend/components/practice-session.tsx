"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { LevelConfig, CHAPTERS, useGame } from "@/lib/game-context"
import { PitchVisualizer } from "./pitch-visualizer"
import { Button } from "./ui/button"
import { Progress } from "./ui/progress"
import {
  Play,
  Mic,
  Square,
  RotateCcw,
  Volume2,
  Star,
  ChevronRight,
  X
} from "lucide-react"
import { cn } from "@/lib/utils"
import { apiCreateSession, apiSubmitAnswer, apiCompleteSession } from "@/lib/api"

// ─── Module type mapping ───────────────────────────────────────────────
const MODULE_MAP: Record<number, string> = {
  1: 'PITCH_DISCRIMINATION',
  2: 'PITCH_DISCRIMINATION',
  3: 'SINGING_PRACTICE',
  4: 'SINGING_PRACTICE',
  5: 'SINGING_PRACTICE',
  6: 'SINGING_PRACTICE',
  7: 'SINGING_PRACTICE',
}

// ─── 音符查找表 ─────────────────────────────────────────────────────────
const NOTES: Record<string, { midi: number; name: string; freq: number }> = {
  'C4': { midi: 60, name: 'C4', freq: 261.63 },
  'D4': { midi: 62, name: 'D4', freq: 293.66 },
  'E4': { midi: 64, name: 'E4', freq: 329.63 },
  'F4': { midi: 65, name: 'F4', freq: 349.23 },
  'G4': { midi: 67, name: 'G4', freq: 392.00 },
  'A4': { midi: 69, name: 'A4', freq: 440.00 },
  'B4': { midi: 71, name: 'B4', freq: 493.88 },
  'C5': { midi: 72, name: 'C5', freq: 523.25 },
  'D5': { midi: 74, name: 'D5', freq: 587.33 },
  'E5': { midi: 76, name: 'E5', freq: 659.25 },
}

const NOTES_ARRAY = Object.values(NOTES)

// ─── 从音频路径提取 MIDI 编号 ──────────────────────────────────────────
function extractMidiFromAudioPath(path: string): number | null {
  if (!path) return null
  // Match the number before .mp3/.wav
  const match = path.match(/(\d+)\.(mp3|wav)/)
  if (match) return parseInt(match[1], 10)
  return null
}

// ─── Exercise 类型定义 ──────────────────────────────────────────────────
interface Exercise {
  id: number
  type: 'listen' | 'select' | 'sing' | 'pitch_compare'
  targetNotes: number[]
  options?: number[]
  duration: number
  // 音高比较题
  pitchCompareData?: {
    questionId: string
    stem: string
    instruction: string
    audioAPitch: string
    audioBPitch: string
    audioAMidi: number
    audioBMidi: number
    options: { option_id: string; text: string }[]
    correctAnswer: string
    feedback: { correct: string; wrong: string }
  }
  // 后端题目关联
  backendQuestionId?: number
  backendAnswer?: string
}

// ─── 后端题目 → Exercise 转换 ──────────────────────────────────────────
function backendQuestionsToExercises(questions: any[]): Exercise[] {
  return questions.map((q, idx) => {
    const qd = q.question_data || {}
    const type = qd.type as string || ''
    const audit = []

    // 检查是否有包含 MIDI 信息的 audio 字段
    const midis: number[] = []
    if (qd.audios) {
      for (const key of Object.keys(qd.audios)) {
        const path = qd.audios[key]
        const m = extractMidiFromAudioPath(path)
        if (m !== null && !midis.includes(m)) midis.push(m)
      }
    }
    // T6/T7 从 target 取 MIDI
    if (qd.target?.notes) {
      qd.target.notes.forEach((n: any) => {
        if (n.pitchMidi && !midis.includes(n.pitchMidi)) midis.push(n.pitchMidi)
      })
    }
    // 如果没拿到就用随机 C4-G4
    const notePool = midis.length > 0 ? midis : [60, 62, 64, 65, 67, 69, 71, 72]

    // ── T1: 两音比高低 → pitch_compare ──
    if (type === 'T1') {
      const options = (qd.options || []).map((o: any) => ({
        option_id: o.id || '',
        text: o.text || '',
      }))
      const answer = qd.answer?.[0] || ''
      const aMidi = extractMidiFromAudioPath(qd.audios?.A) || notePool[0]
      const bMidi = extractMidiFromAudioPath(qd.audios?.B) || (notePool.length > 1 ? notePool[1] : notePool[0])

      return {
        id: idx,
        type: 'pitch_compare' as const,
        targetNotes: [aMidi, bMidi],
        duration: 2000,
        backendQuestionId: q.question_id,
        backendAnswer: answer,
        pitchCompareData: {
          questionId: String(q.question_id),
          stem: qd.prompt || '听 A 和 B，哪个音更高？',
          instruction: '依次点击 A、B 两个播放按钮，听完后选择答案。',
          audioAPitch: `音${aMidi}`,
          audioBPitch: `音${bMidi}`,
          audioAMidi: aMidi,
          audioBMidi: bMidi,
          options: options.length > 0 ? options : [
            { option_id: 'A', text: 'A 更高' },
            { option_id: 'B', text: 'B 更高' },
          ],
          correctAnswer: answer,
          feedback: { correct: '答对了！', wrong: '再试一次' },
        },
      }
    }

    // ── T2: 三音找最高 → listen ──
    if (type === 'T2') {
      return {
        id: idx,
        type: 'listen' as const,
        targetNotes: notePool.slice(0, 3),
        options: notePool.slice(0, 3),
        duration: 3000,
        backendQuestionId: q.question_id,
        backendAnswer: qd.answer?.[0] || '',
      }
    }

    // ── T6/T7: 跟唱 → sing ──
    if (type === 'T6' || type === 'T7') {
      return {
        id: idx,
        type: 'sing' as const,
        targetNotes: notePool,
        duration: Math.max(2000, notePool.length * 800),
        backendQuestionId: q.question_id,
        backendAnswer: JSON.stringify(qd.target?.notes || notePool),
      }
    }

    // ── 默认回退：展示为选择型 ──
    const fallbackOptions = (qd.options || []).map((_o: any, i: number) =>
      extractMidiFromAudioPath(qd.audios?.[String.fromCharCode(65 + i)]) || 60 + i * 2
    )
    return {
      id: idx,
      type: 'select' as const,
      targetNotes: [notePool[0]],
      options: fallbackOptions.length > 0 ? fallbackOptions : [60, 62, 64, 65],
      duration: 2000,
      backendQuestionId: q.question_id,
      backendAnswer: qd.answer?.[0] || '',
    }
  })
}

// ─── 本地备选题目生成（V0 原有逻辑，后端不可用时降级） ──────────────
function generateLocalExercises(level: LevelConfig): Exercise[] {
  const exercises: Exercise[] = []
  const count = level.exerciseCount
  for (let i = 0; i < count; i++) {
    let exercise: Exercise
    if (level.chapterId === 1) {
      const note1 = NOTES_ARRAY[Math.floor(Math.random() * 6)]
      const note2 = NOTES_ARRAY[Math.floor(Math.random() * 6) + (level.levelNumber > 1 ? 0 : 1)]
      exercise = { id: i, type: 'listen', targetNotes: [note1.midi, note2.midi], options: [note1.midi, note2.midi], duration: 2000 }
    } else if (level.chapterId === 2) {
      const targetNote = NOTES_ARRAY[Math.floor(Math.random() * NOTES_ARRAY.length)]
      const options = [targetNote.midi]
      while (options.length < 4) {
        const opt = NOTES_ARRAY[Math.floor(Math.random() * NOTES_ARRAY.length)]
        if (!options.includes(opt.midi)) options.push(opt.midi)
      }
      exercise = { id: i, type: 'select', targetNotes: [targetNote.midi], options: options.sort(() => Math.random() - 0.5), duration: 3000 }
    } else {
      const noteCount = Math.min(level.chapterId - 1, 6)
      const startIdx = Math.floor(Math.random() * (NOTES_ARRAY.length - noteCount))
      const notes = NOTES_ARRAY.slice(startIdx, startIdx + noteCount).map(n => n.midi)
      exercise = { id: i, type: 'sing', targetNotes: notes, duration: 1000 * noteCount }
    }
    exercises.push(exercise)
  }
  return exercises
}

// ─── PracticeSession 主组件 ─────────────────────────────────────────────
interface PracticeSessionProps {
  level: LevelConfig
  onComplete: (stars: number, accuracy: number) => void
  onExit: () => void
}

export function PracticeSession({ level, onComplete, onExit }: PracticeSessionProps) {
  const { addPracticeRecord } = useGame()
  const chapter = CHAPTERS.find(c => c.id === level.chapterId)

  const [exercises, setExercises] = useState<Exercise[]>([])
  const [sessionId, setSessionId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [backendMode, setBackendMode] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [phase, setPhase] = useState<'ready' | 'playing' | 'recording' | 'result'>('ready')
  const [userAnswer, setUserAnswer] = useState<number | null>(null)
  const [results, setResults] = useState<{ correct: boolean; accuracy: number }[]>([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [userPitches, setUserPitches] = useState<{ time: number; pitch: number }[]>([])
  const [streak, setStreak] = useState(0)
  const [practiceLog, setPracticeLog] = useState<string[]>([])
  const [feedbackMessage, setFeedbackMessage] = useState<string>('')
  const [hearts, setHearts] = useState(5)

  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const isRecordingRef = useRef(false)

  // ── 初始化：加载题目 ──
  useEffect(() => {
    initSession()
    audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    return () => { audioContextRef.current?.close() }
  }, [])

  async function initSession() {
    const moduleType = MODULE_MAP[level.chapterId]
    if (!moduleType) {
      setExercises(generateLocalExercises(level))
      setLoading(false)
      return
    }
    try {
      const session = await apiCreateSession(moduleType)
      setSessionId(session.session_id)
      const exs = backendQuestionsToExercises(session.questions)
      setExercises(exs.slice(0, level.exerciseCount))
      setBackendMode(true)
    } catch {
      console.warn('Backend unavailable, using local exercises')
      setExercises(generateLocalExercises(level))
    }
    setLoading(false)
  }

  // ── 提交答案到后端 ──
  async function submitBackend(exercise: Exercise, isCorrect: boolean, answerText: string) {
    if (!sessionId || !exercise.backendQuestionId) return
    try {
      const res = await apiSubmitAnswer(sessionId, exercise.backendQuestionId, answerText)
      setHearts(res.hearts_remaining)
      setStreak(res.combo_count)
      return res
    } catch {
      // 后端失败不影响本地流程
    }
  }

  const currentExercise = exercises[currentIndex]

  // ── 播放 MIDI 音符 ──
  const playNote = useCallback((midi: number, duration: number = 500) => {
    const ctx = audioContextRef.current
    if (!ctx) return
    const freq = 440 * Math.pow(2, (midi - 69) / 12)
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    osc.connect(gain)
    gain.connect(ctx.destination)
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + duration / 1000)
  }, [])

  // ── 播放目标音符序列 ──
  const playTargetNotes = useCallback(async () => {
    if (!currentExercise) return
    setIsPlaying(true)
    const notes = currentExercise.targetNotes
    const noteDelay = currentExercise.duration / notes.length
    for (let i = 0; i < notes.length; i++) {
      playNote(notes[i], Math.min(noteDelay - 50, 800))
      await new Promise(resolve => setTimeout(resolve, noteDelay))
    }
    setIsPlaying(false)
    setPhase('recording')
  }, [currentExercise, playNote])

  // ── 录音 ──
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream
      const ctx = audioContextRef.current
      if (!ctx) return
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 2048
      source.connect(analyser)
      analyserRef.current = analyser
      setIsRecording(true)
      isRecordingRef.current = true
      setUserPitches([])

      const startTime = Date.now()
      const detectPitch = () => {
        if (!isRecordingRef.current) return
        const buffer = new Float32Array(analyser.fftSize)
        analyser.getFloatTimeDomainData(buffer)
        const pitch = autoCorrelate(buffer, ctx.sampleRate)
        if (pitch > 0) {
          const midi = 12 * Math.log2(pitch / 440) + 69
          setUserPitches(prev => [...prev, { time: Date.now() - startTime, pitch: midi }])
        }
        requestAnimationFrame(detectPitch)
      }
      detectPitch()
      setTimeout(() => stopRecording(), currentExercise.duration + 500)
    } catch (error) {
      console.error('Failed to start recording:', error)
    }
  }, [currentExercise])

  const stopRecording = useCallback(() => {
    isRecordingRef.current = false
    setIsRecording(false)
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop())
    }
    setPhase('result')
  }, [])

  // ── 计算准确率 ──
  const calculateAccuracy = useCallback(() => {
    if (currentExercise.type === 'listen' || currentExercise.type === 'select') {
      return userAnswer === currentExercise.targetNotes[0] ? 100 : 0
    }
    if (userPitches.length === 0) return 0
    let totalDiff = 0, count = 0
    userPitches.forEach(up => {
      const targetIdx = Math.floor(up.time / (currentExercise.duration / currentExercise.targetNotes.length))
      const targetPitch = currentExercise.targetNotes[Math.min(targetIdx, currentExercise.targetNotes.length - 1)]
      totalDiff += Math.abs(up.pitch - targetPitch)
      count++
    })
    const avgDiff = count > 0 ? totalDiff / count : 12
    return Math.max(0, Math.min(100, 100 - (avgDiff / 6) * 100))
  }, [currentExercise, userAnswer, userPitches])

  // ── 处理音高比较答案 ──
  const handlePitchCompareAnswer = (selectedOption: string) => {
    if (!currentExercise.pitchCompareData) return
    const isCorrect = selectedOption === currentExercise.pitchCompareData.correctAnswer
    const feedback = isCorrect ? currentExercise.pitchCompareData.feedback.correct : currentExercise.pitchCompareData.feedback.wrong
    setFeedbackMessage(feedback)
    const acc = isCorrect ? 100 : 0
    setResults(prev => [...prev, { correct: isCorrect, accuracy: acc }])
    if (isCorrect) { setStreak(prev => prev + 1); setPracticeLog(prev => [...prev, `正确(${streak + 1}次)`]) }
    else { setPracticeLog(prev => [...prev, `错误→重练`]); setStreak(0) }
    if (backendMode && currentExercise.backendQuestionId) {
      submitBackend(currentExercise, isCorrect, selectedOption)
    }
    setPhase('result')
  }

  // ── 处理选择型答案 ──
  const handleSelect = (option: number) => {
    setUserAnswer(option)
    let isCorrect = false
    if (currentExercise.type === 'listen') {
      const higherNote = Math.max(...currentExercise.targetNotes)
      isCorrect = option === higherNote
    } else {
      isCorrect = option === currentExercise.targetNotes[0]
    }
    setResults(prev => [...prev, { correct: isCorrect, accuracy: isCorrect ? 100 : 0 }])
    if (isCorrect) { setStreak(prev => prev + 1); setPracticeLog(prev => [...prev, `正确(${streak + 1}次)`]) }
    else { setPracticeLog(prev => [...prev, `错误→重练`]); setStreak(0) }
    if (backendMode && currentExercise.backendQuestionId) {
      submitBackend(currentExercise, isCorrect, String(option))
    }
    setPhase('result')
  }

  // ── 提交录音结果 ──
  const submitRecording = () => {
    const accuracy = calculateAccuracy()
    const isCorrect = accuracy >= level.minAccuracy
    setResults(prev => [...prev, { correct: isCorrect, accuracy }])
    if (isCorrect) { setStreak(prev => prev + 1); setPracticeLog(prev => [...prev, `模唱准确率${accuracy.toFixed(0)}%`]) }
    else { setPracticeLog(prev => [...prev, `准确率不足→重练`]); setStreak(0) }
    if (backendMode && currentExercise.backendQuestionId) {
      submitBackend(currentExercise, isCorrect, String(Math.round(accuracy)))
    }
    setPhase('result')
  }

  // ── 下一题 / 完成 ──
  const nextExercise = async () => {
    if (currentIndex < exercises.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setPhase('ready')
      setUserAnswer(null)
      setUserPitches([])
      setFeedbackMessage('')
    } else {
      // 如果是后端模式，complete session
      if (sessionId && backendMode) {
        try {
          await apiCompleteSession(sessionId)
        } catch { /* ignore */ }
      }
      // 计算最终成绩
      const totalAccuracy = results.length > 0 ? results.reduce((sum, r) => sum + r.accuracy, 0) / results.length : 0
      let stars = 0
      if (totalAccuracy >= level.targetAccuracy) stars = 3
      else if (totalAccuracy >= level.minAccuracy + 10) stars = 2
      else if (totalAccuracy >= level.minAccuracy) stars = 1
      addPracticeRecord({
        chapterId: level.chapterId,
        levelId: level.id,
        accuracy: totalAccuracy,
        stars,
        path: practiceLog.join(' → '),
      })
      onComplete(stars, totalAccuracy)
    }
  }

  const retryExercise = () => {
    setPhase('ready')
    setUserAnswer(null)
    setUserPitches([])
    setFeedbackMessage('')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">加载题目中...</p>
        </div>
      </div>
    )
  }

  if (!currentExercise) return null

  const currentResult = results[currentIndex]
  const progressPercent = ((currentIndex + (phase === 'result' ? 1 : 0)) / exercises.length) * 100
  const targetPitchPoints = currentExercise.targetNotes.map((note, i) => ({
    time: (i / currentExercise.targetNotes.length) * currentExercise.duration,
    pitch: note,
    isTarget: true,
  }))

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="px-4 pt-6 pb-4" style={{ background: `linear-gradient(180deg, ${chapter?.color}30 0%, transparent 100%)` }}>
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="icon" onClick={onExit}>
            <X className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{currentIndex + 1}/{exercises.length}</span>
          </div>
          <div className="flex items-center gap-2">
            {Array.from({ length: 5 }, (_, i) => (
              <span key={i} className={`text-sm ${i < hearts ? 'text-red-400' : 'text-gray-300'}`}>♥</span>
            ))}
          </div>
        </div>
        <Progress value={progressPercent} className="h-2" />
        <div className="flex items-center justify-between mt-3">
          <span className="text-sm text-muted-foreground">{chapter?.title} - {level.description}</span>
          <div className="flex items-center gap-1 text-sm">
            <span className="text-muted-foreground">连续:</span>
            <span className="font-semibold text-foreground">{streak}</span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col px-4 py-6">
        {currentExercise.type === 'sing' && (
          <PitchVisualizer
            targetPitches={targetPitchPoints}
            userPitches={userPitches}
            isRecording={isRecording}
            duration={currentExercise.duration}
            chapterColor={chapter?.color}
            className="h-48 mb-6"
          />
        )}

        <div className="flex-1 flex flex-col items-center justify-center">
          {phase === 'ready' && (
            <div className="text-center">
              <div className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: `${chapter?.color}40` }}>
                <Volume2 className="w-10 h-10" style={{ color: chapter?.color }} />
              </div>
              <h2 className="text-xl font-semibold mb-2">
                {currentExercise.type === 'pitch_compare' && (currentExercise.pitchCompareData?.stem || '听 A 和 B，哪个音更高？')}
                {currentExercise.type === 'listen' && '听音判断高低'}
                {currentExercise.type === 'select' && '选择正确音符'}
                {currentExercise.type === 'sing' && '跟唱目标音高'}
              </h2>
              <p className="text-muted-foreground mb-8">
                {currentExercise.type === 'pitch_compare' && (currentExercise.pitchCompareData?.instruction || '依次点击 A、B 两个播放按钮，听完后选择答案。')}
                {currentExercise.type === 'listen' && '听两个音，点击更高的那个'}
                {currentExercise.type === 'select' && '听音后选择对应的音符'}
                {currentExercise.type === 'sing' && '听完后跟着唱，保持音准'}
              </p>

              {/* 音高比较题：双播放按钮 + 选项 */}
              {currentExercise.type === 'pitch_compare' && currentExercise.pitchCompareData && (
                <>
                  <div className="flex justify-center gap-6 mb-6">
                    <button onClick={() => playNote(currentExercise.pitchCompareData!.audioAMidi, 800)}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 hover:scale-105 active:scale-95 transition-all"
                      style={{ borderColor: chapter?.color, backgroundColor: `${chapter?.color}20` }}>
                      <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: `${chapter?.color}40` }}>
                        <Play className="w-8 h-8" style={{ color: chapter?.color }} />
                      </div>
                      <span className="text-lg font-semibold">A</span>
                      <span className="text-xs text-muted-foreground">{currentExercise.pitchCompareData.audioAPitch}</span>
                    </button>
                    <button onClick={() => playNote(currentExercise.pitchCompareData!.audioBMidi, 800)}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 hover:scale-105 active:scale-95 transition-all"
                      style={{ borderColor: chapter?.color, backgroundColor: `${chapter?.color}20` }}>
                      <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: `${chapter?.color}40` }}>
                        <Play className="w-8 h-8" style={{ color: chapter?.color }} />
                      </div>
                      <span className="text-lg font-semibold">B</span>
                      <span className="text-xs text-muted-foreground">{currentExercise.pitchCompareData.audioBPitch}</span>
                    </button>
                  </div>
                  <div className="flex flex-col gap-3 w-full max-w-xs mx-auto">
                    {currentExercise.pitchCompareData.options.map(option => (
                      <button key={option.option_id} onClick={() => handlePitchCompareAnswer(option.option_id)}
                        className="p-4 rounded-xl border-2 transition-all hover:scale-[1.02] active:scale-[0.98] text-left"
                        style={{ borderColor: chapter?.color, backgroundColor: `${chapter?.color}10` }}>
                        <span className="font-medium">{option.option_id}. {option.text}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* 非音高比较题：播放按钮 */}
              {currentExercise.type !== 'pitch_compare' && (
                <Button size="lg" onClick={() => { setPhase('playing'); playTargetNotes() }}
                  style={{ backgroundColor: chapter?.color }} className="text-foreground">
                  <Play className="w-5 h-5 mr-2" /> 播放音符
                </Button>
              )}
            </div>
          )}

          {phase === 'playing' && (
            <div className="text-center">
              <div className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center animate-pulse" style={{ backgroundColor: `${chapter?.color}60` }}>
                <Volume2 className="w-10 h-10" style={{ color: chapter?.color }} />
              </div>
              <p className="text-lg font-medium">正在播放...</p>
            </div>
          )}

          {phase === 'recording' && currentExercise.type !== 'sing' && (
            <div className="w-full max-w-sm">
              <p className="text-center text-lg font-medium mb-6">
                {currentExercise.type === 'listen' ? '哪个音更高？' : '选择正确的音符'}
              </p>
              <div className="grid grid-cols-2 gap-4">
                {currentExercise.options?.map((option, i) => {
                  const note = NOTES.find(n => n.midi === option)
                  return (
                    <button key={option} onClick={() => handleSelect(option)}
                      className="p-6 rounded-2xl border-2 transition-all hover:scale-105 active:scale-95 flex flex-col items-center justify-center gap-2"
                      style={{ borderColor: chapter?.color, backgroundColor: `${chapter?.color}20` }}>
                      <span className="text-2xl font-bold">{note?.name || `音${i + 1}`}</span>
                      {currentExercise.type === 'listen' && (
                        <span className="text-sm text-muted-foreground">{i === 0 ? '第一个音' : '第二个音'}</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {phase === 'recording' && currentExercise.type === 'sing' && (
            <div className="text-center">
              {!isRecording ? (
                <>
                  <div className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: `${chapter?.color}40` }}>
                    <Mic className="w-10 h-10" style={{ color: chapter?.color }} />
                  </div>
                  <p className="text-lg font-medium mb-6">准备好开始录音</p>
                  <div className="flex gap-4 justify-center">
                    <Button variant="outline" onClick={() => playTargetNotes()}><Volume2 className="w-4 h-4 mr-2" />重听</Button>
                    <Button onClick={startRecording} style={{ backgroundColor: chapter?.color }} className="text-foreground">
                      <Mic className="w-4 h-4 mr-2" />开始录音
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center animate-pulse" style={{ backgroundColor: '#E8A0A040' }}>
                    <Mic className="w-10 h-10 text-[#E8A0A0]" />
                  </div>
                  <p className="text-lg font-medium mb-6">正在录音，请跟唱...</p>
                  <Button variant="destructive" onClick={stopRecording}>
                    <Square className="w-4 h-4 mr-2" /> 停止录音
                  </Button>
                </>
              )}
            </div>
          )}

          {phase === 'result' && (
            <div className="text-center w-full max-w-sm">
              <div className={`w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center ${currentResult?.correct ? "bg-accent/40" : "bg-destructive/20"}`}>
                {currentResult?.correct ? (
                  <div className="flex">
                    {[0, 1, 2].map(i => (
                      <Star key={i} className={`w-6 h-6 ${i === 0 ? "fill-[var(--star-gold)] text-[var(--star-gold)]" : currentResult.accuracy >= level.minAccuracy + 10 && i === 1 ? "fill-[var(--star-gold)] text-[var(--star-gold)]" : currentResult.accuracy >= level.targetAccuracy && i === 2 ? "fill-[var(--star-gold)] text-[var(--star-gold)]" : "text-[var(--star-empty)]"}`} />
                    ))}
                  </div>
                ) : <X className="w-10 h-10 text-destructive" />}
              </div>
              <h2 className="text-xl font-semibold mb-2">{currentResult?.correct ? '太棒了!' : '再试一次'}</h2>
              <p className="text-muted-foreground mb-6">
                {feedbackMessage || (currentExercise.type === 'sing' ? `准确率: ${currentResult?.accuracy.toFixed(0)}%` : currentResult?.correct ? '回答正确' : '回答错误')}
              </p>
              <div className="flex gap-4 justify-center">
                {!currentResult?.correct && (
                  <Button variant="outline" onClick={retryExercise}><RotateCcw className="w-4 h-4 mr-2" />重试</Button>
                )}
                <Button onClick={nextExercise} style={{ backgroundColor: chapter?.color }} className="text-foreground">
                  {currentIndex < exercises.length - 1 ? <>下一题<ChevronRight className="w-4 h-4 ml-2" /></> : '完成关卡'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {practiceLog.length > 0 && (
        <div className="px-4 pb-4">
          <div className="p-3 rounded-lg bg-secondary text-xs text-muted-foreground">
            <span className="font-medium">练习路径: </span>
            {practiceLog.join(' → ')}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── 自相关音高检测 ─────────────────────────────────────────────────────
function autoCorrelate(buffer: Float32Array, sampleRate: number): number {
  const SIZE = buffer.length
  const MAX_SAMPLES = Math.floor(SIZE / 2)
  let bestOffset = -1, bestCorrelation = 0, rms = 0
  for (let i = 0; i < SIZE; i++) rms += buffer[i] * buffer[i]
  rms = Math.sqrt(rms / SIZE)
  if (rms < 0.01) return -1
  let lastCorrelation = 1
  for (let offset = 0; offset < MAX_SAMPLES; offset++) {
    let correlation = 0
    for (let i = 0; i < MAX_SAMPLES; i++) correlation += Math.abs(buffer[i] - buffer[i + offset])
    correlation = 1 - (correlation / MAX_SAMPLES)
    if (correlation > 0.9 && correlation > lastCorrelation) { bestCorrelation = correlation; bestOffset = offset }
    lastCorrelation = correlation
  }
  if (bestCorrelation > 0.01 && bestOffset > 0) return sampleRate / bestOffset
  return -1
}
