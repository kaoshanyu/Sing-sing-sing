"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { apiLogin, apiRegister, apiSaveQuestionnaire, apiSaveVocalRange, apiResetProgress, apiGetUser } from './api'

// 章节配置
export const CHAPTERS = [
  {
    id: 1,
    title: "听音判高低",
    subtitle: "辨别音高的第一步",
    description: "听两个音，判断哪个更高",
    color: "#FFD4A3",
    levels: 3,
    requiredStars: 5, // 9星满，需要5星通关
    totalStars: 9,
  },
  {
    id: 2,
    title: "选择音符",
    subtitle: "建立音符认知",
    description: "听单音，选择对应的音符",
    color: "#A8D5BA",
    levels: 3,
    requiredStars: 6,
    totalStars: 9,
  },
  {
    id: 3,
    title: "单音模唱",
    subtitle: "开始发声练习",
    description: "听单音并模唱，匹配音高线",
    color: "#B4C7E8",
    levels: 4,
    requiredStars: 8,
    totalStars: 12,
  },
  {
    id: 4,
    title: "双音模唱",
    subtitle: "两音连贯演唱",
    description: "连续模唱两个音符",
    color: "#E8B4D4",
    levels: 4,
    requiredStars: 9,
    totalStars: 12,
  },
  {
    id: 5,
    title: "多音模唱",
    subtitle: "三音及以上挑战",
    description: "模唱多个连续音符",
    color: "#D4B4E8",
    levels: 5,
    requiredStars: 11,
    totalStars: 15,
  },
  {
    id: 6,
    title: "音阶模唱",
    subtitle: "完整音阶演练",
    description: "模唱完整音阶",
    color: "#E8D4A0",
    levels: 4,
    requiredStars: 10,
    totalStars: 12,
  },
  {
    id: 7,
    title: "歌词乐句",
    subtitle: "代入歌词演唱",
    description: "将学到的技能应用到歌词",
    color: "#A8E8D5",
    levels: 5,
    requiredStars: 12,
    totalStars: 15,
  },
] as const

// 关卡配置生成
export interface LevelConfig {
  id: string
  chapterId: number
  levelNumber: number
  title: string
  description: string
  difficulty: 'easy' | 'medium' | 'hard'
  targetAccuracy: number // 达到3星需要的准确率
  minAccuracy: number // 达到1星需要的准确率
  exerciseCount: number // 练习题数量
}

export function generateLevelConfig(chapterId: number, levelNumber: number): LevelConfig {
  const chapter = CHAPTERS.find(c => c.id === chapterId)
  if (!chapter) throw new Error(`Chapter ${chapterId} not found`)
  
  const totalLevels = chapter.levels
  const difficultyRatio = levelNumber / totalLevels
  
  let difficulty: 'easy' | 'medium' | 'hard' = 'easy'
  if (difficultyRatio > 0.66) difficulty = 'hard'
  else if (difficultyRatio > 0.33) difficulty = 'medium'
  
  // 随着章节推进，准确率要求逐渐提高
  const baseAccuracy = 60 + (chapterId - 1) * 3
  const targetAccuracy = Math.min(95, baseAccuracy + 20 + (levelNumber - 1) * 5)
  const minAccuracy = Math.min(80, baseAccuracy + (levelNumber - 1) * 3)
  
  // 练习题数量
  const exerciseCount = 5 + Math.floor((chapterId - 1) / 2) + Math.floor((levelNumber - 1) / 2)
  
  return {
    id: `${chapterId}-${levelNumber}`,
    chapterId,
    levelNumber,
    title: `第${levelNumber}关`,
    description: getLevelDescription(chapterId, levelNumber, difficulty),
    difficulty,
    targetAccuracy,
    minAccuracy,
    exerciseCount,
  }
}

