"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"

interface QuestionnaireProps {
  onComplete: (answers: Record<string, string | string[]>) => void
  onBack: () => void
}

const TOTAL_QUESTIONS = 6

// Separate Age Picker Component to properly use hooks
function AgePicker({ 
  selectedAge, 
  onAgeChange 
}: { 
  selectedAge: number
  onAgeChange: (age: number) => void 
}) {
  const ages = Array.from({ length: 83 }, (_, i) => i + 8) // 8-90
  const containerRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    // Scroll to selected age on mount
    if (containerRef.current) {
      const itemHeight = 56
      const scrollTop = (selectedAge - 8) * itemHeight - containerRef.current.clientHeight / 2 + itemHeight / 2
      containerRef.current.scrollTop = scrollTop
    }
  }, [])

  const handleScroll = () => {
    if (containerRef.current) {
      const itemHeight = 56
      const scrollTop = containerRef.current.scrollTop
      const centerOffset = containerRef.current.clientHeight / 2
      const index = Math.round((scrollTop + centerOffset - itemHeight / 2) / itemHeight)
      const newAge = Math.max(8, Math.min(90, index + 8))
      if (newAge !== selectedAge) {
        onAgeChange(newAge)
      }
    }
  }

  return (
    <div className="flex-1 flex flex-col">
      <h2 className="text-2xl font-bold text-[#4A3728] mb-8 text-center">
        您的年龄？
      </h2>
      
      <div className="flex-1 flex items-center justify-center relative">
        {/* Selection indicator */}
        <div className="absolute left-1/2 -translate-x-1/2 w-24 h-14 bg-[#E8B4A0] rounded-2xl z-0" />
        
        {/* Scroll container */}
        <div 
          ref={containerRef}
          onScroll={handleScroll}
          className="h-[280px] overflow-y-auto scrollbar-hide relative z-10 snap-y snap-mandatory"
          style={{ scrollSnapType: 'y mandatory' }}
        >
          <div className="h-[112px]" /> {/* Top spacer */}
          {ages.map((age) => (
            <div
              key={age}
              className={`h-14 flex items-center justify-center snap-center transition-all cursor-pointer ${
                age === selectedAge
                  ? 'text-[#4A3728] text-3xl font-bold'
                  : Math.abs(age - selectedAge) === 1
                    ? 'text-[#4A3728] text-xl'
                    : 'text-[#8B7355] text-lg'
              }`}
              onClick={() => onAgeChange(age)}
            >
              {age}
            </div>
          ))}
          <div className="h-[112px]" /> {/* Bottom spacer */}
        </div>
      </div>
      
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}

