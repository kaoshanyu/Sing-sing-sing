"use client"

import { useRef, useEffect, useCallback, useState } from "react"
import { cn } from "@/lib/utils"

interface PitchPoint {
  time: number
  pitch: number // MIDI note number (0-127)
  isTarget?: boolean
}

interface PitchVisualizerProps {
  targetPitches: PitchPoint[]
  userPitches: PitchPoint[]
  isRecording: boolean
  duration: number // 总时长(毫秒)
  className?: string
  chapterColor?: string
}

// 将MIDI音符号转为频率
function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12)
}

// 音符名称
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

function midiToNoteName(midi: number): string {
  const octave = Math.floor(midi / 12) - 1
  const note = NOTE_NAMES[midi % 12]
  return `${note}${octave}`
}

export function PitchVisualizer({
  targetPitches,
  userPitches,
  isRecording,
  duration,
  className,
  chapterColor = "#E8B4A0",
}: PitchVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const [currentTime, setCurrentTime] = useState(0)

  // 计算音高范围
  const allPitches = [...targetPitches, ...userPitches].map(p => p.pitch)
  const minPitch = Math.min(...allPitches, 48) - 2 // 留出边距
  const maxPitch = Math.max(...allPitches, 72) + 2

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const width = rect.width
    const height = rect.height
    const padding = { top: 20, bottom: 30, left: 40, right: 20 }
    const chartWidth = width - padding.left - padding.right
    const chartHeight = height - padding.top - padding.bottom

    // 清除画布
    ctx.clearRect(0, 0, width, height)

    // 绘制背景网格
    ctx.strokeStyle = 'rgba(232, 180, 160, 0.1)'
    ctx.lineWidth = 1

    // 水平网格线（音高）
    const pitchRange = maxPitch - minPitch
    for (let i = 0; i <= pitchRange; i += 2) {
      const y = padding.top + (1 - i / pitchRange) * chartHeight
      ctx.beginPath()
      ctx.moveTo(padding.left, y)
      ctx.lineTo(width - padding.right, y)
      ctx.stroke()

      // 音符标签
      const midi = minPitch + i
      if (midi % 12 === 0 || midi % 12 === 4 || midi % 12 === 7) { // C, E, G
        ctx.fillStyle = '#8B7355'
        ctx.font = '10px sans-serif'
        ctx.textAlign = 'right'
        ctx.fillText(midiToNoteName(midi), padding.left - 5, y + 3)
      }
    }

    // 垂直网格线（时间）
    const timeSteps = 4
    for (let i = 0; i <= timeSteps; i++) {
      const x = padding.left + (i / timeSteps) * chartWidth
      ctx.beginPath()
      ctx.moveTo(x, padding.top)
      ctx.lineTo(x, height - padding.bottom)
      ctx.stroke()
    }

    // 坐标转换函数
    const pitchToY = (pitch: number) => {
      return padding.top + (1 - (pitch - minPitch) / pitchRange) * chartHeight
    }

    const timeToX = (time: number) => {
      return padding.left + (time / duration) * chartWidth
    }

    // 绘制目标音高线
    if (targetPitches.length > 0) {
      ctx.strokeStyle = chapterColor
      ctx.lineWidth = 4
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.setLineDash([])

      ctx.beginPath()
      targetPitches.forEach((point, i) => {
        const x = timeToX(point.time)
        const y = pitchToY(point.pitch)
        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })
      ctx.stroke()

      // 目标点标记
      targetPitches.forEach(point => {
        const x = timeToX(point.time)
        const y = pitchToY(point.pitch)
        
        ctx.beginPath()
        ctx.arc(x, y, 6, 0, Math.PI * 2)
        ctx.fillStyle = chapterColor
        ctx.fill()
        ctx.strokeStyle = '#FFFFFF'
        ctx.lineWidth = 2
        ctx.stroke()
      })
    }

    // 绘制用户音高线
    if (userPitches.length > 0) {
      // 计算与目标的偏差并着色
      ctx.lineWidth = 3
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      for (let i = 1; i < userPitches.length; i++) {
        const prev = userPitches[i - 1]
        const curr = userPitches[i]

        // 找到对应时间的目标音高
        const targetPitch = targetPitches.find(t => 
          Math.abs(t.time - curr.time) < 100
        )?.pitch

        // 根据偏差计算颜色
        let color = '#A8D5BA' // 绿色：准确
        if (targetPitch) {
          const diff = Math.abs(curr.pitch - targetPitch)
          if (diff > 2) {
            color = '#E8A0A0' // 红色：偏差大
          } else if (diff > 0.5) {
            color = '#E8D4A0' // 黄色：略有偏差
          }
        }

        ctx.strokeStyle = color
        ctx.beginPath()
        ctx.moveTo(timeToX(prev.time), pitchToY(prev.pitch))
        ctx.lineTo(timeToX(curr.time), pitchToY(curr.pitch))
        ctx.stroke()
      }

      // 用户当前点
      if (userPitches.length > 0) {
        const lastPoint = userPitches[userPitches.length - 1]
        const x = timeToX(lastPoint.time)
        const y = pitchToY(lastPoint.pitch)

        // 发光效果
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, 15)
        gradient.addColorStop(0, 'rgba(168, 213, 186, 0.8)')
        gradient.addColorStop(1, 'rgba(168, 213, 186, 0)')
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(x, y, 15, 0, Math.PI * 2)
        ctx.fill()

        // 中心点
        ctx.beginPath()
        ctx.arc(x, y, 5, 0, Math.PI * 2)
        ctx.fillStyle = '#A8D5BA'
        ctx.fill()
      }
    }

    // 绘制时间指示器
    if (isRecording && currentTime > 0) {
      const x = timeToX(currentTime)
      ctx.strokeStyle = 'rgba(74, 55, 40, 0.3)'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.moveTo(x, padding.top)
      ctx.lineTo(x, height - padding.bottom)
      ctx.stroke()
      ctx.setLineDash([])
    }

  }, [targetPitches, userPitches, isRecording, duration, currentTime, minPitch, maxPitch, chapterColor])

  // 动画循环
  useEffect(() => {
    const animate = () => {
      draw()
      animationRef.current = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [draw])

  // 录制时更新时间
  useEffect(() => {
    if (isRecording) {
      const startTime = Date.now()
      const interval = setInterval(() => {
        setCurrentTime(Date.now() - startTime)
      }, 50)
      return () => clearInterval(interval)
    } else {
      setCurrentTime(0)
    }
  }, [isRecording])

  return (
    <div className={cn("relative", className)}>
      <canvas
        ref={canvasRef}
        className="w-full h-full pitch-canvas"
        style={{ touchAction: 'none' }}
      />
      
      {/* 图例 */}
      <div className="absolute bottom-2 right-2 flex items-center gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: chapterColor }}
          />
          <span>目标</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-[#A8D5BA]" />
          <span>准确</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-[#E8D4A0]" />
          <span>偏差</span>
        </div>
      </div>
    </div>
  )
}