function getLevelDescription(chapterId: number, level: number, difficulty: string): string {
  const descriptions: Record<number, string[]> = {
    1: ["相邻音高辨别", "跨度音高辨别", "快速音高判断"],
    2: ["基础音符识别", "相近音符区分", "全音域音符选择"],
    3: ["基础单音模唱", "中音区模唱", "全音域单音模唱", "挑战关"],
    4: ["相邻双音模唱", "跳跃双音模唱", "复杂双音模唱", "挑战关"],
    5: ["三音模唱", "四音模唱", "五音模唱", "六音模唱", "综合挑战"],
    6: ["大调音阶", "小调音阶", "五声音阶", "综合音阶"],
    7: ["简单歌词", "中等歌词", "复杂乐句", "情感演绎", "完整段落"],
  }
  
  return descriptions[chapterId]?.[level - 1] || `${difficulty}难度`
}

// 用户进度数据
export interface LevelProgress {
  stars: number // 0-3
  highScore: number
  attempts: number
  completed: boolean
  lastAttempt?: Date
}

export interface ChapterProgress {
  totalStars: number
  unlocked: boolean
  completed: boolean
  levels: Record<string, LevelProgress>
}

export interface UserProgress {
  currentChapter: number
  currentLevel: number
  chapters: Record<number, ChapterProgress>
  totalStars: number
  streak: number // 连续正确次数
  practiceHistory: PracticeRecord[]
}

export interface PracticeRecord {
  timestamp: Date
  chapterId: number
  levelId: string
  accuracy: number
  stars: number
  path: string // 练习路径记录，如 "单音(6次)→双音(3次出错)→返回"
}

// 评估结果
export interface AssessmentResults {
  pitchAccuracy: number
  intervalRecognition: number
  rhythmSense: number
  vocalRange: number
  tonalMemory: number
}

// 用户资料
export interface UserProfile {
  isLoggedIn: boolean
  hasCompletedOnboarding: boolean
  questionnaireAnswers: Record<string, string | string[]> | null
  assessmentResults: AssessmentResults | null
  gender?: 'male' | 'female'
  vocalRange?: {
    lowest: string
    highest: string
  }
}

// 初始进度
const initialProgress: UserProgress = {
  currentChapter: 1,
  currentLevel: 1,
  chapters: {
    1: {
      totalStars: 0,
      unlocked: true,
      completed: false,
      levels: {},
    },
  },
  totalStars: 0,
  streak: 0,
  practiceHistory: [],
}

// 初始用户资料
const initialProfile: UserProfile = {
  isLoggedIn: false,
  hasCompletedOnboarding: false,
  questionnaireAnswers: null,
  assessmentResults: null,
}

// Context
interface GameContextType {
  progress: UserProgress
  profile: UserProfile
  currentTab: 'tutorial' | 'theory' | 'ai' | 'home' | 'ai-song'
  setCurrentTab: (tab: 'tutorial' | 'theory' | 'ai' | 'home' | 'ai-song') => void
  updateLevelProgress: (chapterId: number, levelNumber: number, stars: number, accuracy: number) => void
  canSkipToChapter: (chapterId: number) => boolean
  attemptChapterSkip: (chapterId: number) => boolean
  getChapterProgress: (chapterId: number) => ChapterProgress
  getLevelProgress: (chapterId: number, levelNumber: number) => LevelProgress
  isLevelUnlocked: (chapterId: number, levelNumber: number) => boolean
  addPracticeRecord: (record: Omit<PracticeRecord, 'timestamp'>) => void
  resetProgress: () => void
  // 新增登录和评估相关方法
  login: (email: string, password: string) => Promise<void>
  completeQuestionnaire: (answers: Record<string, string | string[]>) => void
  completeAssessment: (results: AssessmentResults) => void
  saveVocalRange: (lowest: string, highest: string, gender?: 'male' | 'female') => void
  completeOnboarding: () => void
}

const GameContext = createContext<GameContextType | null>(null)

