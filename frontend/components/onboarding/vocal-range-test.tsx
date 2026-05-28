"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Check, ArrowRight, Mic } from "lucide-react"
import { PitchMeter } from "@/components/pitch-meter"
import { classifyVoiceType, type VoiceTypeInfo } from "@/lib/voice-type"

// 音符频率表 C2–C6
const NOTES = [
  { note: 'C2', freq: 65.41 }, { note: 'C#2', freq: 69.30 }, { note: 'D2', freq: 73.42 }, { note: 'D#2', freq: 77.78 }, { note: 'E2', freq: 82.41 }, { note: 'F2', freq: 87.31 }, { note: 'F#2', freq: 92.50 }, { note: 'G2', freq: 98.00 }, { note: 'G#2', freq: 103.83 }, { note: 'A2', freq: 110.00 }, { note: 'A#2', freq: 116.54 }, { note: 'B2', freq: 123.47 },
  { note: 'C3', freq: 130.81 }, { note: 'C#3', freq: 138.59 }, { note: 'D3', freq: 146.83 }, { note: 'D#3', freq: 155.56 }, { note: 'E3', freq: 164.81 }, { note: 'F3', freq: 174.61 }, { note: 'F#3', freq: 185.00 }, { note: 'G3', freq: 196.00 }, { note: 'G#3', freq: 207.65 }, { note: 'A3', freq: 220.00 }, { note: 'A#3', freq: 233.08 }, { note: 'B3', freq: 246.94 },
  { note: 'C4', freq: 261.63 }, { note: 'C#4', freq: 277.18 }, { note: 'D4', freq: 293.66 }, { note: 'D#4', freq: 311.13 }, { note: 'E4', freq: 329.63 }, { note: 'F4', freq: 349.23 }, { note: 'F#4', freq: 369.99 }, { note: 'G4', freq: 392.00 }, { note: 'G#4', freq: 415.30 }, { note: 'A4', freq: 440.00 }, { note: 'A#4', freq: 466.16 }, { note: 'B4', freq: 493.88 },
  { note: 'C5', freq: 523.25 }, { note: 'C#5', freq: 554.37 }, { note: 'D5', freq: 587.33 }, { note: 'D#5', freq: 622.25 }, { note: 'E5', freq: 659.25 }, { note: 'F5', freq: 698.46 }, { note: 'F#5', freq: 739.99 }, { note: 'G5', freq: 783.99 }, { note: 'G#5', freq: 830.61 }, { note: 'A5', freq: 880.00 }, { note: 'A#5', freq: 932.33 }, { note: 'B5', freq: 987.77 },
  { note: 'C6', freq: 1046.50 },
]

interface VocalRangeTestProps {
  onComplete: (lowestNote: string, highestNote: string, gender: 'male' | 'female') => void
  gender: 'male' | 'female'
}

enum Phase {
  INTRO = 0,
  TESTING = 1,
  RESULT = 2,
}

const LOTTIE_NOTES: Record<string, string> = {
  'C2': '🎵', 'D2': '🎵', 'E2': '🎵', 'F2': '🎵', 'G2': '🎵',
  'A2': '🎵', 'B2': '🎵', 'C3': '🎶', 'D3': '🎶', 'E3': '🎶',
  'F3': '🎶', 'G3': '🎶', 'A3': '🎶', 'B3': '🎶',
  'C4': '🎤', 'D4': '🎤', 'E4': '🎤', 'F4': '🎤', 'G4': '🎤',
  'A4': '🎤', 'B4': '🎤', 'C5': '🌟', 'D5': '🌟', 'E5': '🌟',
  'F5': '🌟', 'G5': '🌟', 'A5': '🌟', 'B5': '🌟', 'C6': '🌟',
}

