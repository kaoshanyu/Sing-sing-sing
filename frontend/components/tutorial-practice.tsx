"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "./ui/button"
import { Progress } from "./ui/progress"
import {
  ArrowLeft,
  Play,
  Mic,
  Star,
  Heart,
  Check,
  X,
  RotateCcw,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { apiCreateSession, apiSubmitAnswer, apiCompleteSession } from "@/lib/api"

// Module → backend module type mapping
const MODULE_TO_BACKEND: Record<string, string> = {
  'pitch-recognition': 'PITCH_DISCRIMINATION',
  'interval-dictation': 'INTERVAL_DICTATION',
  'listen-and-sing': 'SINGING_PRACTICE',
}

// 音符数据
// 从音频路径提取 MIDI
function extractMidiFromAudioPath(path: string): number | null {
  if (!path) return null
  const match = path.match(/(\d+)\.(mp3|wav)/)
  if (match) return parseInt(match[1], 10)
  return null
}

const NOTES_MAP: Record<number, { name: string; solfege: string }> = {
  60: { name: 'C4', solfege: 'do' },
  61: { name: 'C#4', solfege: 'do' },
  62: { name: 'D4', solfege: 're' },
  63: { name: 'D#4', solfege: 're' },
  64: { name: 'E4', solfege: 'mi' },
  65: { name: 'F4', solfege: 'fa' },
  66: { name: 'F#4', solfege: 'fa' },
  67: { name: 'G4', solfege: 'so' },
  68: { name: 'G#4', solfege: 'so' },
  69: { name: 'A4', solfege: 'la' },
  70: { name: 'A#4', solfege: 'la' },
  71: { name: 'B4', solfege: 'si' },
  72: { name: 'C5', solfege: 'do' },
  73: { name: 'C#5', solfege: 'do' },
  74: { name: 'D5', solfege: 're' },
  75: { name: 'D#5', solfege: 're' },
  76: { name: 'E5', solfege: 'mi' },
}

function midiInfo(midi: number): { name: string; solfege: string } {
  return NOTES_MAP[midi] || { name: `MIDI${midi}`, solfege: `note${midi}` }
}

// 后端题目 → Question 转换
function backendToQuestions(backendQuestions: any[]): Question[] {
  return backendQuestions.map((q, idx) => {
    const qd = q.question_data || {}
    const type = qd.type as string || 'T1'
    const isNew = !q.is_from_wrong_book
    const midis: number[] = []

    if (qd.audios) {
      for (const key of ['A', 'B', 'C']) {
        const m = extractMidiFromAudioPath(qd.audios[key])
        if (m !== null) midis.push(m)
      }
    }
    if (qd.target?.notes) {
      qd.target.notes.forEach((n: any) => {
        if (n.pitchMidi && !midis.includes(n.pitchMidi)) midis.push(n.pitchMidi)
      })
    }

    const base: Question = {
      id: `B${q.question_id}`,
      type: type as QuestionType,
      typeName: `${type}${qd.title ? ' ' + qd.title : ''}`,
      isNew,
    }

    if (type === 'T1' && midis.length >= 2) {
      return { ...base, audioA: { pitch: midiInfo(midis[0]).name, midi: midis[0] }, audioB: { pitch: midiInfo(midis[1]).name, midi: midis[1] }, correctAnswer: qd.answer?.[0] || 'A' }
    }
    if (type === 'T2' && midis.length >= 3) {
      return { ...base, audioA: { pitch: midiInfo(midis[0]).name, midi: midis[0] }, audioB: { pitch: midiInfo(midis[1]).name, midi: midis[1] }, audioC: { pitch: midiInfo(midis[2]).name, midi: midis[2] }, correctAnswer: qd.answer?.[0] || 'A' }
    }
    if (type === 'T6' || type === 'T7') {
      const targetPitches = (qd.target?.notes || []).map((n: any) => ({ pitch: midiInfo(n.pitchMidi).name, midi: n.pitchMidi, solfege: midiInfo(n.pitchMidi).solfege }))
      return { ...base, targetPitches: targetPitches.length > 0 ? targetPitches : midis.map(m => ({ pitch: midiInfo(m).name, midi: m, solfege: midiInfo(m).solfege })) }
    }
    // fallback: T3/T4/T5 use local generation
    return generateLocalQuestion(type as QuestionType, idx)
  })
}

// 本地备选：针对题库缺失的题型
function generateLocalQuestion(type: QuestionType, seed: number): Question {
  const notesArray = Object.entries(NOTES)
  if (type === 'T3') {
    const a = Math.floor((seed * 7 + 13) % 5), b = Math.floor((seed * 3 + 1) % 5)
    const ia = Math.floor(seed % 4) + 2, ib = Math.floor(((seed * 7 + 11) % 4)) + 2
    return { id: `local-${seed}`, type: 'T3', typeName: 'T3音程比较', isNew: true, melodyA: { pitches: [notesArray[a][0], notesArray[Math.min(a + ia, 9)][0]], midis: [notesArray[a][1].midi, notesArray[Math.min(a + ia, 9)][1].midi] }, melodyB: { pitches: [notesArray[b][0], notesArray[Math.min(b + ib, 9)][0]], midis: [notesArray[b][1].midi, notesArray[Math.min(b + ib, 9)][1].midi] }, correctAnswer: ia > ib ? 'A' : 'B' }
  }
  const n1 = Math.floor((seed * 13 + 7) % 6), n2 = Math.floor((seed * 17 + 3) % 6)
  return { id: `local-${seed}`, type: 'T1', typeName: 'T1音高比较', isNew: true, audioA: { pitch: notesArray[n1][0], midi: notesArray[n1][1].midi }, audioB: { pitch: notesArray[(n1 + 1 + n2) % 6][0], midi: notesArray[(n1 + 1 + n2) % 6][1].midi }, correctAnswer: 'A' }
}

const NOTES: Record<string, { midi: number; name: string; freq: number; solfege: string }> = {
  'C4': { midi: 60, name: 'C4', freq: 261.63, solfege: 'do' },
  'D4': { midi: 62, name: 'D4', freq: 293.66, solfege: 're' },
  'E4': { midi: 64, name: 'E4', freq: 329.63, solfege: 'mi' },
  'F4': { midi: 65, name: 'F4', freq: 349.23, solfege: 'fa' },
  'G4': { midi: 67, name: 'G4', freq: 392.00, solfege: 'so' },
  'A4': { midi: 69, name: 'A4', freq: 440.00, solfege: 'la' },
  'B4': { midi: 71, name: 'B4', freq: 493.88, solfege: 'si' },
  'C5': { midi: 72, name: 'C5', freq: 523.25, solfege: 'do' },
  'D5': { midi: 74, name: 'D5', freq: 587.33, solfege: 're' },
  'E5': { midi: 76, name: 'E5', freq: 659.25, solfege: 'mi' },
}

const SOLFEGE_NOTES = ['do', 're', 'mi', 'fa', 'so', 'la', 'si']

// 题型定义
type QuestionType = 'T1' | 'T2' | 'T3' | 'T4' | 'T5' | 'T6' | 'T7'

interface Question {
  id: string
  type: QuestionType
  typeName: string
  isNew: boolean // 新题 or 来自错题本
  // T1: 双音音高比较
  audioA?: { pitch: string; midi: number }
  audioB?: { pitch: string; midi: number }
  // T2: 三音音高比较
  audioC?: { pitch: string; midi: number }
  // T3: 音程比较 (双旋律)
  melodyA?: { pitches: string[]; midis: number[] }
  melodyB?: { pitches: string[]; midis: number[] }
  // T4: 多音程比较 (四选二)
  melodies?: { id: string; pitches: string[]; midis: number[] }[]
  correctPair?: [string, string]
  // T5: 音程听写
  melody?: { pitches: string[]; midis: number[] }
  options?: string[]
  // T6/T7: 跟唱
  targetPitches?: { pitch: string; midi: number; solfege: string }[]
  // 通用
  correctAnswer?: string
}

// 生成模拟题目
function generateQuestions(moduleId: string, count: number = 20): Question[] {
  const questions: Question[] = []
  const notesArray = Object.entries(NOTES)
  
  for (let i = 0; i < count; i++) {
    let question: Question
    const isNew = Math.random() > 0.3 // 70%新题，30%错题本
    
    if (moduleId === 'pitch-recognition') {
      // 模块1: T1, T2 题型
      if (Math.random() > 0.4) {
        // T1: 双音音高比较
        const noteA = notesArray[Math.floor(Math.random() * 7)]
        let noteB = notesArray[Math.floor(Math.random() * 7)]
        while (noteB[0] === noteA[0]) {
          noteB = notesArray[Math.floor(Math.random() * 7)]
        }
        question = {
          id: `Q${i + 1}`,
          type: 'T1',
          typeName: 'T1音高比较',
          isNew,
          audioA: { pitch: noteA[0], midi: noteA[1].midi },
          audioB: { pitch: noteB[0], midi: noteB[1].midi },
          correctAnswer: noteA[1].midi > noteB[1].midi ? 'A' : 'B',
        }
      } else {
        // T2: 三音音高比较
        const noteA = notesArray[Math.floor(Math.random() * 7)]
        let noteB = notesArray[Math.floor(Math.random() * 7)]
        let noteC = notesArray[Math.floor(Math.random() * 7)]
        while (noteB[0] === noteA[0]) noteB = notesArray[Math.floor(Math.random() * 7)]
        while (noteC[0] === noteA[0] || noteC[0] === noteB[0]) noteC = notesArray[Math.floor(Math.random() * 7)]
        
        const highest = [noteA, noteB, noteC].reduce((a, b) => a[1].midi > b[1].midi ? a : b)
        question = {
          id: `Q${i + 1}`,
          type: 'T2',
          typeName: 'T2三音比较',
          isNew,
          audioA: { pitch: noteA[0], midi: noteA[1].midi },
          audioB: { pitch: noteB[0], midi: noteB[1].midi },
          audioC: { pitch: noteC[0], midi: noteC[1].midi },
          correctAnswer: highest === noteA ? 'A' : highest === noteB ? 'B' : 'C',
        }
      }
    } else if (moduleId === 'interval-dictation') {
      // 模块2: T3, T4, T5 题型
      const rand = Math.random()
      if (rand < 0.33) {
        // T3: 音程比较
        const startA = Math.floor(Math.random() * 5)
        const startB = Math.floor(Math.random() * 5)
        const intervalA = Math.floor(Math.random() * 4) + 2
        const intervalB = Math.floor(Math.random() * 4) + 2
        
        question = {
          id: `Q${i + 1}`,
          type: 'T3',
          typeName: 'T3音程比较',
          isNew,
          melodyA: {
            pitches: [notesArray[startA][0], notesArray[startA + intervalA][0]],
            midis: [notesArray[startA][1].midi, notesArray[startA + intervalA][1].midi],
          },
          melodyB: {
            pitches: [notesArray[startB][0], notesArray[startB + intervalB][0]],
            midis: [notesArray[startB][1].midi, notesArray[startB + intervalB][1].midi],
          },
          correctAnswer: intervalA > intervalB ? 'A' : 'B',
        }
      } else if (rand < 0.66) {
        // T4: 多音程比较 (四选二)
        const intervals = [2, 3, 4, 5]
        const shuffled = intervals.sort(() => Math.random() - 0.5)
        const sameInterval = shuffled[0]
        
        const melodies = ['A', 'B', 'C', 'D'].map((id, idx) => {
          const start = Math.floor(Math.random() * 5)
          const interval = idx < 2 ? sameInterval : shuffled[idx]
          return {
            id,
            pitches: [notesArray[start][0], notesArray[Math.min(start + interval, 9)][0]],
            midis: [notesArray[start][1].midi, notesArray[Math.min(start + interval, 9)][1].midi],
          }
        })
        
        question = {
          id: `Q${i + 1}`,
          type: 'T4',
          typeName: 'T4多音程比较',
          isNew,
          melodies,
          correctPair: ['A', 'B'],
        }
      } else {
        // T5: 音程听写
        const start = Math.floor(Math.random() * 4)
        const length = 3
        const melody = {
          pitches: notesArray.slice(start, start + length).map(n => n[0]),
          midis: notesArray.slice(start, start + length).map(n => n[1].midi),
        }
        const correctSolfege = melody.pitches.map(p => NOTES[p].solfege).join(' ')
        
        // 生成选项
        const options = [correctSolfege]
        while (options.length < 4) {
          const wrongStart = Math.floor(Math.random() * 4)
          const wrongSolfege = notesArray.slice(wrongStart, wrongStart + length).map(n => n[1].solfege).join(' ')
          if (!options.includes(wrongSolfege)) {
            options.push(wrongSolfege)
          }
        }
        
        question = {
          id: `Q${i + 1}`,
          type: 'T5',
          typeName: 'T5音程听写',
          isNew,
          melody,
          options: options.sort(() => Math.random() - 0.5),
          correctAnswer: correctSolfege,
        }
      }
    } else {
      // 模块4: T6, T7 题型
      if (Math.random() > 0.5) {
        // T6: 跟唱单音
        const note = notesArray[Math.floor(Math.random() * 7)]
        question = {
          id: `Q${i + 1}`,
          type: 'T6',
          typeName: 'T6跟唱单音',
          isNew,
          targetPitches: [{ pitch: note[0], midi: note[1].midi, solfege: note[1].solfege }],
        }
      } else {
        // T7: 跟唱短句
        const start = Math.floor(Math.random() * 4)
        const length = 3 + Math.floor(Math.random() * 2) // 3-4个音
        const targets = notesArray.slice(start, start + length).map(n => ({
          pitch: n[0],
          midi: n[1].midi,
          solfege: n[1].solfege,
        }))
        question = {
          id: `Q${i + 1}`,
          type: 'T7',
          typeName: 'T7跟唱短句',
          isNew,
          targetPitches: targets,
        }
      }
    }
    
    questions.push(question)
  }
  
  return questions
}

// ========== 组件 ==========

interface TutorialPracticeProps {
  moduleId: string
  moduleTitle: string
  moduleSubtitle: string
  moduleColor: string
  onComplete: (stars: number, accuracy: number, correctCount?: number, totalCount?: number) => void
  onExit: () => void
  useSessionComplete?: boolean
}

export function TutorialPractice({
  moduleId,
  moduleTitle,
  moduleSubtitle,
  moduleColor,
  onComplete,
  onExit,
  useSessionComplete = false,
}: TutorialPracticeProps) {
  const [phase, setPhase] = useState<'preview' | 'practice' | 'complete'>('preview')
  const [questions, setQuestions] = useState<Question[]>([])
  const [sessionId, setSessionId] = useState<number | null>(null)
  const [backendMode, setBackendMode] = useState(false)
  const [loading, setLoading] = useState(true)

  // 从后端加载题目
  useEffect(() => {
    async function loadQuestions() {
      const moduleType = MODULE_TO_BACKEND[moduleId]
      if (moduleType) {
        try {
          const session = await apiCreateSession(moduleType)
          setSessionId(session.session_id)
          const converted = backendToQuestions(session.questions)
          setQuestions(converted.slice(0, 20))
          setBackendMode(true)
        } catch {
          console.warn('Backend unavailable, using local questions')
          setQuestions(generateQuestions(moduleId, 20))
        }
      } else {
        setQuestions(generateQuestions(moduleId, 20))
      }
      setLoading(false)
    }
    loadQuestions()
  }, [moduleId])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [results, setResults] = useState<{ correct: boolean; accuracy: number }[]>([])
  // Keep ref in sync so callbacks always have latest results
  const resultsRef = useRef(results)
  useEffect(() => { resultsRef.current = results }, [results])
  const [hearts, setHearts] = useState(5) // 5颗心
  const [combo, setCombo] = useState(0)
  const [startTime] = useState(Date.now())
  const [showFailed, setShowFailed] = useState(false)
  
  const currentQuestion = questions[currentIndex]

  // 答题结果处理
  const handleAnswer = useCallback((correct: boolean, accuracy: number = correct ? 100 : 0) => {
    setResults(prev => [...prev, { correct, accuracy }])

    // 提交答案到后端
    if (backendMode && sessionId && questions[currentIndex]) {
      const q = questions[currentIndex]
      apiSubmitAnswer(sessionId, parseInt(q.id.replace('B', '')), q.correctAnswer || '').catch(() => {})
    }

    if (correct) {
      setCombo(prev => prev + 1)
    } else {
      setCombo(0)
      setHearts(prev => {
        const newHearts = prev - 1
        if (newHearts <= 0) {
          setShowFailed(true)
        }
        return newHearts
      })
    }
  }, [backendMode, sessionId, questions, currentIndex])

  // 下一题
  const nextQuestion = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1)
    } else {
      // 完成后端 session
      if (backendMode && sessionId) {
        apiCompleteSession(sessionId).catch(() => {})
      }
      if (useSessionComplete) {
        // 直接回调，由父组件显示结算页
        const finalResults = resultsRef.current
        const correctCount = finalResults.filter(r => r.correct).length
        const accuracy = finalResults.length > 0
          ? Math.round(finalResults.reduce((sum, r) => sum + r.accuracy, 0) / finalResults.length)
          : 0
        onComplete(0, accuracy, correctCount, questions.length)
      } else {
        setPhase('complete')
      }
    }
  }, [currentIndex, questions.length, backendMode, sessionId, useSessionComplete, onComplete])

  // 计算最终结果
  const totalCorrect = results.filter(r => r.correct).length
  const totalAccuracy = results.length > 0 
    ? Math.round(results.reduce((sum, r) => sum + r.accuracy, 0) / results.length) 
    : 0
  const duration = Math.round((Date.now() - startTime) / 1000)

  // 加载中
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

  // 抽题预览页
  if (phase === 'preview') {
    return (
      <div className="flex flex-col h-full bg-background">
        {/* 顶部 */}
        <div className="px-4 pt-6 pb-4 border-b border-border/50">
          <div className="flex items-center gap-3 mb-2">
            <button onClick={onExit} className="p-2 -ml-2">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold">{moduleTitle}</h1>
              <p className="text-sm text-muted-foreground">今日训练 · 共{questions.length}题{backendMode ? ' · 智能组卷' : ''}</p>
            </div>
          </div>
        </div>

        {/* 题目列表 */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="space-y-2">
            {questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => { setCurrentIndex(idx); setPhase('practice') }}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 hover:border-muted-foreground/30 transition-all text-left"
              >
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-medium"
                  style={{ backgroundColor: `${moduleColor}20`, color: moduleColor }}
                >
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm">
                    第{idx + 1}题 · {q.typeName}
                  </span>
                </div>
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full",
                  q.isNew 
                    ? "bg-green-100 text-green-700" 
                    : "bg-orange-100 text-orange-700"
                )}>
                  {q.isNew ? '新题' : '错题本'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="p-4 border-t border-border/50">
          <Button 
            className="w-full" 
            size="lg"
            onClick={() => setPhase('practice')}
            style={{ backgroundColor: moduleColor }}
          >
            开始训练
          </Button>
        </div>
      </div>
    )
  }

  // 完成页
  if (phase === 'complete') {
    const stars = totalAccuracy >= 90 ? 3 : totalAccuracy >= 70 ? 2 : totalAccuracy >= 50 ? 1 : 0
    
    return (
      <div className="flex flex-col h-full bg-background">
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <h1 className="text-2xl font-bold mb-4">训练完成!</h1>
          
          {/* 星星 */}
          <div className="flex gap-2 mb-6">
            {[1, 2, 3].map((s) => (
              <Star 
                key={s}
                className={cn(
                  "w-10 h-10 transition-all",
                  s <= stars 
                    ? "text-yellow-400 fill-yellow-400 scale-110" 
                    : "text-muted-foreground/30"
                )}
              />
            ))}
          </div>

          {/* 数据 */}
          <div className="w-full max-w-xs space-y-3 mb-8">
            <div className="flex justify-between p-3 rounded-xl bg-card">
              <span className="text-muted-foreground">正确率</span>
              <span className="font-semibold">{totalAccuracy}%</span>
            </div>
            <div className="flex justify-between p-3 rounded-xl bg-card">
              <span className="text-muted-foreground">正确题数</span>
              <span className="font-semibold">{totalCorrect}/{questions.length}</span>
            </div>
            <div className="flex justify-between p-3 rounded-xl bg-card">
              <span className="text-muted-foreground">用时</span>
              <span className="font-semibold">{Math.floor(duration / 60)}分{duration % 60}秒</span>
            </div>
            <div className="flex justify-between p-3 rounded-xl bg-card">
              <span className="text-muted-foreground">掌握度</span>
              <span className="font-semibold text-green-600">65% → 72%</span>
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="p-4 space-y-3">
          <Button
            className="w-full"
            size="lg"
            onClick={() => onComplete(stars, totalAccuracy, totalCorrect, questions.length)}
            style={{ backgroundColor: moduleColor }}
          >
            返回教程主页
          </Button>
          <Button 
            variant="outline"
            className="w-full" 
            size="lg"
            onClick={() => {
              setPhase('preview')
              setCurrentIndex(0)
              setResults([])
              setHearts(5)
              setCombo(0)
            }}
          >
            再来一轮
          </Button>
        </div>
      </div>
    )
  }

  // 失败弹窗
  if (showFailed) {
    return (
      <div className="flex flex-col h-full bg-background items-center justify-center px-6">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <X className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2">闯关失败</h1>
          <p className="text-muted-foreground mb-8">心用完了，下次加油!</p>
          
          <div className="space-y-3 w-full max-w-xs">
            <Button 
              className="w-full" 
              size="lg"
              onClick={() => {
                setShowFailed(false)
                setPhase('preview')
                setCurrentIndex(0)
                setResults([])
                setHearts(5)
                setCombo(0)
                setScore(0)
              }}
            >
              重新开始
            </Button>
            <Button 
              variant="outline"
              className="w-full" 
              size="lg"
              onClick={onExit}
            >
              返回
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // 答题页
  return (
    <div className="flex flex-col h-full bg-background pb-24">
      {/* 顶部状态栏 */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <button onClick={onExit} className="p-2 -ml-2">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium">{currentQuestion.typeName}</span>
          <span className="text-sm font-medium">{currentIndex + 1}/{questions.length}</span>
        </div>
        
        <Progress value={(currentIndex / questions.length) * 100} className="h-2 mb-2" />
        
        {/* 心和连击 */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Heart 
                key={i}
                className={cn(
                  "w-5 h-5",
                  i < hearts 
                    ? "text-red-500 fill-red-500" 
                    : "text-muted-foreground/30"
                )}
              />
            ))}
          </div>
          {combo > 0 && (
            <span className="text-sm font-medium text-orange-500">
              Combo x{combo}
            </span>
          )}
        </div>
      </div>

      {/* 题目内容 */}
      <div className="flex-1 overflow-hidden">
        {(currentQuestion.type === 'T1' || currentQuestion.type === 'T2') && (
          <PitchCompareQuestion
            key={currentQuestion.id}
            question={currentQuestion}
            moduleColor={moduleColor}
            onAnswer={handleAnswer}
            onNext={nextQuestion}
          />
        )}
        {currentQuestion.type === 'T3' && (
          <IntervalCompareQuestion
            key={currentQuestion.id}
            question={currentQuestion}
            moduleColor={moduleColor}
            onAnswer={handleAnswer}
            onNext={nextQuestion}
          />
        )}
        {currentQuestion.type === 'T4' && (
          <MultiIntervalQuestion
            key={currentQuestion.id}
            question={currentQuestion}
            moduleColor={moduleColor}
            onAnswer={handleAnswer}
            onNext={nextQuestion}
          />
        )}
        {currentQuestion.type === 'T5' && (
          <IntervalDictationQuestion
            key={currentQuestion.id}
            question={currentQuestion}
            moduleColor={moduleColor}
            onAnswer={handleAnswer}
            onNext={nextQuestion}
          />
        )}
        {(currentQuestion.type === 'T6' || currentQuestion.type === 'T7') && (
          <SingAlongQuestion
            key={currentQuestion.id}
            question={currentQuestion}
            moduleColor={moduleColor}
            onAnswer={handleAnswer}
            onNext={nextQuestion}
          />
        )}
      </div>
    </div>
  )
}

