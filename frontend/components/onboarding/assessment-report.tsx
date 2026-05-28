"use client"

import { useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Sparkles, TrendingUp, Target, Music } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AssessmentResults } from "./assessment"

interface AssessmentReportProps {
  results: AssessmentResults
  onStart: () => void
}

export function AssessmentReport({ results, onStart }: AssessmentReportProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // 绘制雷达图
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const size = 280
    canvas.width = size * dpr
    canvas.height = size * dpr
    canvas.style.width = `${size}px`
    canvas.style.height = `${size}px`
    ctx.scale(dpr, dpr)

    const centerX = size / 2
    const centerY = size / 2
    const radius = size / 2 - 40

    // 数据
    const data = [
      { label: '音准', value: results.pitchAccuracy },
      { label: '音程', value: results.intervalRecognition },
      { label: '节奏', value: results.rhythmSense },
      { label: '音域', value: results.vocalRange },
      { label: '记忆', value: results.tonalMemory },
    ]

    const angleStep = (Math.PI * 2) / data.length
    const startAngle = -Math.PI / 2 // 从顶部开始

    // 绘制背景网格
    ctx.strokeStyle = '#E8DDD5'
    ctx.lineWidth = 1

    for (let level = 1; level <= 4; level++) {
      const levelRadius = (radius / 4) * level
      ctx.beginPath()
      for (let i = 0; i <= data.length; i++) {
        const angle = startAngle + i * angleStep
        const x = centerX + Math.cos(angle) * levelRadius
        const y = centerY + Math.sin(angle) * levelRadius
        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }
      ctx.stroke()
    }

    // 绘制轴线
    for (let i = 0; i < data.length; i++) {
      const angle = startAngle + i * angleStep
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.lineTo(
        centerX + Math.cos(angle) * radius,
        centerY + Math.sin(angle) * radius
      )
      ctx.stroke()
    }

    // 绘制数据区域 - 带渐变
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius)
    gradient.addColorStop(0, 'rgba(168, 213, 186, 0.3)')
    gradient.addColorStop(1, 'rgba(168, 213, 186, 0.1)')

    ctx.beginPath()
    for (let i = 0; i <= data.length; i++) {
      const index = i % data.length
      const angle = startAngle + index * angleStep
      const value = data[index].value / 100
      const x = centerX + Math.cos(angle) * radius * value
      const y = centerY + Math.sin(angle) * radius * value
      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }
    ctx.fillStyle = gradient
    ctx.fill()

    // 绘制数据边框
    ctx.beginPath()
    for (let i = 0; i <= data.length; i++) {
      const index = i % data.length
      const angle = startAngle + index * angleStep
      const value = data[index].value / 100
      const x = centerX + Math.cos(angle) * radius * value
      const y = centerY + Math.sin(angle) * radius * value
      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }
    ctx.strokeStyle = '#A8D5BA'
    ctx.lineWidth = 2
    ctx.stroke()

    // 绘制数据点
    for (let i = 0; i < data.length; i++) {
      const angle = startAngle + i * angleStep
      const value = data[i].value / 100
      const x = centerX + Math.cos(angle) * radius * value
      const y = centerY + Math.sin(angle) * radius * value
      
      ctx.beginPath()
      ctx.arc(x, y, 6, 0, Math.PI * 2)
      ctx.fillStyle = '#A8D5BA'
      ctx.fill()
      ctx.strokeStyle = '#FFFFFF'
      ctx.lineWidth = 2
      ctx.stroke()
    }

    // 绘制标签
    ctx.font = '14px system-ui'
    ctx.fillStyle = '#4A3728'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    for (let i = 0; i < data.length; i++) {
      const angle = startAngle + i * angleStep
      const labelRadius = radius + 25
      const x = centerX + Math.cos(angle) * labelRadius
      const y = centerY + Math.sin(angle) * labelRadius
      ctx.fillText(data[i].label, x, y)
    }
  }, [results])

  // 计算综合评分
  const overallScore = Math.round(
    (results.pitchAccuracy + 
     results.intervalRecognition + 
     results.rhythmSense + 
     results.vocalRange + 
     results.tonalMemory) / 5
  )

  // 获取评价
  const getEvaluation = (score: number) => {
    if (score >= 80) return { text: '音乐天才', color: '#A8D5BA' }
    if (score >= 60) return { text: '潜力无限', color: '#B4C7E8' }
    if (score >= 40) return { text: '稳步成长', color: '#E8B4A0' }
    return { text: '新手起步', color: '#E8B4D4' }
  }

  const evaluation = getEvaluation(overallScore)

  // 获取建议
  const getSuggestions = () => {
    const suggestions = []
    if (results.pitchAccuracy < 60) {
      suggestions.push({ icon: Target, text: '建议从单音模唱开始，打好音准基础' })
    }
    if (results.rhythmSense < 60) {
      suggestions.push({ icon: Music, text: '节奏感需要加强，多练习节拍训练' })
    }
    if (results.vocalRange < 50) {
      suggestions.push({ icon: TrendingUp, text: '音域较窄，通过练习可以逐步拓展' })
    }
    if (suggestions.length === 0) {
      suggestions.push({ icon: Sparkles, text: '基础不错！可以尝试更有挑战的练习' })
    }
    return suggestions
  }

  return (
    <div className="min-h-screen bg-[#FDF8F3] flex flex-col">
      {/* 头部 */}
      <div className="px-6 pt-12 pb-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl font-bold text-[#4A3728] mb-2">评估报告</h1>
          <p className="text-[#8B7355]">你的音乐能力分析</p>
        </motion.div>
      </div>

      {/* 雷达图 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex justify-center mb-6"
      >
        <div className="relative">
          <canvas ref={canvasRef} />
          {/* 中心评分 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl font-bold text-[#4A3728]">{overallScore}</div>
              <div className="text-xs text-[#8B7355]">综合评分</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 评价标签 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="flex justify-center mb-8"
      >
        <div 
          className="px-6 py-2 rounded-full text-white font-medium"
          style={{ backgroundColor: evaluation.color }}
        >
          {evaluation.text}
        </div>
      </motion.div>

      {/* 详细数据 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="px-6 mb-6"
      >
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
          {[
            { label: '音准能力', value: results.pitchAccuracy, color: '#A8D5BA' },
            { label: '音程识别', value: results.intervalRecognition, color: '#B4C7E8' },
            { label: '节奏感', value: results.rhythmSense, color: '#E8B4D4' },
            { label: '音域宽度', value: results.vocalRange, color: '#D4B4E8' },
            { label: '音调记忆', value: results.tonalMemory, color: '#E8D4A0' },
          ].map((item, index) => (
            <div key={item.label} className="flex items-center gap-3">
              <span className="text-sm text-[#8B7355] w-16">{item.label}</span>
              <div className="flex-1 h-2 bg-[#F5EDE8] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.value}%` }}
                  transition={{ duration: 0.8, delay: 0.5 + index * 0.1 }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: item.color }}
                />
              </div>
              <span className="text-sm font-medium text-[#4A3728] w-8 text-right">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* 建议 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="px-6 mb-8"
      >
        <h3 className="text-lg font-semibold text-[#4A3728] mb-3">学习建议</h3>
        <div className="space-y-2">
          {getSuggestions().map((suggestion, i) => (
            <div key={i} className="flex items-center gap-3 bg-white/60 rounded-xl px-4 py-3">
              <suggestion.icon className="w-5 h-5 text-[#E8B4A0]" />
              <span className="text-sm text-[#4A3728]">{suggestion.text}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* 底部按钮 */}
      <div className="px-6 pb-8 mt-auto">
        <Button
          onClick={onStart}
          className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#E8B4A0] to-[#D4A088] hover:opacity-90 text-white font-medium text-lg shadow-lg"
        >
          <Sparkles className="w-5 h-5 mr-2" />
          开始我的音乐之旅
        </Button>
      </div>
    </div>
  )
}
