"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, Mic, Music, Sparkles, ArrowRight, RotateCcw, Volume2, Download, Share2, Link as LinkIcon, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { PERSONALITIES, QUESTIONS, calculateSingTI, type Personality } from "./data"
import { CharacterAvatar } from "./character-avatar"

type Step = "intro" | "recording" | "questions" | "result" | "error"

const TOTAL_QUESTIONS = 16

interface SingTITestProps {
  onComplete: (personality: Personality) => void
  onBack: () => void
}

export function SingTITest({ onComplete, onBack }: SingTITestProps) {
  const [step, setStep] = useState<Step>("intro")
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<number, "A" | "B">>({})
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDone, setRecordingDone] = useState(false)
  const [voiceIsLoud, setVoiceIsLoud] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [result, setResult] = useState<Personality | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  // Recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const volumeHistoryRef = useRef<number[]>([])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  // ===== Recording =====
  const startRecording = async () => {
    try {
      setErrorMsg("")
      setIsRecording(true)
      volumeHistoryRef.current = []

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Set up audio analysis
      const ctx = new AudioContext()
      audioContextRef.current = ctx
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      analyserRef.current = analyser

      // Record volume levels
      const dataArray = new Uint8Array(analyser.frequencyBinCount)
      const collectVolume = () => {
        if (!isRecording) return
        analyser.getByteTimeDomainData(dataArray)
        let sum = 0
        for (let i = 0; i < dataArray.length; i++) {
          const value = (dataArray[i] - 128) / 128
          sum += value * value
        }
        const rms = Math.sqrt(sum / dataArray.length)
        volumeHistoryRef.current.push(rms)
      }

      const volInterval = setInterval(collectVolume, 100)

      // MediaRecorder for actual recording
      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = () => {
        // We don't need the audio data, just the analysis
      }

      recorder.onstop = () => {
        clearInterval(volInterval)
        // Analyze volume levels
        const volumes = volumeHistoryRef.current
        const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length
        setVoiceIsLoud(avgVolume > 0.08) // Threshold determined empirically
        setRecordingDone(true)
        setIsRecording(false)

        // Clean up
        stream.getTracks().forEach((t) => t.stop())
        streamRef.current = null
        ctx.close()
        audioContextRef.current = null
      }

      recorder.start()

      // Auto-stop after 7 seconds
      setTimeout(() => {
        if (recorder.state === "recording") {
          recorder.stop()
        }
      }, 7000)
    } catch {
      setErrorMsg("无法访问麦克风，请允许麦克风权限后重试")
      setIsRecording(false)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop()
    }
  }

  const handleContinueAfterRecording = () => {
    setStep("questions")
    setCurrentQuestion(0)
  }

  // ===== Questions =====
  const handleAnswer = (answer: "A" | "B") => {
    const q = QUESTIONS[currentQuestion]
    setAnswers((prev) => ({ ...prev, [q.id]: answer }))
  }

  const handleNext = () => {
    if (currentQuestion < TOTAL_QUESTIONS - 1) {
      setCurrentQuestion((prev) => prev + 1)
    }
  }

  const handlePrev = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1)
    }
  }

  const handleSubmitAll = () => {
    const result = calculateSingTI({ answers, voiceIsLoud })
    setResult(result)
    setStep("result")
  }

  // ===== Share / Save =====
  const handleShareImage = async () => {
    if (!cardRef.current || saving || !result) return
    setSaving(true)
    try {
      const { toBlob } = await import('html-to-image')
      const blob = await toBlob(cardRef.current, { quality: 1, pixelRatio: 2 })
      if (!blob) throw new Error('Failed to generate image')

      // Try Web Share API with file
      if (navigator.share && navigator.canShare?.({ files: [new File([], '')] })) {
        const file = new File([blob], `singti-${result.name}.png`, { type: 'image/png' })
        try {
          await navigator.share({
            title: `SingTI 音乐人格：${result.name}`,
            text: `我测出了我的 SingTI 音乐人格：${result.name} ——「${result.tagline}」`,
            files: [file],
          })
          setSaving(false)
          return
        } catch {}
      }

      // Fallback: share text
      const text = `我测出了我的 SingTI 音乐人格：${result.name} ——「${result.tagline}」\n\n来测测你的音乐人格！`
      if (navigator.share) {
        try { await navigator.share({ title: 'SingTI 音乐人格', text }) } catch {}
      } else {
        try {
          await navigator.clipboard.writeText(text)
          alert('已复制到剪贴板，快去分享吧！')
        } catch {}
      }
    } catch {
      alert('分享失败，请尝试截图')
    }
    setSaving(false)
  }

  const handleSaveImage = async () => {
    if (!cardRef.current || saving) return
    setSaving(true)
    try {
      const { toPng } = await import('html-to-image')
      const dataUrl = await toPng(cardRef.current, { quality: 1, pixelRatio: 2 })
      const link = document.createElement('a')
      link.download = `singti-${result?.name || 'personality'}.png`
      link.href = dataUrl
      link.click()
    } catch {
      alert('保存失败，请尝试截图')
    }
    setSaving(false)
  }

  const handleCopyLink = () => {
    if (!result) return
    const url = `${window.location.origin}${window.location.pathname}?singti=${result.id}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {
      alert('复制失败，请手动复制链接')
    })
  }

  // ===== Intro Screen =====
  if (step === "intro") {
    return (
      <div className="h-full bg-background flex flex-col">
        <div className="px-4 pt-6 pb-4 border-b border-border/50">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-card border border-border/50 flex items-center justify-center hover:bg-secondary transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-6">
          <div className="w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-primary" />
          </div>

          <div>
            <h1 className="text-3xl font-black text-foreground mb-2">SingTI</h1>
            <p className="text-muted-foreground text-base leading-relaxed max-w-xs">
              唱一段《小星星》，再做 16 道选择题，测测你的音乐人格属于哪一款。
            </p>
          </div>

          <div className="space-y-3 w-full max-w-xs">
            <div className="flex items-center gap-3 bg-card rounded-2xl p-4 border border-border/50 text-left">
              <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                <Mic className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">第一步</p>
                <p className="text-xs text-muted-foreground">唱 7 秒《小星星》</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-card rounded-2xl p-4 border border-border/50 text-left">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                <Music className="w-5 h-5 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">第二步</p>
                <p className="text-xs text-muted-foreground">回答 16 道好玩的选择题</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-card rounded-2xl p-4 border border-border/50 text-left">
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-accent-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">第三步</p>
                <p className="text-xs text-muted-foreground">解锁你的专属 SingTI 人格</p>
              </div>
            </div>
          </div>

          <Button
            size="lg"
            className="w-full max-w-xs text-base rounded-2xl h-14"
            onClick={() => setStep("recording")}
          >
            开始测试
          </Button>
        </div>
      </div>
    )
  }

  // ===== Recording Screen =====
  if (step === "recording") {
    return (
      <div className="h-full bg-background flex flex-col">
        <div className="px-4 pt-6 pb-4 border-b border-border/50">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-card border border-border/50 flex items-center justify-center hover:bg-secondary transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-6">
          <div className="w-24 h-24 rounded-full bg-primary/15 flex items-center justify-center">
            {isRecording ? (
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
              >
                <Volume2 className="w-12 h-12 text-primary" />
              </motion.div>
            ) : recordingDone ? (
              <div className="w-12 h-12 rounded-full bg-accent/30 flex items-center justify-center">
                <span className="text-2xl">✓</span>
              </div>
            ) : (
              <Mic className="w-12 h-12 text-primary" />
            )}
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground mb-3">
              {isRecording ? "唱吧！" : recordingDone ? "录制完成！" : "唱一段《小星星》"}
            </h2>

            {!recordingDone && !isRecording && (
              <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                用你最自然的声音唱开头两句，大约 7 秒就好
              </p>
            )}

            {isRecording && (
              <div className="space-y-3">
                <p className="text-lg font-semibold text-foreground">
                  一闪一闪亮晶晶，满天都是小星星...
                </p>
                <RecordingWave />
              </div>
            )}

            {recordingDone && (
              <p className="text-sm text-muted-foreground">
                {voiceIsLoud ? "声音挺大嘛，是个外放型选手" : "声音小小的，是内敛派啊"}
              </p>
            )}
          </div>

          {errorMsg && (
            <p className="text-sm text-destructive">{errorMsg}</p>
          )}

          {!recordingDone ? (
            <Button
              size="lg"
              className={cn(
                "w-full max-w-xs text-base rounded-2xl h-14",
                isRecording && "bg-destructive hover:bg-destructive/90",
              )}
              onClick={isRecording ? stopRecording : startRecording}
            >
              {isRecording ? "录好了 🎤" : "开始录音"}
            </Button>
          ) : (
            <Button
              size="lg"
              className="w-full max-w-xs text-base rounded-2xl h-14"
              onClick={handleContinueAfterRecording}
            >
              继续答题 <ArrowRight className="w-4 h-4" />
            </Button>
          )}

          {isRecording && (
            <p className="text-xs text-muted-foreground">录音会在 7 秒后自动停止</p>
          )}
        </div>
      </div>
    )
  }

  // ===== Questions Screen =====
  if (step === "questions") {
    const q = QUESTIONS[currentQuestion]
    const answered = answers[q.id] !== undefined
    const totalAnswered = Object.keys(answers).length
    const showSubmit = currentQuestion === TOTAL_QUESTIONS - 1 && answered

    return (
      <div className="h-full bg-background flex flex-col">
        {/* Progress */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={currentQuestion > 0 ? handlePrev : onBack}
              className="w-8 h-8 rounded-full bg-card border border-border/50 flex items-center justify-center hover:bg-secondary transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-foreground" />
            </button>
            <span className="text-sm text-muted-foreground">
              {currentQuestion + 1}/{TOTAL_QUESTIONS}
            </span>
            <div className="w-8" />
          </div>
          <Progress value={((currentQuestion + 1) / TOTAL_QUESTIONS) * 100} className="h-1.5" />
        </div>

        {/* Question */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-sm"
            >
              <p className="text-xs text-primary font-medium mb-4">
                {currentQuestion < 4 ? "定向题" : "选择题"}
              </p>
              <h2 className="text-xl font-bold text-foreground mb-8 leading-snug">
                {q.text}
              </h2>

              <div className="space-y-3">
                {[
                  { key: "A" as const, text: q.optionA },
                  { key: "B" as const, text: q.optionB },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => handleAnswer(opt.key)}
                    className={cn(
                      "w-full p-5 rounded-2xl text-left font-medium transition-all border-2",
                      answers[q.id] === opt.key
                        ? "bg-primary/10 border-primary text-foreground"
                        : "bg-card border-border/50 text-foreground hover:border-primary/30",
                    )}
                  >
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-muted text-xs font-bold text-muted-foreground mr-3">
                      {opt.key}
                    </span>
                    {opt.text}
                  </button>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom */}
        <div className="px-6 pb-8">
          {showSubmit ? (
            <Button
              size="lg"
              className="w-full h-14 text-base rounded-2xl"
              onClick={handleSubmitAll}
            >
              查看我的 SingTI ✨
            </Button>
          ) : (
            <Button
              size="lg"
              className={cn(
                "w-full h-14 text-base rounded-2xl",
                !answered && "opacity-50",
              )}
              disabled={!answered}
              onClick={handleNext}
            >
              {answered ? "下一题" : "请选择一个选项"}
            </Button>
          )}
        </div>
      </div>
    )
  }

  // ===== Result Screen =====
  if (step === "result" && result) {
    return (
      <div className="h-full bg-background flex flex-col">
        <div className="flex-1 overflow-y-auto px-4 py-6">
          {/* Shareable Card — 可分享的链接卡片 */}
          <div ref={cardRef} className="rounded-3xl bg-card border border-border/50 overflow-hidden relative">
            {/* Colored top bar */}
            <div
              className="h-2"
              style={{ background: `linear-gradient(90deg, hsl(${result.id * 22}, 60%, 75%), hsl(${result.id * 22 + 30}, 55%, 80%))` }}
            />

            {/* Subtle background watermark */}
            <div
              className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-[0.04] pointer-events-none"
              style={{ background: `radial-gradient(circle, hsl(${result.id * 22}, 60%, 60%) 0%, transparent 70%)`, transform: 'translate(30%, -30%)' }}
            />

            <div className="p-7 text-center">
              {/* Brand watermark */}
              <p
                className="text-[10px] font-medium tracking-[0.3em] mb-5"
                style={{ color: `hsl(${result.id * 22}, 40%, 70%)` }}
              >
                五音不全 × SingTI
              </p>

              {/* Character Avatar */}
              <motion.div
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.15, type: "spring", stiffness: 250, damping: 15 }}
                className="mx-auto mb-5"
              >
                <CharacterAvatar personality={result} size={120} />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <p className="text-[11px] font-medium text-muted-foreground mb-1 tracking-widest uppercase">
                  音乐人格
                </p>
                <h2 className="text-3xl font-black text-foreground mb-1.5">{result.name}</h2>
                <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto leading-relaxed">
                  「{result.tagline}」
                </p>

                {/* Badges row */}
                <div className="flex items-center justify-center gap-3 mb-5">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-medium">
                    <Mic className="w-3 h-3" />
                    {voiceIsLoud ? "声音外放型" : "声音内敛型"}
                  </span>
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium"
                    style={{ backgroundColor: `hsl(${result.id * 22}, 60%, 92%)`, color: `hsl(${result.id * 22}, 50%, 40%)` }}
                  >
                    #{String(PERSONALITIES.findIndex((p) => p.id === result.id) + 1).padStart(2, '0')}
                    / 16
                  </span>
                </div>

                {/* Description */}
                <div className="bg-secondary/40 rounded-2xl p-5 text-left">
                  <p className="text-sm text-secondary-foreground leading-relaxed">
                    {result.description}
                  </p>
                </div>

                {/* CTA */}
                <p className="text-[10px] text-muted-foreground/60 mt-4 tracking-wider">
                  — 唱一段《小星星》，测测你的音乐人格 —
                </p>
              </motion.div>
            </div>
          </div>

          {/* Stats + Share */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-4 rounded-2xl bg-card border border-border/50 p-4"
          >
            <p className="text-xs text-muted-foreground font-medium mb-3">你的测试数据</p>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 rounded-xl bg-secondary/30">
                <p className="text-lg font-bold text-foreground">
                  {PERSONALITIES.findIndex((p) => p.id === result.id) + 1}
                </p>
                <p className="text-xs text-muted-foreground">/ 16 种人格</p>
              </div>
              <div className="p-3 rounded-xl bg-secondary/30">
                <p className="text-lg font-bold text-foreground">{Object.keys(answers).length}</p>
                <p className="text-xs text-muted-foreground">/ 16 题已答</p>
              </div>
            </div>

            {/* Share actions */}
            <div className="flex gap-2 mt-4">
              <Button variant="outline" className="flex-1 h-10 rounded-xl text-sm" onClick={handleShareImage} disabled={saving}>
                <Share2 className="w-4 h-4 mr-1.5" /> {saving ? '处理中...' : '分享图片'}
              </Button>
              <Button variant="outline" className="flex-1 h-10 rounded-xl text-sm" onClick={handleCopyLink}>
                {copied ? <Check className="w-4 h-4 mr-1.5 text-green-500" /> : <LinkIcon className="w-4 h-4 mr-1.5" />}
                {copied ? '已复制' : '复制链接'}
              </Button>
              <Button variant="outline" className="flex-1 h-10 rounded-xl text-sm" onClick={handleSaveImage} disabled={saving}>
                <Download className="w-4 h-4 mr-1.5" /> {saving ? '处理中...' : '保存图片'}
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Bottom */}
        <div className="px-4 py-4 border-t border-border/50 flex gap-3">
          <Button variant="outline" className="flex-1 h-12 rounded-2xl" onClick={onBack}>
            <RotateCcw className="w-4 h-4" /> 重测
          </Button>
          <Button
            className="flex-1 h-12 rounded-2xl"
            onClick={() => onComplete(result)}
          >
            保存人格
          </Button>
        </div>
      </div>
    )
  }

  return null
}

// ===== Recording Wave Animation =====
function RecordingWave() {
  return (
    <div className="flex items-center justify-center gap-1 h-12">
      {[1, 2, 3, 4, 5, 4, 3, 2].map((_, i) => (
        <motion.div
          key={i}
          className="w-1.5 bg-primary rounded-full"
          animate={{
            height: [8, 24 + Math.random() * 20, 8],
          }}
          transition={{
            repeat: Infinity,
            duration: 0.5 + Math.random() * 0.3,
            delay: i * 0.08,
          }}
        />
      ))}
    </div>
  )
}