// ========== T1/T2 音高比较题 ==========
function PitchCompareQuestion({ 
  question, 
  moduleColor, 
  onAnswer, 
  onNext 
}: { 
  question: Question
  moduleColor: string
  onAnswer: (correct: boolean) => void
  onNext: () => void
}) {
  const [selected, setSelected] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [playedA, setPlayedA] = useState(false)
  const [playedB, setPlayedB] = useState(false)
  const [playedC, setPlayedC] = useState(false)
  const audioContextRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    audioContextRef.current = new AudioContext()
    return () => { audioContextRef.current?.close() }
  }, [])

  const playNote = (midi: number) => {
    const ctx = audioContextRef.current
    if (!ctx) return
    if (ctx.state === 'suspended') ctx.resume()
    const freq = 440 * Math.pow(2, (midi - 69) / 12)
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    osc.connect(gain)
    gain.connect(ctx.destination)
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.8)
  }

  const isThreeNote = question.type === 'T2'
  const canSubmit = selected !== null

  const handleSubmit = () => {
    if (!canSubmit || submitted) return
    setSubmitted(true)
    const isCorrect = selected === question.correctAnswer
    onAnswer(isCorrect)
    setTimeout(onNext, 800)
  }

  const getButtonStyle = (id: string) => {
    if (!submitted) {
      return selected === id 
        ? { borderColor: moduleColor, backgroundColor: `${moduleColor}30` }
        : { borderColor: '#e5e5e5' }
    }
    if (id === question.correctAnswer) {
      return { borderColor: '#22c55e', backgroundColor: '#dcfce7' }
    }
    if (selected === id && id !== question.correctAnswer) {
      return { borderColor: '#ef4444', backgroundColor: '#fee2e2' }
    }
    return { borderColor: '#e5e5e5' }
  }

  return (
    <div className="flex flex-col h-full px-4 py-6">
      <h2 className="text-lg font-semibold text-center mb-2">
        听{isThreeNote ? ' A、B、C ' : ' A 和 B '}，哪个音更高？
      </h2>
      <p className="text-sm text-muted-foreground text-center mb-6">
        点击播放按钮听音，选择最高的音
      </p>

      {/* 播放按钮 */}
      <div className={cn("flex justify-center gap-4 mb-8", isThreeNote && "gap-3")}>
        {/* A */}
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={() => {
              if (question.audioA) {
                playNote(question.audioA.midi)
                setPlayedA(true)
              }
            }}
            className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center transition-all",
              playedA ? "bg-green-100" : "bg-muted"
            )}
            style={{ borderWidth: 2, borderColor: playedA ? '#22c55e' : '#e5e5e5' }}
          >
            <Play className={cn("w-7 h-7", playedA ? "text-green-600" : "text-muted-foreground")} />
          </button>
          <span className="text-lg font-semibold">A</span>
          <button
            onClick={() => setSelected('A')}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full border-2 transition-all text-sm",
              selected === 'A' && !submitted && "font-medium"
            )}
            style={getButtonStyle('A')}
            disabled={submitted}
          >
            <div className={cn(
              "w-4 h-4 rounded-full border-2",
              selected === 'A' ? "border-current bg-current" : "border-muted-foreground"
            )} />
            更高
          </button>
        </div>

        {/* B */}
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={() => {
              if (question.audioB) {
                playNote(question.audioB.midi)
                setPlayedB(true)
              }
            }}
            className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center transition-all",
              playedB ? "bg-green-100" : "bg-muted"
            )}
            style={{ borderWidth: 2, borderColor: playedB ? '#22c55e' : '#e5e5e5' }}
          >
            <Play className={cn("w-7 h-7", playedB ? "text-green-600" : "text-muted-foreground")} />
          </button>
          <span className="text-lg font-semibold">B</span>
          <button
            onClick={() => setSelected('B')}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full border-2 transition-all text-sm",
              selected === 'B' && !submitted && "font-medium"
            )}
            style={getButtonStyle('B')}
            disabled={submitted}
          >
            <div className={cn(
              "w-4 h-4 rounded-full border-2",
              selected === 'B' ? "border-current bg-current" : "border-muted-foreground"
            )} />
            更高
          </button>
        </div>

        {/* C (T2 only) */}
        {isThreeNote && (
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => {
                if (question.audioC) {
                  playNote(question.audioC.midi)
                  setPlayedC(true)
                }
              }}
              className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center transition-all",
                playedC ? "bg-green-100" : "bg-muted"
              )}
              style={{ borderWidth: 2, borderColor: playedC ? '#22c55e' : '#e5e5e5' }}
            >
              <Play className={cn("w-7 h-7", playedC ? "text-green-600" : "text-muted-foreground")} />
            </button>
            <span className="text-lg font-semibold">C</span>
            <button
              onClick={() => setSelected('C')}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full border-2 transition-all text-sm",
                selected === 'C' && !submitted && "font-medium"
              )}
              style={getButtonStyle('C')}
              disabled={submitted}
            >
              <div className={cn(
                "w-4 h-4 rounded-full border-2",
                selected === 'C' ? "border-current bg-current" : "border-muted-foreground"
              )} />
              更高
            </button>
          </div>
        )}
      </div>

      {/* 音名标注（回答后显示） */}
      {submitted && (
        <div className="flex justify-center gap-4 mb-4">
          <div className="text-center">
            <p className="text-sm font-bold" style={{ color: moduleColor }}>
              {question.audioA?.pitch || 'A'}
            </p>
            <p className="text-xs text-muted-foreground">
              {question.audioA?.midi ? midiInfo(question.audioA.midi).solfege : ''}
            </p>
          </div>
          {question.audioB && (
            <div className="text-center">
              <p className="text-sm font-bold" style={{ color: moduleColor }}>
                {question.audioB.pitch}
              </p>
              <p className="text-xs text-muted-foreground">
                {midiInfo(question.audioB.midi).solfege}
              </p>
            </div>
          )}
          {isThreeNote && question.audioC && (
            <div className="text-center">
              <p className="text-sm font-bold" style={{ color: moduleColor }}>
                {question.audioC.pitch}
              </p>
              <p className="text-xs text-muted-foreground">
                {midiInfo(question.audioC.midi).solfege}
              </p>
            </div>
          )}
        </div>
      )}

      {/* 提交按钮 */}
      <div className="mt-auto">
        <Button
          className="w-full"
          size="lg"
          onClick={handleSubmit}
          disabled={!canSubmit || submitted}
          style={{ backgroundColor: canSubmit && !submitted ? moduleColor : undefined }}
        >
          {submitted ? '下一题' : '提交'}
        </Button>
      </div>
    </div>
  )
}