export function Questionnaire({ onComplete, onBack }: QuestionnaireProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  
  // Question 1: Age
  const [selectedAge, setSelectedAge] = useState<number>(25)
  
  // Question 2: Confidence (1-5)
  const [confidence, setConfidence] = useState<number | null>(null)
  
  // Question 3: Core goal
  const [goal, setGoal] = useState<string | null>(null)
  
  // Question 4: Pain points (multi-select, max 3)
  const [painPoints, setPainPoints] = useState<string[]>([])
  
  // Question 5: Past experience
  const [experience, setExperience] = useState<string | null>(null)
  
  // Question 6: Favorite singer
  const [favoriteSinger, setFavoriteSinger] = useState("")

  const progress = ((currentIndex + 1) / TOTAL_QUESTIONS) * 100

  const canContinue = () => {
    switch (currentIndex) {
      case 0: return selectedAge !== null
      case 1: return confidence !== null
      case 2: return goal !== null
      case 3: return true // Can skip
      case 4: return true // Can skip
      case 5: return true // Can skip
      default: return false
    }
  }

  const isRequired = () => {
    return currentIndex <= 2
  }

  const handleNext = () => {
    // Save current answer
    const newAnswers = { ...answers }
    switch (currentIndex) {
      case 0:
        newAnswers.age = String(selectedAge)
        break
      case 1:
        newAnswers.confidence = String(confidence)
        break
      case 2:
        newAnswers.goal = goal || ""
        break
      case 3:
        newAnswers.painPoints = painPoints
        break
      case 4:
        newAnswers.experience = experience || ""
        break
      case 5:
        newAnswers.favoriteSinger = favoriteSinger
        break
    }
    setAnswers(newAnswers)

    if (currentIndex < TOTAL_QUESTIONS - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      onComplete(newAnswers)
    }
  }

  const handleSkip = () => {
    if (currentIndex < TOTAL_QUESTIONS - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      onComplete(answers)
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    } else {
      onBack()
    }
  }

  // Render Question 2: Confidence Rating
  const renderConfidence = () => (
    <div className="flex-1 flex flex-col">
      <h2 className="text-2xl font-bold text-[#4A3728] mb-2 text-center">
        您的唱歌自信度？
      </h2>
      <p className="text-[#8B7355] text-center mb-12">
        1分-完全不敢开口，5分-麦霸级别
      </p>
      
      <div className="flex-1 flex items-center justify-center">
        <div className="flex gap-4">
          {[1, 2, 3, 4, 5].map((num) => (
            <button
              key={num}
              onClick={() => setConfidence(num)}
              className={`w-14 h-14 rounded-full border-2 flex items-center justify-center text-lg font-bold transition-all ${
                confidence === num
                  ? 'bg-[#E8B4A0] border-[#E8B4A0] text-white scale-110'
                  : 'border-[#E8DDD5] text-[#4A3728] hover:border-[#E8B4A0]'
              }`}
            >
              {num}
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  // Render Question 3: Core Goal
  const renderGoal = () => {
    const goals = [
      { id: 'A', text: '打好基础，系统提升唱功' },
      { id: 'B', text: '在KTV/聚会中自信地唱出喜欢的歌' },
      { id: 'C', text: '特别想唱好一首歌' },
    ]

    return (
      <div className="flex-1 flex flex-col">
        <h2 className="text-2xl font-bold text-[#4A3728] mb-8 text-center">
          您的核心目标是？
        </h2>
        
        <div className="space-y-4">
          {goals.map((item) => (
            <button
              key={item.id}
              onClick={() => setGoal(item.id)}
              className={`w-full py-5 px-5 rounded-2xl text-left font-medium transition-all border-2 ${
                goal === item.id
                  ? 'bg-[#E8B4A0]/10 border-[#E8B4A0] text-[#4A3728]'
                  : 'bg-white border-transparent text-[#4A3728] shadow-sm hover:shadow-md'
              }`}
            >
              {item.text}
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Render Question 4: Pain Points
  const renderPainPoints = () => {
    const points = ['唱歌跑调', '高音上不去', '气息不够用', '节奏跟不上', '声音不好听']

    const togglePoint = (point: string) => {
      if (painPoints.includes(point)) {
        setPainPoints(painPoints.filter(p => p !== point))
      } else if (painPoints.length < 3) {
        setPainPoints([...painPoints, point])
      }
    }

    return (
      <div className="flex-1 flex flex-col">
        <h2 className="text-2xl font-bold text-[#4A3728] mb-2 text-center">
          你最想改善什么？
        </h2>
        <p className="text-[#8B7355] text-center mb-8">
          多选，最多 3 项
        </p>
        
        <div className="flex flex-wrap gap-3 justify-center">
          {points.map((point) => (
            <button
              key={point}
              onClick={() => togglePoint(point)}
              className={`px-5 py-3 rounded-full font-medium transition-all ${
                painPoints.includes(point)
                  ? 'bg-[#E8B4A0] text-white'
                  : 'bg-white text-[#4A3728] shadow-sm hover:shadow-md'
              }`}
            >
              {point}
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Render Question 5: Past Experience
  const renderExperience = () => {
    const options = [
      '完全没有',
      '自己随便练练',
      '跟着视频学过',
      '上过线下声乐课',
    ]

    return (
      <div className="flex-1 flex flex-col">
        <h2 className="text-2xl font-bold text-[#4A3728] mb-8 text-center">
          您此前尝试过什么方法？
        </h2>
        
        <div className="space-y-3">
          {options.map((option) => (
            <button
              key={option}
              onClick={() => setExperience(option)}
              className={`w-full py-4 px-5 rounded-2xl text-left font-medium transition-all border-2 ${
                experience === option
                  ? 'bg-[#E8B4A0]/10 border-[#E8B4A0] text-[#4A3728]'
                  : 'bg-white border-transparent text-[#4A3728] shadow-sm hover:shadow-md'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Render Question 6: Favorite Singer
  const renderFavoriteSinger = () => (
    <div className="flex-1 flex flex-col">
      <h2 className="text-2xl font-bold text-[#4A3728] mb-8 text-center">
        您最喜欢的歌手是？
      </h2>
      
      <div className="flex-1 flex items-start justify-center pt-8">
        <Input
          value={favoriteSinger}
          onChange={(e) => setFavoriteSinger(e.target.value)}
          placeholder="例如：周杰伦、陈奕迅..."
          className="w-full h-14 rounded-2xl bg-white border-none shadow-sm text-lg px-5 placeholder:text-[#C4B5A8]"
        />
      </div>
    </div>
  )

  const renderQuestion = () => {
    switch (currentIndex) {
      case 0: return <AgePicker selectedAge={selectedAge} onAgeChange={setSelectedAge} />
      case 1: return renderConfidence()
      case 2: return renderGoal()
      case 3: return renderPainPoints()
      case 4: return renderExperience()
      case 5: return renderFavoriteSinger()
      default: return null
    }
  }

  return (
    <div className="min-h-screen bg-[#FDF8F3] flex flex-col">
      {/* Top navigation bar */}
      <div className="px-4 py-4 flex items-center gap-4">
        <button
          onClick={handlePrev}
          className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center shadow-sm"
        >
          <ChevronLeft className="w-5 h-5 text-[#4A3728]" />
        </button>
        <div className="flex-1">
          <Progress value={progress} className="h-2" />
        </div>
        <span className="text-sm text-[#8B7355] min-w-[3rem] text-right">
          {currentIndex + 1}/{TOTAL_QUESTIONS}
        </span>
      </div>

      {/* Question area */}
      <div className="flex-1 px-6 py-8 flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={false}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col"
          >
            {renderQuestion()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom buttons */}
      <div className="px-6 pb-8">
        {isRequired() ? (
          <Button
            onClick={handleNext}
            disabled={!canContinue()}
            className="w-full h-14 rounded-2xl bg-[#E8B4A0] hover:bg-[#D4A088] text-white font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            继续
          </Button>
        ) : (
          <div className="flex gap-3">
            <Button
              onClick={handleSkip}
              variant="outline"
              className="flex-1 h-14 rounded-2xl border-[#E8DDD5] text-[#8B7355] font-medium text-lg"
            >
              跳过
            </Button>
            <Button
              onClick={handleNext}
              className="flex-1 h-14 rounded-2xl bg-[#E8B4A0] hover:bg-[#D4A088] text-white font-medium text-lg"
            >
              继续
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