export function GameProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<UserProgress>(initialProgress)
  const [profile, setProfile] = useState<UserProfile>(initialProfile)
  const [currentTab, setCurrentTab] = useState<'tutorial' | 'theory' | 'ai' | 'home' | 'ai-song'>('home')
  const [isHydrated, setIsHydrated] = useState(false)

  // 从 localStorage 加载进度和用户资料
  useEffect(() => {
    const savedProgress = localStorage.getItem('music-app-progress')
    if (savedProgress) {
      try {
        const parsed = JSON.parse(savedProgress)
        setProgress(parsed)
      } catch (e) {
        console.error('Failed to parse saved progress:', e)
      }
    }
    
    const savedProfile = localStorage.getItem('music-app-profile')
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile)
        setProfile(parsed)
      } catch (e) {
        console.error('Failed to parse saved profile:', e)
      }
    }
    setIsHydrated(true)
  }, [])

  // 保存进度到 localStorage
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem('music-app-progress', JSON.stringify(progress))
    }
  }, [progress, isHydrated])
  
  // 保存用户资料到 localStorage
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem('music-app-profile', JSON.stringify(profile))
    }
  }, [profile, isHydrated])

  const getChapterProgress = useCallback((chapterId: number): ChapterProgress => {
    return progress.chapters[chapterId] || {
      totalStars: 0,
      unlocked: false,
      completed: false,
      levels: {},
    }
  }, [progress])

  const getLevelProgress = useCallback((chapterId: number, levelNumber: number): LevelProgress => {
    const chapter = getChapterProgress(chapterId)
    return chapter.levels[`${chapterId}-${levelNumber}`] || {
      stars: 0,
      highScore: 0,
      attempts: 0,
      completed: false,
    }
  }, [getChapterProgress])

  const isLevelUnlocked = useCallback((chapterId: number, levelNumber: number): boolean => {
    const chapter = getChapterProgress(chapterId)
    if (!chapter.unlocked) return false
    if (levelNumber === 1) return true
    
    // 前一关需要至少1星
    const prevLevel = getLevelProgress(chapterId, levelNumber - 1)
    return prevLevel.stars >= 1
  }, [getChapterProgress, getLevelProgress])

  const updateLevelProgress = useCallback((
    chapterId: number, 
    levelNumber: number, 
    stars: number, 
    accuracy: number
  ) => {
    setProgress(prev => {
      const newProgress = { ...prev }
      const chapter = CHAPTERS.find(c => c.id === chapterId)
      if (!chapter) return prev

      // 确保章节存在
      if (!newProgress.chapters[chapterId]) {
        newProgress.chapters[chapterId] = {
          totalStars: 0,
          unlocked: true,
          completed: false,
          levels: {},
        }
      }

      const levelKey = `${chapterId}-${levelNumber}`
      const currentLevel = newProgress.chapters[chapterId].levels[levelKey] || {
        stars: 0,
        highScore: 0,
        attempts: 0,
        completed: false,
      }

      // 更新关卡进度
      const newStars = Math.max(currentLevel.stars, stars)
      newProgress.chapters[chapterId].levels[levelKey] = {
        stars: newStars,
        highScore: Math.max(currentLevel.highScore, accuracy),
        attempts: currentLevel.attempts + 1,
        completed: newStars >= 1,
        lastAttempt: new Date(),
      }

      // 重新计算章节总星数
      let chapterStars = 0
      Object.values(newProgress.chapters[chapterId].levels).forEach(level => {
        chapterStars += level.stars
      })
      newProgress.chapters[chapterId].totalStars = chapterStars

      // 检查章节是否完成
      if (chapterStars >= chapter.requiredStars) {
        newProgress.chapters[chapterId].completed = true
        
        // 解锁下一章
        const nextChapter = CHAPTERS.find(c => c.id === chapterId + 1)
        if (nextChapter && !newProgress.chapters[chapterId + 1]) {
          newProgress.chapters[chapterId + 1] = {
            totalStars: 0,
            unlocked: true,
            completed: false,
            levels: {},
          }
        }
      }

      // 更新总星数
      let totalStars = 0
      Object.values(newProgress.chapters).forEach(ch => {
        totalStars += ch.totalStars
      })
      newProgress.totalStars = totalStars

      // 更新连续次数
      if (stars > 0) {
        newProgress.streak = prev.streak + 1
      } else {
        newProgress.streak = 0
      }

      return newProgress
    })
  }, [])

  const canSkipToChapter = useCallback((chapterId: number): boolean => {
    // 如果已解锁则可以访问
    const chapter = getChapterProgress(chapterId)
    if (chapter.unlocked) return true
    
    // 否则需要通过测试关
    return false
  }, [getChapterProgress])

  const attemptChapterSkip = useCallback((chapterId: number): boolean => {
    // 高水平用户跳关测试逻辑
    // 返回 true 表示可以跳到该章节
    setProgress(prev => ({
      ...prev,
      chapters: {
        ...prev.chapters,
        [chapterId]: {
          totalStars: 0,
          unlocked: true,
          completed: false,
          levels: {},
        },
      },
    }))
    return true
  }, [])

  const addPracticeRecord = useCallback((record: Omit<PracticeRecord, 'timestamp'>) => {
    setProgress(prev => ({
      ...prev,
      practiceHistory: [
        ...prev.practiceHistory.slice(-99), // 保留最近100条记录
        { ...record, timestamp: new Date() },
      ],
    }))
  }, [])

  // 重置全部进度
  const resetProgress = useCallback(() => {
    setProgress(initialProgress)
    localStorage.removeItem('music-app-progress')
    // 同步清除后端数据
    apiResetProgress().catch(() => {})
  }, [])

  // 登录 - 调语构API（离线时自动降级为本地模式）
  const login = useCallback(async (email: string, password: string) => {
    try {
      const user = await apiLogin(email, password)
      setProfile(prev => ({
        ...prev,
        isLoggedIn: true,
        nickname: user.nickname || email.split('@')[0],
      }))
    } catch {
      // API 不可用时降级为本地模式
      setProfile(prev => ({
        ...prev,
        isLoggedIn: true,
        nickname: email.split('@')[0],
      }))
    }
  }, [])

  // 完成问卷 - 同时存本地和服务器
  const completeQuestionnaire = useCallback((answers: Record<string, string | string[]>) => {
    setProfile(prev => ({ ...prev, questionnaireAnswers: answers }))
    apiSaveQuestionnaire(answers).catch(() => {})
  }, [])

  // 完成评估
  const completeAssessment = useCallback((results: AssessmentResults) => {
    setProfile(prev => ({ ...prev, assessmentResults: results }))
  }, [])

  // 保存音域和性别 - 同时存本地和服务器
  const saveVocalRange = useCallback((lowest: string, highest: string, gender?: 'male' | 'female') => {
    setProfile(prev => ({ ...prev, vocalRange: { lowest, highest }, ...(gender ? { gender } : {}) }))
    apiSaveVocalRange(lowest, highest).catch(() => {})
  }, [])

  // 完成引导流程
  const completeOnboarding = useCallback(() => {
    setProfile(prev => ({ ...prev, hasCompletedOnboarding: true }))
    setCurrentTab('tutorial')
  }, [])

  if (!isHydrated) {
    return null
  }

  return (
    <GameContext.Provider value={{
      progress,
      profile,
      currentTab,
      setCurrentTab,
      updateLevelProgress,
      canSkipToChapter,
      attemptChapterSkip,
      getChapterProgress,
      getLevelProgress,
      isLevelUnlocked,
      addPracticeRecord,
      resetProgress,
      login,
      completeQuestionnaire,
      completeAssessment,
      saveVocalRange,
      completeOnboarding,
    }}>
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  const context = useContext(GameContext)
  if (!context) {
    throw new Error('useGame must be used within a GameProvider')
  }
  return context
}