// ========== T3 音程比较题 ==========
function IntervalCompareQuestion({ 
  question, 
  moduleColor, 
  onAnswer, 
  onNext 
}: { 
  question: Question
  moduleColor: string
  onAnswer: (correct: boolean) => void
  onNext: () => void
}) {
  const [selected, setSelected] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [playedA, setPlayedA] = useState(false)
  const [playedB, setPlayedB] = useState(false)
  const audioContextRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    audioContextRef.current = new AudioContext()
    return () => { audioContextRef.current?.close() }
  }, [])

  const playMelody = async (midis: number[], slow: boolean = false) => {
    const ctx = audioContextRef.current
    if (!ctx) return
    if (ctx.state === 'suspended') ctx.resume()
    const delay = slow ? 800 : 400
    for (const midi of midis) {
      const freq = 440 * Math.pow(2, (midi - 69) / 12)
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      osc.connect(gain)
      gain.connect(ctx.destination)
      gain.gain.setValueAtTime(0, ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + (delay - 50) / 1000)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + delay / 1000)
      await new Promise(r => setTimeout(r, delay))
    }
  }

  const canSubmit = selected !== null

  const handleSubmit = () => {
    if (!canSubmit || submitted) return
    setSubmitted(true)
    onAnswer(selected === question.correctAnswer)
    setTimeout(onNext, 800)
  }

  return (
    <div className="flex flex-col h-full px-4 py-6">
      <h2 className="text-lg font-semibold text-center mb-2">
        哪组音的距离更远？
      </h2>
      <p className="text-sm text-muted-foreground text-center mb-6">
        听两组旋律，选择音程更大的一组
      </p>

      <div className="flex justify-center gap-6 mb-8">
        {/* Melody A */}
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={() => {
              if (question.melodyA) {
                playMelody(question.melodyA.midis)
                setPlayedA(true)
              }
            }}
            className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center",
              playedA ? "bg-green-100 border-green-500" : "bg-muted border-muted-foreground/30"
            )}
            style={{ borderWidth: 2 }}
          >
            <Play className={cn("w-7 h-7", playedA ? "text-green-600" : "text-muted-foreground")} />
          </button>
          <button
            onClick={() => {
              if (question.melodyA) {
                playMelody(question.melodyA.midis, true)
                setPlayedA(true)
              }
            }}
            className="text-xs text-muted-foreground underline"
          >
            慢速
          </button>
          <span className="text-lg font-semibold">A</span>
          <button
            onClick={() => setSelected('A')}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full border-2 transition-all text-sm"
            )}
            style={{
              borderColor: submitted 
                ? (question.correctAnswer === 'A' ? '#22c55e' : selected === 'A' ? '#ef4444' : '#e5e5e5')
                : selected === 'A' ? moduleColor : '#e5e5e5',
              backgroundColor: submitted
                ? (question.correctAnswer === 'A' ? '#dcfce7' : selected === 'A' ? '#fee2e2' : 'transparent')
                : selected === 'A' ? `${moduleColor}20` : 'transparent'
            }}
            disabled={submitted}
          >
            <div className={cn(
              "w-4 h-4 rounded-full border-2",
              selected === 'A' ? "border-current bg-current" : "border-muted-foreground"
            )} />
            更远
          </button>
        </div>

        {/* Melody B */}
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={() => {
              if (question.melodyB) {
                playMelody(question.melodyB.midis)
                setPlayedB(true)
              }
            }}
            className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center",
              playedB ? "bg-green-100 border-green-500" : "bg-muted border-muted-foreground/30"
            )}
            style={{ borderWidth: 2 }}
          >
            <Play className={cn("w-7 h-7", playedB ? "text-green-600" : "text-muted-foreground")} />
          </button>
          <button
            onClick={() => {
              if (question.melodyB) {
                playMelody(question.melodyB.midis, true)
                setPlayedB(true)
              }
            }}
            className="text-xs text-muted-foreground underline"
          >
            慢速
          </button>
          <span className="text-lg font-semibold">B</span>
          <button
            onClick={() => setSelected('B')}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full border-2 transition-all text-sm"
            )}
            style={{
              borderColor: submitted
                ? (question.correctAnswer === 'B' ? '#22c55e' : selected === 'B' ? '#ef4444' : '#e5e5e5')
                : selected === 'B' ? moduleColor : '#e5e5e5',
              backgroundColor: submitted
                ? (question.correctAnswer === 'B' ? '#dcfce7' : selected === 'B' ? '#fee2e2' : 'transparent')
                : selected === 'B' ? `${moduleColor}20` : 'transparent'
            }}
            disabled={submitted}
          >
            <div className={cn(
              "w-4 h-4 rounded-full border-2",
              selected === 'B' ? "border-current bg-current" : "border-muted-foreground"
            )} />
            更远
          </button>
        </div>
      </div>

      {/* 音名标注（回答后显示） */}
      {submitted && (
        <div className="flex justify-center gap-6 mb-2">
          <div className="text-center">
            <p className="text-xs font-bold" style={{ color: moduleColor }}>{question.melodyA?.pitches.join(' · ') || 'A'}</p>
            <p className="text-[10px] text-muted-foreground">{question.melodyA?.midis.map(m => midiInfo(m).solfege).join(' · ') || ''}</p>
          </div>
          {question.melodyB && (
            <div className="text-center">
              <p className="text-xs font-bold" style={{ color: moduleColor }}>{question.melodyB.pitches.join(' · ')}</p>
              <p className="text-[10px] text-muted-foreground">{question.melodyB.midis.map(m => midiInfo(m).solfege).join(' · ')}</p>
            </div>
          )}
        </div>
      )}

      <div className="mt-auto">
        <Button
          className="w-full"
          size="lg"
          onClick={handleSubmit}
          disabled={!canSubmit || submitted}
          style={{ backgroundColor: canSubmit && !submitted ? moduleColor : undefined }}
        >
          {submitted ? '下一题' : '提交'}
        </Button>
      </div>
    </div>
  )
}

