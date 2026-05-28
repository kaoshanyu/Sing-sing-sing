"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, Mic, Volume2, Check, X, Headphones } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

interface AssessmentProps {
  onComplete: (results: AssessmentResults) => void
  onBack: () => void
}

export interface AssessmentResults {
  pitchAccuracy: number      // 音准能力 0-100
  intervalRecognition: number // 音程识别 0-100
  rhythmSense: number        // 节奏感 0-100
  vocalRange: number         // 音域宽度 0-100
  tonalMemory: number        // 音调记忆 0-100
}

type AssessmentStep = 
  | 'intro'
  | 'environment'
  | 'pitch-compare'
  | 'interval-test'
  | 'triplet-test'
  | 'sing-test'
  | 'complete'

interface TestQuestion {
  id: number
  type: string
  correct: boolean | null
}

export function Assessment({ onComplete, onBack }: AssessmentProps) {
  const [step, setStep] = useState<AssessmentStep>('intro')
  const [currentTest, setCurrentTest] = useState(0)
  const [testResults, setTestResults] = useState<TestQuestion[]>([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [environmentReady, setEnvironmentReady] = useState(false)
  const audioContextRef = useRef<AudioContext | null>(null)

  // 模拟播放音频
  const playSound = async (frequency: number, duration: number = 1000) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext()
    }
    
    const ctx = audioContextRef.current
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)
    
    oscillator.frequency.value = frequency
    oscillator.type = 'sine'
    
    gainNode.gain.setValueAtTime(0, ctx.currentTime)
    gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.1)
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration / 1000)
    
    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + duration / 1000)
    
    setIsPlaying(true)
    await new Promise(resolve => setTimeout(resolve, duration))
    setIsPlaying(false)
  }

  // 获取进度
  const getProgress = () => {
    const steps = ['intro', 'environment', 'pitch-compare', 'interval-test', 'triplet-test', 'sing-test', 'complete']
    return ((steps.indexOf(step) + 1) / steps.length) * 100
  }

  // 处理环境检测
  const handleEnvironmentCheck = async () => {
    // 请求麦克风权限
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
      setEnvironmentReady(true)
      setTimeout(() => setStep('pitch-compare'), 1000)
    } catch {
      // 即使没有麦克风权限也允许继续（演示模式）
      setEnvironmentReady(true)
      setTimeout(() => setStep('pitch-compare'), 1000)
    }
  }

  // 处理音高比较测试
  const handlePitchCompare = async (answer: 'higher' | 'lower' | 'same') => {
    // 模拟正确/错误
    const isCorrect = Math.random() > 0.3
    setTestResults([...testResults, { id: currentTest, type: 'pitch', correct: isCorrect }])
    
    if (currentTest < 4) {
      setCurrentTest(currentTest + 1)
      // 播放新的音
      await playSound(440 + Math.random() * 200)
    } else {
      setCurrentTest(0)
      setStep('interval-test')
    }
  }

  // 处理音程测试
  const handleIntervalTest = async (answer: number) => {
    const isCorrect = Math.random() > 0.35
    setTestResults([...testResults, { id: currentTest, type: 'interval', correct: isCorrect }])
    
    if (currentTest < 4) {
      setCurrentTest(currentTest + 1)
    } else {
      setCurrentTest(0)
      setStep('triplet-test')
    }
  }

  // 处理三连音测试
  const handleTripletTest = async (answer: number) => {
    const isCorrect = Math.random() > 0.4
    setTestResults([...testResults, { id: currentTest, type: 'triplet', correct: isCorrect }])
    
    if (currentTest < 2) {
      setCurrentTest(currentTest + 1)
    } else {
      setCurrentTest(0)
      setStep('sing-test')
    }
  }

  // 处理演唱测试
  const handleSingTest = () => {
    setIsRecording(true)
    // 模拟录音
    setTimeout(() => {
      setIsRecording(false)
      const isCorrect = Math.random() > 0.3
      setTestResults([...testResults, { id: currentTest, type: 'sing', correct: isCorrect }])
      
      if (currentTest < 2) {
        setCurrentTest(currentTest + 1)
      } else {
        // 计算结果
        const pitchTests = testResults.filter(t => t.type === 'pitch')
        const intervalTests = testResults.filter(t => t.type === 'interval')
        const tripletTests = testResults.filter(t => t.type === 'triplet')
        const singTests = testResults.filter(t => t.type === 'sing')
        
        const results: AssessmentResults = {
          pitchAccuracy: Math.round(60 + Math.random() * 30),
          intervalRecognition: Math.round(50 + Math.random() * 35),
          rhythmSense: Math.round(55 + Math.random() * 30),
          vocalRange: Math.round(45 + Math.random() * 40),
          tonalMemory: Math.round(50 + Math.random() * 35),
        }
        
        setTimeout(() => onComplete(results), 500)
      }
    }, 3000)
  }

  // 渲染介绍页
  const renderIntro = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 flex flex-col items-center justify-center px-6 text-center"
    >
      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#A8D5BA] to-[#8BC4A0] flex items-center justify-center mb-8">
        <Headphones className="w-12 h-12 text-white" />
      </div>
      <h1 className="text-2xl font-bold text-[#4A3728] mb-4">专业音乐评估</h1>
      <p className="text-[#8B7355] mb-8 text-balance">
        接下来我们将通过几个小测试，全面了解你的音乐能力，为你定制专属学习计划
      </p>
      <div className="w-full space-y-3 text-left mb-8">
        {[
          { icon: Volume2, text: '听音比高低（5题）' },
          { icon: Volume2, text: '音程识别（5题）' },
          { icon: Volume2, text: '三连音辨别（3题）' },
          { icon: Mic, text: '音准实测（3题）' },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-3 bg-white/60 rounded-xl px-4 py-3">
            <item.icon className="w-5 h-5 text-[#E8B4A0]" />
            <span className="text-[#4A3728]">{item.text}</span>
          </div>
        ))}
      </div>
      <Button
        onClick={() => setStep('environment')}
        className="w-full h-14 rounded-2xl bg-[#E8B4A0] hover:bg-[#D4A088] text-white font-medium text-lg"
      >
        开始评估
      </Button>
    </motion.div>
  )

  // 渲染环境检测
  const renderEnvironment = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 flex flex-col items-center justify-center px-6 text-center"
    >
      <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-8 transition-colors ${
        environmentReady ? 'bg-[#A8D5BA]' : 'bg-[#E8B4A0]'
      }`}>
        {environmentReady ? (
          <Check className="w-12 h-12 text-white" />
        ) : (
          <Mic className="w-12 h-12 text-white animate-pulse" />
        )}
      </div>
      <h1 className="text-2xl font-bold text-[#4A3728] mb-4">
        {environmentReady ? '环境检测完成' : '环境检测中...'}
      </h1>
      <p className="text-[#8B7355] mb-8">
        {environmentReady 
          ? '一切准备就绪，让我们开始吧！' 
          : '请确保处于安静环境，并允许使用麦克风'
        }
      </p>
      {!environmentReady && (
        <Button
          onClick={handleEnvironmentCheck}
          className="w-full h-14 rounded-2xl bg-[#E8B4A0] hover:bg-[#D4A088] text-white font-medium text-lg"
        >
          允许使用麦克风
        </Button>
      )}
    </motion.div>
  )

  // 渲染音高比较测试
  const renderPitchCompare = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 flex flex-col px-6 py-8"
    >
      <div className="text-center mb-8">
        <span className="text-sm text-[#8B7355]">第 {currentTest + 1}/5 题</span>
        <h2 className="text-xl font-bold text-[#4A3728] mt-2">听音比高低</h2>
        <p className="text-[#8B7355] mt-1">听两个音，判断第二个音相比第一个音的高低</p>
      </div>

      {/* 播放区域 */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="flex items-center gap-8 mb-12">
          <button
            onClick={() => playSound(440)}
            className={`w-20 h-20 rounded-full bg-[#B4C7E8] flex items-center justify-center shadow-lg transition-transform ${
              isPlaying ? 'scale-110' : 'hover:scale-105'
            }`}
          >
            <Volume2 className="w-8 h-8 text-white" />
          </button>
          <span className="text-[#8B7355]">VS</span>
          <button
            onClick={() => playSound(520)}
            className={`w-20 h-20 rounded-full bg-[#E8B4D4] flex items-center justify-center shadow-lg transition-transform ${
              isPlaying ? 'scale-110' : 'hover:scale-105'
            }`}
          >
            <Volume2 className="w-8 h-8 text-white" />
          </button>
        </div>

        {/* 答案选项 */}
        <div className="w-full space-y-3">
          {[
            { value: 'higher', label: '第二个音更高' },
            { value: 'same', label: '两个音一样高' },
            { value: 'lower', label: '第二个音更低' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => handlePitchCompare(option.value as 'higher' | 'lower' | 'same')}
              className="w-full py-4 px-5 rounded-2xl bg-white text-[#4A3728] font-medium shadow-sm hover:shadow-md transition-shadow"
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  )

  // 渲染音程测试
  const renderIntervalTest = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 flex flex-col px-6 py-8"
    >
      <div className="text-center mb-8">
        <span className="text-sm text-[#8B7355]">第 {currentTest + 1}/5 题</span>
        <h2 className="text-xl font-bold text-[#4A3728] mt-2">音程识别</h2>
        <p className="text-[#8B7355] mt-1">听两个音，判断它们之间相差几度</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <button
          onClick={() => playSound(440, 500).then(() => playSound(550, 500))}
          className={`w-24 h-24 rounded-full bg-gradient-to-br from-[#D4B4E8] to-[#B4A0D4] flex items-center justify-center shadow-lg mb-12 ${
            isPlaying ? 'scale-110' : 'hover:scale-105'
          } transition-transform`}
        >
          <Volume2 className="w-10 h-10 text-white" />
        </button>

        <div className="grid grid-cols-3 gap-3 w-full">
          {[2, 3, 4, 5, 6, 7].map((interval) => (
            <button
              key={interval}
              onClick={() => handleIntervalTest(interval)}
              className="py-4 rounded-2xl bg-white text-[#4A3728] font-medium shadow-sm hover:shadow-md transition-shadow"
            >
              {interval}度
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  )

  // 渲染三连音测试
  const renderTripletTest = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 flex flex-col px-6 py-8"
    >
      <div className="text-center mb-8">
        <span className="text-sm text-[#8B7355]">第 {currentTest + 1}/3 题</span>
        <h2 className="text-xl font-bold text-[#4A3728] mt-2">三连音辨别</h2>
        <p className="text-[#8B7355] mt-1">听三个音，找出与其他两个不同的那个</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="flex items-center gap-4 mb-12">
          {[1, 2, 3].map((num) => (
            <button
              key={num}
              onClick={() => playSound(440 + (num === 2 ? 50 : 0))}
              className="w-16 h-16 rounded-full bg-[#E8D4A0] flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
            >
              <span className="text-white font-bold">{num}</span>
            </button>
          ))}
        </div>

        <p className="text-[#8B7355] mb-6">哪个音不一样？</p>

        <div className="flex gap-4">
          {[1, 2, 3].map((num) => (
            <button
              key={num}
              onClick={() => handleTripletTest(num)}
              className="w-20 h-20 rounded-2xl bg-white text-[#4A3728] font-bold text-xl shadow-sm hover:shadow-md transition-shadow"
            >
              {num}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  )

  // 渲染演唱测试
  const renderSingTest = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 flex flex-col px-6 py-8"
    >
      <div className="text-center mb-8">
        <span className="text-sm text-[#8B7355]">第 {currentTest + 1}/3 题</span>
        <h2 className="text-xl font-bold text-[#4A3728] mt-2">音准实测</h2>
        <p className="text-[#8B7355] mt-1">先听示范音，然后跟着唱出来</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        {/* 示范音播放 */}
        <button
          onClick={() => playSound(440, 1500)}
          disabled={isRecording}
          className={`w-24 h-24 rounded-full bg-gradient-to-br from-[#A8D5BA] to-[#8BC4A0] flex items-center justify-center shadow-lg mb-8 ${
            isPlaying ? 'scale-110' : 'hover:scale-105'
          } transition-transform disabled:opacity-50`}
        >
          <Volume2 className="w-10 h-10 text-white" />
        </button>
        <p className="text-[#8B7355] mb-8">点击播放示范音</p>

        {/* 录音按钮 */}
        <button
          onClick={handleSingTest}
          disabled={isPlaying}
          className={`w-32 h-32 rounded-full flex items-center justify-center shadow-lg transition-all ${
            isRecording 
              ? 'bg-[#E8A0A0] scale-110 animate-pulse' 
              : 'bg-[#E8B4A0] hover:scale-105'
          } disabled:opacity-50`}
        >
          <Mic className="w-12 h-12 text-white" />
        </button>
        <p className="text-[#8B7355] mt-4">
          {isRecording ? '正在录音...' : '点击开始录音'}
        </p>

        {/* 音高可视化区域 */}
        {isRecording && (
          <div className="mt-8 w-full h-24 bg-white/60 rounded-2xl overflow-hidden">
            <div className="h-full flex items-center justify-center gap-1">
              {Array.from({ length: 30 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="w-2 bg-[#E8B4A0] rounded-full"
                  animate={{
                    height: [10, 30 + Math.random() * 40, 10],
                  }}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    delay: i * 0.05,
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )

  return (
    <div className="min-h-screen bg-[#FDF8F3] flex flex-col">
      {/* 顶部导航 - 始终显示退出按钮 */}
      <div className="px-4 py-4 flex items-center gap-4">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center shadow-sm"
        >
          <ChevronLeft className="w-5 h-5 text-[#4A3728]" />
        </button>
        {step !== 'intro' && (
          <div className="flex-1">
            <Progress value={getProgress()} className="h-2" />
          </div>
        )}
      </div>

      {/* 主内容 */}
      <AnimatePresence mode="wait">
        {step === 'intro' && renderIntro()}
        {step === 'environment' && renderEnvironment()}
        {step === 'pitch-compare' && renderPitchCompare()}
        {step === 'interval-test' && renderIntervalTest()}
        {step === 'triplet-test' && renderTripletTest()}
        {step === 'sing-test' && renderSingTest()}
      </AnimatePresence>
    </div>
  )
}
