"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Music2, Mic } from "lucide-react"

interface VocalRangeIntroProps {
  onContinue: (gender: 'male' | 'female') => void
}

export function VocalRangeIntro({ onContinue }: VocalRangeIntroProps) {
  const [selectedGender, setSelectedGender] = useState<'male' | 'female' | null>(null)

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FDF8F3] to-[#F5EDE5] flex flex-col items-center justify-center px-6">
      {/* Animated music icon */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="mb-8"
      >
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#A8D5BA] to-[#B4C7E8] flex items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <Music2 className="w-12 h-12 text-white" />
          </motion.div>
        </div>
      </motion.div>

      {/* Title */}
      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="text-3xl font-bold text-[#4A3728] text-center mb-3"
      >
        探索你的音域极限
      </motion.h1>
      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.5 }}
        className="text-sm text-[#8B7355] text-center mb-10 max-w-xs leading-relaxed"
      >
        从最低音平稳唱到最高音，AI 会自动识别你的音域范围
      </motion.p>

      {/* Gender selection */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="w-full max-w-xs space-y-3 mb-10"
      >
        <p className="text-sm font-medium text-[#4A3728] text-center mb-4">请选择你的性别（用于声部分类）</p>
        <button
          onClick={() => setSelectedGender('male')}
          className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${
            selectedGender === 'male'
              ? 'bg-[#B4C7E8]/20 border-[#B4C7E8]'
              : 'bg-white border-[#E8DDD5] hover:border-[#B4C7E8]/50'
          }`}
        >
          <div className="w-12 h-12 rounded-full bg-[#B4C7E8]/30 flex items-center justify-center text-xl">
            ♂
          </div>
          <div className="text-left">
            <p className="font-semibold text-[#4A3728]">男生</p>
            <p className="text-xs text-[#8B7355]">男高音 · 男中音 · 男低音</p>
          </div>
        </button>
        <button
          onClick={() => setSelectedGender('female')}
          className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${
            selectedGender === 'female'
              ? 'bg-[#E8B4A0]/20 border-[#E8B4A0]'
              : 'bg-white border-[#E8DDD5] hover:border-[#E8B4A0]/50'
          }`}
        >
          <div className="w-12 h-12 rounded-full bg-[#E8B4A0]/30 flex items-center justify-center text-xl">
            ♀
          </div>
          <div className="text-left">
            <p className="font-semibold text-[#4A3728]">女生</p>
            <p className="text-xs text-[#8B7355]">女高音 · 女中音 · 女低音</p>
          </div>
        </button>
      </motion.div>

      {/* Animated waves */}
      <motion.div
        className="flex gap-1 mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="w-1.5 bg-gradient-to-t from-[#A8D5BA] to-[#B4C7E8] rounded-full"
            animate={{ height: [16, 32, 48, 32, 16] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.1, ease: "easeInOut" }}
          />
        ))}
      </motion.div>

      {/* Continue button */}
      <motion.button
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        onClick={() => selectedGender && onContinue(selectedGender)}
        disabled={!selectedGender}
        className="w-full max-w-xs h-14 rounded-2xl bg-gradient-to-r from-[#A8D5BA] to-[#B4C7E8] text-white font-medium text-lg shadow-lg flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
      >
        <Mic className="w-5 h-5" />
        开始测试音域
      </motion.button>
    </div>
  )
}