// ========== T4 多音程比较题 ==========
function MultiIntervalQuestion({ 
  question, 
  moduleColor, 
  onAnswer, 
  onNext 
}: { 
  question: Question
  moduleColor: string
  onAnswer: (correct: boolean) => void
  onNext: () => void
}) {
  const [selected, setSelected] = useState<string[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [played, setPlayed] = useState<Record<string, boolean>>({})
  const audioContextRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    audioContextRef.current = new AudioContext()
    return () => { audioContextRef.current?.close() }
  }, [])

  const playMelody = async (midis: number[], slow: boolean = false) => {
    const ctx = audioContextRef.current
    if (!ctx) return
    if (ctx.state === 'suspended') ctx.resume()
    const delay = slow ? 800 : 400
    for (const midi of midis) {
      const freq = 440 * Math.pow(2, (midi - 69) / 12)
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      osc.connect(gain)
      gain.connect(ctx.destination)
      gain.gain.setValueAtTime(0, ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + (delay - 50) / 1000)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + delay / 1000)
      await new Promise(r => setTimeout(r, delay))
    }
  }

  const toggleSelect = (id: string) => {
    if (submitted) return
    if (selected.includes(id)) {
      setSelected(prev => prev.filter(s => s !== id))
    } else if (selected.length < 2) {
      setSelected(prev => [...prev, id])
    }
  }

  const canSubmit = selected.length === 2

  const handleSubmit = () => {
    if (!canSubmit || submitted) return
    setSubmitted(true)
    const correct = question.correctPair && 
      selected.sort().join(',') === question.correctPair.sort().join(',')
    onAnswer(correct || false)
    setTimeout(onNext, 800)
  }

  return (
    <div className="flex flex-col h-full px-4 py-6">
      <h2 className="text-lg font-semibold text-center mb-2">
        选择两组音程距离一样的旋律
      </h2>
      <p className="text-sm text-muted-foreground text-center mb-4">
        双选
      </p>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {question.melodies?.map((melody) => {
          const isSelected = selected.includes(melody.id)
          const isCorrect = question.correctPair?.includes(melody.id)
          
          return (
            <div 
              key={melody.id}
              className={cn(
                "p-4 rounded-xl border-2 transition-all",
                submitted 
                  ? isCorrect 
                    ? "border-green-500 bg-green-50" 
                    : isSelected 
                      ? "border-red-500 bg-red-50" 
                      : "border-muted"
                  : isSelected 
                    ? "border-2" 
                    : "border-muted"
              )}
              style={!submitted && isSelected ? { borderColor: moduleColor, backgroundColor: `${moduleColor}10` } : {}}
            >
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={() => {
                    playMelody(melody.midis)
                    setPlayed(prev => ({ ...prev, [melody.id]: true }))
                  }}
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center",
                    played[melody.id] ? "bg-green-100" : "bg-muted"
                  )}
                >
                  <Play className={cn("w-6 h-6", played[melody.id] ? "text-green-600" : "text-muted-foreground")} />
                </button>
                <button
                  onClick={() => {
                    playMelody(melody.midis, true)
                    setPlayed(prev => ({ ...prev, [melody.id]: true }))
                  }}
                  className="text-xs text-muted-foreground"
                >
                  慢速
                </button>
                <span className="font-semibold">{melody.id}</span>
                <button
                  onClick={() => toggleSelect(melody.id)}
                  className={cn(
                    "w-6 h-6 rounded-full border-2 flex items-center justify-center",
                    isSelected && "bg-current"
                  )}
                  style={{ borderColor: isSelected ? moduleColor : '#d4d4d4' }}
                  disabled={submitted}
                >
                  {isSelected && <Check className="w-4 h-4 text-white" />}
                </button>
                {submitted && (
                  <div className="text-center mt-1">
                    <p className="text-[10px] font-medium" style={{ color: moduleColor }}>{melody.pitches.join('·')}</p>
                    <p className="text-[9px] text-muted-foreground">{melody.midis.map(m => midiInfo(m).solfege).join('·')}</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-auto">
        <Button 
          className="w-full" 
          size="lg"
          onClick={handleSubmit}
          disabled={!canSubmit || submitted}
          style={{ backgroundColor: canSubmit && !submitted ? moduleColor : undefined }}
        >
          {submitted ? '下一题' : '提交'}
        </Button>
      </div>
    </div>
  )
}

// ========== T5 音程听写题 ==========
function IntervalDictationQuestion({ 
  question, 
  moduleColor, 
  onAnswer, 
  onNext 
}: { 
  question: Question
  moduleColor: string
  onAnswer: (correct: boolean) => void
  onNext: () => void
}) {
  const [selected, setSelected] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const audioContextRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    audioContextRef.current = new AudioContext()
    return () => { audioContextRef.current?.close() }
  }, [])

  const playNote = (midi: number) => {
    const ctx = audioContextRef.current
    if (!ctx) return
    if (ctx.state === 'suspended') ctx.resume()
    const freq = 440 * Math.pow(2, (midi - 69) / 12)
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    osc.connect(gain)
    gain.connect(ctx.destination)
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.8)
  }

  const playMelody = async (midis: number[], slow: boolean = false) => {
    const ctx = audioContextRef.current
    if (!ctx) return
    if (ctx.state === 'suspended') ctx.resume()
    const delay = slow ? 800 : 400
    for (const midi of midis) {
      const freq = 440 * Math.pow(2, (midi - 69) / 12)
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      osc.connect(gain)
      gain.connect(ctx.destination)
      gain.gain.setValueAtTime(0, ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + (delay - 50) / 1000)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + delay / 1000)
      await new Promise(r => setTimeout(r, delay))
    }
  }

  const handleSubmit = () => {
    if (!selected || submitted) return
    setSubmitted(true)
    onAnswer(selected === question.correctAnswer)
    setTimeout(onNext, 800)
  }

  // 参考音按键
  const refNotes = [
    { solfege: 'do', midi: 60 },
    { solfege: 're', midi: 62 },
    { solfege: 'mi', midi: 64 },
    { solfege: 'fa', midi: 65 },
    { solfege: 'so', midi: 67 },
    { solfege: 'la', midi: 69 },
    { solfege: 'si', midi: 71 },
  ]

  return (
    <div className="flex flex-col h-full px-4 py-6">
      <h2 className="text-lg font-semibold text-center mb-2">
        听旋律，选择正确的唱名
      </h2>

      {/* 参考音区 */}
      <div className="flex justify-center gap-2 mb-4 py-2 px-3 bg-muted/50 rounded-xl">
        {refNotes.map((note) => (
          <button
            key={note.solfege}
            onClick={() => playNote(note.midi)}
            className="px-2 py-1 text-xs rounded bg-card hover:bg-muted transition-colors"
          >
            {note.solfege}
          </button>
        ))}
      </div>

      {/* 播放区 */}
      <div className="flex justify-center gap-4 mb-6">
        <button
          onClick={() => question.melody && playMelody(question.melody.midis)}
          className="w-16 h-16 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
          style={{ borderWidth: 2, borderColor: moduleColor }}
        >
          <Play className="w-7 h-7" style={{ color: moduleColor }} />
        </button>
        <button
          onClick={() => question.melody && playMelody(question.melody.midis, true)}
          className="w-12 h-12 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors self-end"
        >
          <span className="text-xs">慢速</span>
        </button>
      </div>

      {/* 选项区 */}
      <div className="space-y-3 mb-6">
        {question.options?.map((opt) => {
          const isCorrect = opt === question.correctAnswer
          const isSelected = selected === opt
          
          return (
            <button
              key={opt}
              onClick={() => !submitted && setSelected(opt)}
              className={cn(
                "w-full p-4 rounded-xl border-2 text-left transition-all",
                submitted 
                  ? isCorrect 
                    ? "border-green-500 bg-green-50" 
                    : isSelected 
                      ? "border-red-500 bg-red-50" 
                      : "border-muted"
                  : isSelected 
                    ? "" 
                    : "border-muted hover:border-muted-foreground"
              )}
              style={!submitted && isSelected ? { borderColor: moduleColor, backgroundColor: `${moduleColor}10` } : {}}
              disabled={submitted}
            >
              <span className="font-medium">{opt}</span>
            </button>
          )
        })}
      </div>

      <div className="mt-auto">
        <Button 
          className="w-full" 
          size="lg"
          onClick={handleSubmit}
          disabled={!selected || submitted}
          style={{ backgroundColor: selected && !submitted ? moduleColor : undefined }}
        >
          {submitted ? '下一题' : '提交'}
        </Button>
      </div>
    </div>
  )
}

