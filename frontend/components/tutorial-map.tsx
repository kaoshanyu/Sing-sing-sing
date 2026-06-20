"use client"

import { useState, useCallback } from "react"
import { LevelConfig, useGame, LEVEL_CONFIG } from "@/lib/game-context"
import { Ear, Music, Timer, Mic, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { TutorialPractice } from "./tutorial-practice"
import { SessionEntry } from "./session-entry"
import { SessionComplete } from "./session-complete"
import type { ModuleLevel } from "./session-entry"
import { finishSession, type UserModuleState, type SessionResult, type Level } from "@/lib/question-engine"

// 教程模块配置
interface TutorialModule {
  id: string
  title: string
  subtitle: string
  icon: React.ElementType
  iconBgColor: string
  iconColor: string
}

const TUTORIAL_MODULES: TutorialModule[] = [
  {
    id: 'pitch-recognition',
    title: '音高听辩',
    subtitle: '训练你对音高的感知能力',
    icon: Ear,
    iconBgColor: '#FFE4D6',
    iconColor: '#E8956A',
  },
  {
    id: 'interval-dictation',
    title: '音程听写',
    subtitle: '辨别音与音之间的距离',
    icon: Music,
    iconBgColor: '#D6F5E6',
    iconColor: '#5AB88A',
  },
  {
    id: 'rhythm-training',
    title: '节奏训练',
    subtitle: '掌握稳定的节奏感',
    icon: Timer,
    iconBgColor: '#F5EDE8',
    iconColor: '#B88B6A',
  },
  {
    id: 'listen-and-sing',
    title: '听音跟唱',
    subtitle: '听准再唱，AI帮你纠正',
    icon: Mic,
    iconBgColor: '#FFE4EC',
    iconColor: '#E87FA0',
  },
  {
    id: 'ai-song-learning',
    title: 'AI+音色整曲学习',
    subtitle: 'AI教练陪你练好整首歌',
    icon: Sparkles,
    iconBgColor: '#E4F4FF',
    iconColor: '#5AAAE8',
  },
]

// 模块进度数据（模拟）
interface ModuleProgress {
  percentage: number
  level: number
}

// 教程模块ID → 闯关引擎模块ID 映射
const MODULE_ID_MAP: Record<string, "pitch" | "interval" | "sing"> = {
  'pitch-recognition': 'pitch',
  'interval-dictation': 'interval',
  'listen-and-sing': 'sing',
}

const STORAGE_KEY_PREFIX = 'module-level-state-'

function loadModuleState(moduleId: string): UserModuleState {
  if (typeof window === 'undefined') {
    return { moduleId: MODULE_ID_MAP[moduleId] || 'pitch', currentLevel: 'L1', points: 0, masteredLevels: [], recentQuestionIds: [] }
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + moduleId)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { moduleId: MODULE_ID_MAP[moduleId] || 'pitch', currentLevel: 'L1', points: 0, masteredLevels: [], recentQuestionIds: [] }
}

function saveModuleState(moduleId: string, state: UserModuleState) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + moduleId, JSON.stringify(state))
  } catch {}
}

interface TutorialMapProps {
  onStartLevel: (level: LevelConfig) => void
  onOpenRhythmTraining?: () => void
}