export function VocalRangeTest({ onComplete, gender }: VocalRangeTestProps) {
  const [phase, setPhase] = useState<Phase>(Phase.INTRO)
  const [lowest, setLowest] = useState<string | null>(null)
  const [highest, setHighest] = useState<string | null>(null)
  const [voiceType, setVoiceType] = useState<VoiceTypeInfo | null>(null)

  const handleTestingComplete = (low: string, high: string) => {
    setLowest(low)
    setHighest(high)
    const vt = classifyVoiceType(low, high, gender)
    setVoiceType(vt)
    setPhase(Phase.RESULT)
  }

  const handleConfirm = () => {
    if (lowest && highest) {
      onComplete(lowest, highest, gender)
    }
  }

  // ===== Phase: INTRO =====
  if (phase === Phase.INTRO) {
    const voiceTypeExamples = gender === 'male'
      ? ['男高音 · 男中音 · 男低音', 'B2–G4', 'G2–E4', 'D2–C4']
      : ['女高音 · 女中音 · 女低音', 'C4–C6', 'A3–A5', 'F3–F5']

    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FDF8F3] to-[#F5EDE5] flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#A8D5BA] to-[#B4C7E8] flex items-center justify-center mx-auto mb-6">
            <Mic className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#4A3728] mb-3">音域测试</h1>
          <p className="text-sm text-[#8B7355] mb-8 max-w-xs leading-relaxed mx-auto">
            从你最低音平稳滑到最高音，<br />
            AI 会自动追踪你的音域范围
          </p>
          <div className="bg-white/70 rounded-2xl p-4 mb-8 text-left max-w-xs mx-auto">
            <p className="text-xs font-medium text-[#4A3728] mb-2">💡 小技巧</p>
            <ul className="text-xs text-[#8B7355] space-y-1.5">
              <li>• 先往下唱到最低音</li>
              <li>• 再往上一路唱到最高音</li>
              <li>• 用"啊——"长音唱，每个音保持 1-2 秒</li>
              <li>• 自然发声即可，不用喊</li>
            </ul>
          </div>
          <div className="max-w-xs mx-auto">
            <p className="text-xs text-[#8B7355] text-center mb-3">你的声部可能属于</p>
            <p className="text-sm font-semibold text-[#4A3728] text-center">{voiceTypeExamples[0]}</p>
          </div>
        </motion.div>
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={() => setPhase(Phase.TESTING)}
          className="mt-10 w-full max-w-xs h-14 rounded-2xl bg-gradient-to-r from-[#A8D5BA] to-[#B4C7E8] text-white font-medium text-lg shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          开始测试
          <ArrowRight className="w-5 h-5" />
        </motion.button>
      </div>
    )
  }

  // ===== Phase: TESTING =====
  if (phase === Phase.TESTING) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FDF8F3] to-[#F5EDE5] flex flex-col">
        <div className="flex-1 flex flex-col">
          <div className="px-4 pt-6 pb-2">
            <h1 className="text-lg font-bold text-[#4A3728] text-center">唱出你的音域</h1>
            <p className="text-xs text-[#8B7355] text-center mt-1">从最低音唱到最高音</p>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <PitchMeter
              tracking
              onComplete={handleTestingComplete}
            />
          </div>
        </div>
      </div>
    )
  }

  // ===== Phase: RESULT =====
  if (phase === Phase.RESULT) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FDF8F3] to-[#F5EDE5] flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="text-center"
        >
          {/* Checkmark */}
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#A8D5BA] to-[#B4C7E8] flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-white" />
          </div>

          <h1 className="text-2xl font-bold text-[#4A3728] mb-2">音域检测完成</h1>

          {/* Voice type badge */}
          {voiceType && (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#A8D5BA]/20 text-[#5A9B7A] text-sm font-medium mb-4 mt-2">
              {voiceType.icon} {voiceType.label} · {voiceType.labelEn}
            </div>
          )}

          {/* Range display */}
          <div className="bg-white/70 rounded-2xl p-6 mb-6 max-w-xs mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="text-center">
                <p className="text-[10px] text-[#8B7355]">最低音</p>
                <p className="text-3xl font-black text-[#4A3728]">{lowest}</p>
                <p className="text-[10px] text-[#8B7355]">{LOTTIE_NOTES[lowest || ''] || '🎵'}</p>
              </div>
              <div className="flex-1 mx-4 h-1 bg-gradient-to-r from-[#A8D5BA] via-[#B4C7E8] to-[#E8B4A0] rounded-full" />
              <div className="text-center">
                <p className="text-[10px] text-[#8B7355]">最高音</p>
                <p className="text-3xl font-black text-[#4A3728]">{highest}</p>
                <p className="text-[10px] text-[#8B7355]">{LOTTIE_NOTES[highest || ''] || '🌟'}</p>
              </div>
            </div>

            {voiceType && (
              <div className="bg-[#A8D5BA]/10 rounded-xl p-3 text-center">
                <p className="text-xs text-[#8B7355] mb-1">典型 {voiceType.label} 音域</p>
                <p className="text-sm font-bold text-[#4A3728]">{voiceType.typicalRange}</p>
                <p className="text-xs text-[#8B7355] mt-1">{voiceType.description}</p>
              </div>
            )}
          </div>

          {/* Decorative: show the range on a mini piano-like bar */}
          <div className="w-full max-w-xs mb-6">
            <div className="h-3 rounded-full bg-[#E8DDD5] relative overflow-hidden">
              <div
                className="absolute inset-y-0 rounded-full bg-gradient-to-r from-[#A8D5BA] to-[#B4C7E8]"
                style={{
                  left: `${(NOTES.findIndex(n => n.note === lowest) / (NOTES.length - 1)) * 100}%`,
                  right: `${100 - (NOTES.findIndex(n => n.note === highest) / (NOTES.length - 1)) * 100}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-[8px] text-[#8B7355] mt-1">
              <span>C2</span><span>C3</span><span>C4</span><span>C5</span><span>C6</span>
            </div>
          </div>

          <button
            onClick={handleConfirm}
            className="w-full max-w-xs h-14 rounded-2xl bg-gradient-to-r from-[#A8D5BA] to-[#B4C7E8] text-white font-medium text-lg shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            完成
            <Check className="w-5 h-5" />
          </button>

          <button
            onClick={() => setPhase(Phase.TESTING)}
            className="w-full max-w-xs mt-3 h-12 rounded-2xl border-2 border-[#E8DDD5] text-[#8B7355] font-medium text-sm transition-all active:scale-95"
          >
            重新测试
          </button>
        </motion.div>
      </div>
    )
  }

  return null
}