// ========== T6/T7 跟唱题 ==========
function SingAlongQuestion({ 
  question, 
  moduleColor, 
  onAnswer, 
  onNext 
}: { 
  question: Question
  moduleColor: string
  onAnswer: (correct: boolean, accuracy: number) => void
  onNext: () => void
}) {
  const [isRecording, setIsRecording] = useState(false)
  const [hasRecorded, setHasRecorded] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [pitchFeedback, setPitchFeedback] = useState<'low' | 'accurate' | 'high' | null>(null)
  const [accuracy, setAccuracy] = useState(0)
  const [micPermissionDenied, setMicPermissionDenied] = useState(false)
  const audioContextRef = useRef<AudioContext | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    audioContextRef.current = new AudioContext()
    return () => { 
      audioContextRef.current?.close()
      mediaStreamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  const playMelody = async (slow: boolean = false) => {
    const ctx = audioContextRef.current
    if (!ctx || !question.targetPitches) return
    if (ctx.state === 'suspended') ctx.resume()
    const delay = slow ? 800 : 400
    for (const note of question.targetPitches) {
      const freq = 440 * Math.pow(2, (note.midi - 69) / 12)
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      osc.connect(gain)
      gain.connect(ctx.destination)
      gain.gain.setValueAtTime(0, ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + (delay - 50) / 1000)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + delay / 1000)
      await new Promise(r => setTimeout(r, delay))
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream
      setIsRecording(true)
      
      // 模拟录音和音准检测
      setTimeout(() => {
        stopRecording()
      }, question.type === 'T6' ? 2000 : 4000)
    } catch (err) {
      setMicPermissionDenied(true)
    }
  }

  const stopRecording = () => {
    setIsRecording(false)
    mediaStreamRef.current?.getTracks().forEach(t => t.stop())
    setHasRecorded(true)
    
    // 模拟音准反馈
    const rand = Math.random()
    if (rand < 0.3) {
      setPitchFeedback('low')
      setAccuracy(60 + Math.random() * 20)
    } else if (rand < 0.7) {
      setPitchFeedback('accurate')
      setAccuracy(85 + Math.random() * 15)
    } else {
      setPitchFeedback('high')
      setAccuracy(65 + Math.random() * 20)
    }
  }

  const handleSubmit = () => {
    if (!hasRecorded || submitted) return
    setSubmitted(true)
    onAnswer(accuracy >= 70, accuracy)
    setTimeout(onNext, 800)
  }

  const retry = () => {
    setHasRecorded(false)
    setPitchFeedback(null)
    setAccuracy(0)
  }

  const isSingleNote = question.type === 'T6'

  return (
    <div className="flex flex-col h-full px-4 py-6">
      <h2 className="text-lg font-semibold text-center mb-2">
        {isSingleNote ? '跟唱单音' : '跟唱短句'}
      </h2>
      <p className="text-sm text-muted-foreground text-center mb-4">
        {isSingleNote 
          ? '听标准音后，按住麦克风跟唱'
          : `请跟唱：${question.targetPitches?.map(p => p.solfege).join(' ')}`
        }
      </p>

      {/* 目标旋律图示 (T7) */}
      {!isSingleNote && question.targetPitches && (
        <div className="flex justify-center gap-2 mb-4">
          {question.targetPitches.map((note, i) => {
            const heightOffset = (note.midi - 60) * 4
            return (
              <div 
                key={i}
                className="flex flex-col items-center gap-1"
              >
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium"
                  style={{ 
                    backgroundColor: moduleColor,
                    marginTop: `${Math.max(0, 40 - heightOffset)}px`,
                  }}
                >
                  {note.solfege}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 播放区 */}
      <div className="flex justify-center gap-4 mb-6">
        <button
          onClick={() => playMelody()}
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${moduleColor}20`, borderWidth: 2, borderColor: moduleColor }}
        >
          <Play className="w-7 h-7" style={{ color: moduleColor }} />
        </button>
        <button
          onClick={() => playMelody(true)}
          className="w-12 h-12 rounded-full bg-muted flex items-center justify-center self-end"
        >
          <span className="text-xs">慢速</span>
        </button>
      </div>

      {/* 麦克风权限被拒提示 */}
      {micPermissionDenied && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-orange-50 border border-orange-200 text-center">
          <p className="text-sm font-medium text-orange-700 mb-1">麦克风权限被拒绝</p>
          <p className="text-xs text-orange-600 leading-relaxed">
            请在系统设置中开启麦克风权限，否则无法进行跟唱练习。
          </p>
        </div>
      )}

      {/* 录音按钮 */}
      <div className="flex justify-center mb-4">
        <button
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onTouchStart={startRecording}
          onTouchEnd={stopRecording}
          className={cn(
            "w-20 h-20 rounded-full flex items-center justify-center transition-all",
            isRecording 
              ? "bg-red-500 scale-110" 
              : "bg-muted hover:bg-muted/80"
          )}
          style={{ borderWidth: 3, borderColor: isRecording ? '#ef4444' : moduleColor }}
          disabled={submitted}
        >
          <Mic className={cn("w-8 h-8", isRecording ? "text-white" : "text-muted-foreground")} />
        </button>
      </div>
      <p className="text-xs text-muted-foreground text-center mb-4">
        按住录音，松开停止
      </p>

      {/* 音准反馈 */}
      {hasRecorded && pitchFeedback && (
        <div className="mb-4">
          <div className="h-3 bg-muted rounded-full relative overflow-hidden">
            <div className="absolute left-1/2 w-1 h-full bg-green-500 -translate-x-1/2" />
            <div 
              className={cn(
                "absolute w-4 h-4 rounded-full -top-0.5 transform -translate-x-1/2",
                pitchFeedback === 'accurate' ? "bg-green-500" : "bg-orange-500"
              )}
              style={{
                left: pitchFeedback === 'low' ? '30%' : pitchFeedback === 'high' ? '70%' : '50%'
              }}
            />
          </div>
          <p className={cn(
            "text-center text-sm mt-2 font-medium",
            pitchFeedback === 'accurate' ? "text-green-600" : "text-orange-500"
          )}>
            {pitchFeedback === 'low' && '偏低'}
            {pitchFeedback === 'accurate' && '准确'}
            {pitchFeedback === 'high' && '偏高'}
            {' - '}准确率 {accuracy.toFixed(0)}%
          </p>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="mt-auto flex gap-3">
        {hasRecorded && !submitted && (
          <Button 
            variant="outline"
            className="flex-1" 
            size="lg"
            onClick={retry}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            重新唱
          </Button>
        )}
        <Button 
          className="flex-1" 
          size="lg"
          onClick={handleSubmit}
          disabled={!hasRecorded || submitted}
          style={{ backgroundColor: hasRecorded && !submitted ? moduleColor : undefined }}
        >
          {submitted ? '下一题' : '提交'}
        </Button>
      </div>
    </div>
  )
}