export function TutorialMap({ onStartLevel, onOpenRhythmTraining }: TutorialMapProps) {
  const { progress, setCurrentTab } = useGame()

  // Session flow state
  const [sessionStep, setSessionStep] = useState<'list' | 'entry' | 'practice' | 'complete'>('list')
  const [activeModule, setActiveModule] = useState<TutorialModule | null>(null)
  const [moduleLevelState, setModuleLevelState] = useState<UserModuleState | null>(null)
  const [sessionResult, setSessionResult] = useState<SessionResult | null>(null)
  const [practiceStats, setPracticeStats] = useState<{ correctCount: number; totalCount: number } | null>(null)

  // 各模块的进度数据
  const getModuleProgress = (moduleId: string): ModuleProgress => {
    // Use localStorage level state for module progress
    if (['pitch-recognition', 'interval-dictation', 'listen-and-sing'].includes(moduleId)) {
      const state = loadModuleState(moduleId)
      const levelNum = LEVEL_CONFIG.LEVEL_NUM[state.currentLevel] || 1
      // 等级内进度：根据积分估算当前等级内的完成度
      const inLevelPoints = Math.max(0, Math.min(LEVEL_CONFIG.RANGES[state.currentLevel] || 250, state.points - (LEVEL_CONFIG.STARTS[state.currentLevel] || 0)))
      const percentage = Math.min(100, Math.round((inLevelPoints / (LEVEL_CONFIG.RANGES[state.currentLevel] || 250)) * 100))
      return { percentage, level: levelNum }
    }
    switch (moduleId) {
      case 'rhythm-training':
        return { percentage: Math.min(100, Math.floor((progress.chapters[3]?.totalStars || 0) / 12 * 100)), level: 1 }
      case 'ai-song-learning':
        return { percentage: Math.min(100, Math.floor((progress.chapters[5]?.totalStars || 0) / 15 * 100)), level: 1 }
      default:
        return { percentage: 0, level: 1 }
    }
  }

  // 处理模块点击
  const handleModuleClick = (module: TutorialModule) => {
    if (['pitch-recognition', 'interval-dictation', 'listen-and-sing'].includes(module.id)) {
      setActiveModule(module)
      const state = loadModuleState(module.id)
      setModuleLevelState(state)
      setSessionStep('entry')
    } else if (module.id === 'rhythm-training') {
      onOpenRhythmTraining?.()
    } else if (module.id === 'ai-song-learning') {
      setCurrentTab('ai-song')
    } else {
      const levelConfig: LevelConfig = {
        id: `5-practice`,
        chapterId: 5,
        levelNumber: 1,
        title: module.title,
        description: module.subtitle,
        difficulty: 'medium',
        targetAccuracy: 80,
        minAccuracy: 60,
        exerciseCount: 20,
      }
      onStartLevel(levelConfig)
    }
  }

  // 进入练习
  const handleStartPractice = () => {
    setSessionStep('practice')
  }

  // 练习完成回调
  const handlePracticeComplete = useCallback((_stars: number, _accuracy: number, correctCount?: number, totalCount?: number) => {
    if (!activeModule || !moduleLevelState) return
    const total = totalCount || 20
    const correct = correctCount ?? Math.round((_accuracy / 100) * total)

    // 记录练习会话到 localStorage（供今日练习统计使用）
    try {
      const log = JSON.parse(localStorage.getItem('practice_session_log') || '[]')
      log.push({
        date: new Date().toISOString().slice(0, 10),
        moduleId: activeModule.id,
        duration: 120,
        correctCount: correct,
        totalCount: total,
      })
      localStorage.setItem('practice_session_log', JSON.stringify(log))
    } catch {} // eslint-disable-line no-empty

    // Build answer records for the question engine
    const records = Array.from({ length: total }, (_, i) => ({
      questionId: `q${i}`,
      isCorrect: i < correct,
    }))

    // Compute session result using question engine
    const result = finishSession(moduleLevelState, records)
    setSessionResult(result)
    setPracticeStats({ correctCount: correct, totalCount: total })

    // Save updated state to localStorage
    const updatedState: UserModuleState = {
      ...moduleLevelState,
      currentLevel: result.nextLevel,
      points: moduleLevelState.points + result.pointsEarned,
      masteredLevels: result.nextLevel === 'L3' && !result.shouldDemote && records.filter(r => r.isCorrect).length / records.length >= 0.85
        ? moduleLevelState.masteredLevels.includes('L3' as Level)
          ? moduleLevelState.masteredLevels
          : [...moduleLevelState.masteredLevels, 'L3' as Level]
        : moduleLevelState.masteredLevels,
    }
    setModuleLevelState(updatedState)
    saveModuleState(activeModule.id, updatedState)

    setSessionStep('complete')
  }, [activeModule, moduleLevelState])

  // 重试（回到入场页）
  const handleRetry = () => {
    if (activeModule) {
      const state = loadModuleState(activeModule.id)
      setModuleLevelState(state)
    }
    setSessionResult(null)
    setPracticeStats(null)
    setSessionStep('entry')
  }

  // 继续（返回列表）
  const handleContinue = () => {
    setActiveModule(null)
    setModuleLevelState(null)
    setSessionResult(null)
    setPracticeStats(null)
    setSessionStep('list')
  }

  // 取消（从入场页返回列表）
  const handleBackToList = () => {
    setActiveModule(null)
    setModuleLevelState(null)
    setSessionStep('list')
  }

  // ===== Render session flow =====
  if (sessionStep === 'entry' && activeModule && moduleLevelState) {
    return (
      <SessionEntry
        moduleTitle={activeModule.title}
        moduleColor={activeModule.iconColor}
        currentLevel={moduleLevelState.currentLevel as ModuleLevel}
        points={moduleLevelState.points}
        streak={progress.streak}
        masteredLevels={moduleLevelState.masteredLevels as ModuleLevel[]}
        onStart={handleStartPractice}
        onBack={handleBackToList}
      />
    )
  }

  if (sessionStep === 'practice' && activeModule) {
    return (
      <TutorialPractice
        moduleId={activeModule.id}
        moduleTitle={activeModule.title}
        moduleSubtitle={activeModule.subtitle}
        moduleColor={activeModule.iconColor}
        onComplete={handlePracticeComplete}
        onExit={handleBackToList}
        useSessionComplete={true}
      />
    )
  }

  if (sessionStep === 'complete' && activeModule && sessionResult && practiceStats) {
    const isMastered = moduleLevelState?.masteredLevels.includes('L3' as Level) ?? false
    return (
      <SessionComplete
        moduleTitle={activeModule.title}
        moduleColor={activeModule.iconColor}
        accuracy={sessionResult.accuracy}
        correctCount={practiceStats.correctCount}
        totalCount={practiceStats.totalCount}
        pointsEarned={sessionResult.pointsEarned}
        currentLevel={moduleLevelState?.currentLevel as ModuleLevel || 'L1'}
        nextLevel={sessionResult.nextLevel as ModuleLevel}
        shouldPromote={sessionResult.shouldPromote}
        shouldDemote={sessionResult.shouldDemote}
        isMastered={isMastered}
        onRetry={handleRetry}
        onContinue={handleContinue}
      />
    )
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* 顶部导航栏 */}
      <div className="px-4 pt-6 pb-4 border-b border-border/50">
        <h1 className="text-xl font-bold text-center text-foreground">唱歌教程</h1>
      </div>

      {/* 模块卡片列表 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        <div className="space-y-3">
          {TUTORIAL_MODULES.map((module) => {
            const moduleProgress = getModuleProgress(module.id)
            const IconComponent = module.icon

            return (
              <button
                key={module.id}
                onClick={() => handleModuleClick(module)}
                className={cn(
                  "w-full p-4 rounded-2xl bg-card border border-border/50",
                  "flex flex-col gap-3",
                  "transition-all duration-200",
                  "hover:shadow-md hover:border-border active:scale-[0.98]"
                )}
              >
                {/* 上方：图标 + 标题副标题 */}
                <div className="flex items-center gap-3 w-full">
                  {/* 图标 */}
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: module.iconBgColor }}
                  >
                    <IconComponent 
                      className="w-5 h-5" 
                      style={{ color: module.iconColor }}
                    />
                  </div>

                  {/* 标题和副标题 */}
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold text-foreground text-base">
                      {module.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-0.5 leading-snug">
                      {module.subtitle}
                    </p>
                  </div>
                </div>

                {/* 下方：横向进度条 + 等级 */}
                <div className="flex items-center gap-3 w-full">
                  <div className="flex-1">
                    <div 
                      className="h-2 rounded-full overflow-hidden"
                      style={{ backgroundColor: `${module.iconColor}20` }}
                    >
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${moduleProgress.percentage}%`,
                          backgroundColor: module.iconColor 
                        }}
                      />
                    </div>
                  </div>
                  <span 
                    className="text-xs font-medium shrink-0"
                    style={{ color: module.iconColor }}
                  >
                    {moduleProgress.percentage}%
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    Lv.{moduleProgress.level}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
