"use client"

import { useState, useRef, useEffect } from "react"
import { Mic, MicOff, Sparkles, MessageCircle, Send } from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

// AI宠物形态
function AIPet({ isListening, isSpeaking }: { isListening: boolean; isSpeaking: boolean }) {
  return (
    <div className="relative inline-flex">
      {/* Glow effect */}
      <div
        className={cn(
          "absolute inset-0 rounded-full blur-lg transition-all duration-500",
          isListening ? "bg-primary/40 scale-110" : "bg-primary/20 scale-100"
        )}
      />

      {/* Main body */}
      <div
        className={cn(
          "relative w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/60",
          "flex items-center justify-center",
          "shadow-lg shadow-primary/30"
        )}
      >
        {/* Face */}
        <div className="relative w-full h-full flex items-center justify-center scale-[0.4] origin-center">
          {/* Eyes */}
          <div className="absolute top-1/3 flex gap-6">
            <div
              className={cn(
                "w-4 h-4 bg-card rounded-full transition-all duration-300",
                isSpeaking && "animate-pulse"
              )}
            >
              <div className="w-2 h-2 bg-foreground rounded-full mt-1 ml-1" />
            </div>
            <div
              className={cn(
                "w-4 h-4 bg-card rounded-full transition-all duration-300",
                isSpeaking && "animate-pulse"
              )}
            >
              <div className="w-2 h-2 bg-foreground rounded-full mt-1 ml-1" />
            </div>
          </div>

          {/* Mouth */}
          <div
            className={cn(
              "absolute top-1/2 mt-2 w-8 h-3 bg-card rounded-full transition-all",
              isSpeaking && "h-5 rounded-lg animate-pulse"
            )}
          />

          {/* Blush */}
          <div className="absolute top-1/2 -translate-y-1 flex gap-14">
            <div className="w-5 h-3 bg-[#E8B4D4]/50 rounded-full" />
            <div className="w-5 h-3 bg-[#E8B4D4]/50 rounded-full" />
          </div>
        </div>
      </div>

      {/* Sparkles when active - smaller */}
      {(isListening || isSpeaking) && (
        <>
          <Sparkles
            className="absolute -top-1 -right-1 w-4 h-4 text-[var(--star-gold)] animate-pulse"
          />
          <Sparkles
            className="absolute -bottom-0.5 -left-2 w-3 h-3 text-accent animate-pulse"
            style={{ animationDelay: '0.5s' }}
          />
        </>
      )}
    </div>
  )
}

// 建议卡片
const SUGGESTIONS = [
  { icon: '🎵', text: '我唱歌总是跑调怎么办？' },
  { icon: '🎤', text: '如何找到自己的音域？' },
  { icon: '📚', text: '什么是音准？' },
  { icon: '🎹', text: '教我认识五线谱' },
]

export function AIMentorTab() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '你好！我是你的AI音乐导师。长按下方的麦克风按钮和我说话，或者直接输入文字问我任何音乐相关的问题吧！',
      timestamp: new Date(),
    },
  ])
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [inputText, setInputText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null)

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 模拟AI回复
  const simulateResponse = (userMessage: string) => {
    setIsSpeaking(true)
    
    // 模拟延迟
    setTimeout(() => {
      let response = ''
      
      if (userMessage.includes('跑调') || userMessage.includes('音准')) {
        response = '跑调是很常见的问题！首先要训练你的耳朵，多听多练。建议从单音开始，先学会听准一个音，再逐渐增加难度。你可以去"唱准音练习"模块进行系统训练。'
      } else if (userMessage.includes('音域')) {
        response = '找到自己的音域需要做一个简单的测试：从中央C开始，向上和向下唱音阶，记录你能舒适唱出的最高音和最低音。一般来说，正常说话的音高附近是你最舒适的演唱区域。'
      } else if (userMessage.includes('五线谱')) {
        response = '五线谱是记录音乐的一种方式。五条线从下往上依次是第一线到第五线，音符在线上或线间表示不同的音高。你可以去乐理模块学习更详细的内容！'
      } else {
        response = '这是一个很好的问题！音乐学习需要循序渐进，建议你先完成唱准音的基础训练，这样对后续的学习会有很大帮助。有什么具体的问题都可以问我哦！'
      }

      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      }])
      
      setIsSpeaking(false)
    }, 1500)
  }

  // 处理用户消息
  const handleSend = (text: string) => {
    if (!text.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInputText('')
    simulateResponse(text)
  }

  // 长按开始录音
  const handlePressStart = () => {
    pressTimerRef.current = setTimeout(() => {
      setIsListening(true)
      // 实际应用中这里会启动语音识别
    }, 200)
  }

  // 松开停止录音
  const handlePressEnd = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current)
    }
    
    if (isListening) {
      setIsListening(false)
      // 模拟语音识别结果
      setTimeout(() => {
        handleSend('我想问一下关于音准的问题')
      }, 500)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header + Pet inline */}
      <div className="flex items-center gap-4 px-4 pt-4 pb-2">
        <div className="flex-shrink-0">
          <AIPet isListening={isListening} isSpeaking={isSpeaking} />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-foreground">AI导师</h1>
          <p className="text-muted-foreground text-xs">
            你的私人音乐教练，随时为你解答
          </p>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-4 pb-2">
        {/* Messages */}
        <div className="space-y-3">
          {messages.map(message => (
            <div
              key={message.id}
              className={cn(
                "flex",
                message.role === 'user' ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-2.5",
                  message.role === 'user'
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-secondary text-foreground rounded-bl-md"
                )}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
                <p className="text-xs opacity-60 mt-1">
                  {message.timestamp.toLocaleTimeString('zh-CN', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions */}
        {messages.length <= 2 && (
          <div className="flex flex-wrap gap-2 pb-3">
            {SUGGESTIONS.map((suggestion, i) => (
              <button
                key={i}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary hover:bg-secondary/80 transition-colors text-xs text-muted-foreground"
                onClick={() => handleSend(suggestion.text)}
              >
                <span>{suggestion.icon}</span>
                <span>{suggestion.text}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="p-3 pb-20 glass-card border-t">
        <div className="flex items-center gap-3">
          {/* Text input */}
          <div className="flex-1 flex items-center gap-2 bg-secondary rounded-full px-4 py-2">
            <MessageCircle className="w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend(inputText)}
              placeholder="输入问题..."
              className="flex-1 bg-transparent text-sm outline-none"
            />
            {inputText && (
              <button onClick={() => handleSend(inputText)}>
                <Send className="w-4 h-4 text-primary" />
              </button>
            )}
          </div>

          {/* Voice button */}
          <button
            onMouseDown={handlePressStart}
            onMouseUp={handlePressEnd}
            onMouseLeave={handlePressEnd}
            onTouchStart={handlePressStart}
            onTouchEnd={handlePressEnd}
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center transition-all",
              isListening 
                ? "bg-destructive scale-110 shadow-lg shadow-destructive/30" 
                : "bg-primary hover:scale-105"
            )}
          >
            {isListening ? (
              <MicOff className="w-5 h-5 text-destructive-foreground" />
            ) : (
              <Mic className="w-5 h-5 text-primary-foreground" />
            )}
          </button>
        </div>

        <p className="text-xs text-center text-muted-foreground mt-2">
          长按麦克风开始语音输入
        </p>
      </div>
    </div>
  )
}
