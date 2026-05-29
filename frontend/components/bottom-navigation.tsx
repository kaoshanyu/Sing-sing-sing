"use client"

import { useGame } from "@/lib/game-context"
import { cn } from "@/lib/utils"
import { BookOpen, Music2, Mic2, User, Sparkles } from "lucide-react"

const tabs = [
  {
    id: 'tutorial' as const,
    label: '教程',
    icon: BookOpen,
    description: '唱准音闯关',
  },
  {
    id: 'theory' as const,
    label: '乐理',
    icon: Music2,
    description: '音乐基础知识',
  },
  {
    id: 'ai' as const,
    label: 'AI导师',
    icon: Mic2,
    description: '智能语音指导',
  },
  {
    id: 'ai-song' as const,
    label: 'AI唱',
    icon: Sparkles,
    description: 'AI音色领唱',
  },
  {
    id: 'home' as const,
    label: '我的',
    icon: User,
    description: '个人中心',
  },
]

export function BottomNavigation() {
  const { currentTab, setCurrentTab } = useGame()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      {/* Glass effect background */}
      <div className="glass-card border-t border-border/50 safe-area-inset-bottom">
        <div className="flex items-center justify-around px-2 pt-2 pb-6">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = currentTab === tab.id
            
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                className={cn(
                  "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-300",
                  isActive 
                    ? "bg-primary/10" 
                    : "hover:bg-secondary/50"
                )}
              >
                <div
                  className={cn(
                    "relative p-2 rounded-xl transition-all duration-300",
                    isActive 
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" 
                      : "text-muted-foreground"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {isActive && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-full" />
                  )}
                </div>
                <span
                  className={cn(
                    "text-xs font-medium transition-colors",
                    isActive ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {tab.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
