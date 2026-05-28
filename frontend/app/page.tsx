"use client"

import { useState, useEffect } from "react"
import { GameProvider, useGame, LevelConfig, generateLevelConfig, CHAPTERS, AssessmentResults } from "@/lib/game-context"
import { BottomNavigation } from "@/components/bottom-navigation"
import { TutorialMap } from "@/components/tutorial-map"
import { PracticeSession } from "@/components/practice-session"
import { LevelComplete } from "@/components/level-complete"
import { TheoryTab } from "@/components/theory-tab"
import { AIMentorTab } from "@/components/ai-mentor-tab"
import { HomeTab } from "@/components/home-tab"
import { LoginScreen } from "@/components/onboarding/login-screen"
import { Questionnaire } from "@/components/onboarding/questionnaire"

import { VocalRangeIntro } from "@/components/onboarding/vocal-range-intro"
import { VocalRangeTest } from "@/components/onboarding/vocal-range-test"
import { Assessment } from "@/components/onboarding/assessment"
import { AssessmentReport } from "@/components/onboarding/assessment-report"

import { UnitHall } from "@/components/rhythm/unit-hall"
import { UnitDetail } from "@/components/rhythm/unit-detail"
import { GamePage } from "@/components/rhythm/game-page"
import { ResultPage } from "@/components/rhythm/result-page"
import { SubmitResult } from "@/components/rhythm/types"

import { PitchMeter } from "@/components/pitch-meter"
import { SingTITest } from "@/components/singti/singti-test"
import { AiSingingTab } from "@/components/ai-singing/ai-singing-tab"
import { KaraokeRoom } from "@/components/karaoke-room"
import { CharacterAvatar } from "@/components/singti/character-avatar"
import type { Personality } from "@/components/singti/data"
import { PERSONALITIES } from "@/components/singti/data"
import { X, ChevronLeft } from "lucide-react"

type AppState =
  | { view: 'main' }
  | { view: 'practice'; level: LevelConfig }
  | { view: 'complete'; level: LevelConfig; stars: number; accuracy: number }
  | { view: 'assessment' }
  | { view: 'assessment-report'; results: AssessmentResults }
  // Rhythm module views
  | { view: 'rhythm-unit-hall' }
  | { view: 'rhythm-unit-detail'; unitId: number }
  | { view: 'rhythm-game'; unitId: number; levelId: number }
  | { view: 'rhythm-result'; unitId: number; levelId: number; result: SubmitResult }
  // SingTI
  | { view: 'singti' }
  // Vocal range re-test
  | { view: 'vocal-range-retest' }
  // Karaoke room
  | { view: 'karaoke' }

type OnboardingStep = 'login' | 'questionnaire' | 'vocal-range-intro' | 'vocal-range-test'

function AppContent() {
  const { 
    setCurrentTab,
    currentTab, 
    updateLevelProgress, 
    profile,
    login,
    completeQuestionnaire,
    completeAssessment,
    saveVocalRange,
    completeOnboarding,
  } = useGame()
  
  const [appState, setAppState] = useState<AppState>({ view: 'main' })
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>('login')
  const [singTIPersonality, setSingTIPersonality] = useState<Personality | null>(null)
  const [sharedPersonality, setSharedPersonality] = useState<Personality | null>(null)
  const [onboardingGender, setOnboardingGender] = useState<'male' | 'female'>('male')

  // 检测深度链接：?singti=ID 展示分享的人格
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const id = params.get('singti')
    if (id) {
      const personality = PERSONALITIES.find(p => p.id === Number(id))
      if (personality) {
        setSharedPersonality(personality)
        // 清除 URL 参数，避免刷新后重复展示
        window.history.replaceState({}, '', window.location.pathname)
      }
    }
  }, [])

  // 关闭分享卡片并开始测试
  const handleSharedPersonalityStart = () => {
    setSharedPersonality(null)
    setAppState({ view: 'singti' })
  }

  // 处理登录 - 现在接收邮箱和密码
  const handleLogin = async (email: string, password: string) => {
    await login(email, password)
    setOnboardingStep('questionnaire')
  }

  // 处理问卷完成 - 进入音域测试介绍页
  const handleQuestionnaireComplete = (answers: Record<string, string | string[]>) => {
    completeQuestionnaire(answers)
    setOnboardingStep('vocal-range-intro')
  }

  // 处理音域测试介绍页完成（用户选择性别后）
  const handleVocalRangeIntroComplete = (gender: 'male' | 'female') => {
    setOnboardingGender(gender)
    setOnboardingStep('vocal-range-test')
  }

  // 处理音域测试完成 - 保存音域和性别并进入教程
  const handleVocalRangeTestComplete = (lowestNote: string, highestNote: string, _gender?: 'male' | 'female') => {
    saveVocalRange(lowestNote, highestNote, onboardingGender)
    completeOnboarding()
  }

  // 处理从主页重新测试音域
  const handleVocalRangeRetest = () => {
    setAppState({ view: 'vocal-range-retest' })
  }

  // 处理打开K歌房
  const handleOpenKaraoke = () => {
    setAppState({ view: 'karaoke' })
  }

  // 处理重新测试完成
  const handleVocalRangeRetestComplete = (lowestNote: string, highestNote: string) => {
    saveVocalRange(lowestNote, highestNote)
    setAppState({ view: 'main' })
  }

  // 处理开始自我评估（从个人主页进入）
  const handleStartAssessment = () => {
    setAppState({ view: 'assessment' })
  }

  // 处理评估完成
  const handleAssessmentComplete = (results: AssessmentResults) => {
    completeAssessment(results)
    setAppState({ view: 'assessment-report', results })
  }

  // 处理开始关卡
  const handleStartLevel = (level: LevelConfig) => {
    setAppState({ view: 'practice', level })
  }

  // 处理关卡完成
  const handleLevelComplete = (stars: number, accuracy: number) => {
    if (appState.view !== 'practice') return
    
    const { level } = appState
    updateLevelProgress(level.chapterId, level.levelNumber, stars, accuracy)
    setAppState({ view: 'complete', level, stars, accuracy })
  }

  // 处理重试
  const handleRetry = () => {
    if (appState.view !== 'complete') return
    setAppState({ view: 'practice', level: appState.level })
  }

  // 处理下一关
  const handleNext = () => {
    if (appState.view !== 'complete') return
    
    const { level } = appState
    const chapter = CHAPTERS.find(c => c.id === level.chapterId)
    
    if (level.levelNumber < (chapter?.levels || 0)) {
      // 下一关
      const nextLevel = generateLevelConfig(level.chapterId, level.levelNumber + 1)
      setAppState({ view: 'practice', level: nextLevel })
    } else {
      // 下一章第一关
      const nextChapter = CHAPTERS.find(c => c.id === level.chapterId + 1)
      if (nextChapter) {
        const nextLevel = generateLevelConfig(nextChapter.id, 1)
        setAppState({ view: 'practice', level: nextLevel })
      } else {
        setAppState({ view: 'main' })
      }
    }
  }

  // 返回主页
  const handleHome = () => {
    setAppState({ view: 'main' })
  }

  // ===== Rhythm Module Handlers =====
  const handleRhythmTraining = () => {
    setAppState({ view: 'rhythm-unit-hall' })
  }

  const handleRhythmSelectUnit = (unitId: number) => {
    setAppState({ view: 'rhythm-unit-detail', unitId })
  }

  const handleRhythmStartLevel = (levelId: number) => {
    if (appState.view !== 'rhythm-unit-detail') return
    setAppState({ view: 'rhythm-game', unitId: appState.unitId, levelId })
  }

  const handleRhythmGameResult = (result: SubmitResult) => {
    if (appState.view !== 'rhythm-game') return
    setAppState({ view: 'rhythm-result', unitId: appState.unitId, levelId: appState.levelId, result })
  }

  const handleRhythmRetry = () => {
    if (appState.view !== 'rhythm-result') return
    const { unitId, levelId } = appState
    setAppState({ view: 'rhythm-game', unitId, levelId })
  }

  const handleRhythmNextLevel = async () => {
    if (appState.view !== 'rhythm-result') return
    const { unitId, levelId } = appState
    const nextLevelId = levelId + 1
    setAppState({ view: 'rhythm-game', unitId, levelId: nextLevelId })
  }

  const handleRhythmBackToUnit = () => {
    if (appState.view === 'rhythm-game' || appState.view === 'rhythm-result') {
      setAppState({ view: 'rhythm-unit-detail', unitId: appState.unitId })
    }
  }

  // ===== SingTI Handlers =====
  const handleOpenSingTI = () => {
    setAppState({ view: 'singti' })
  }

  const handleSingTIComplete = (personality: Personality) => {
    setSingTIPersonality(personality)
    setAppState({ view: 'main' })
  }

  // ===== 深度链接：展示分享的人格卡片（优先于引导流程） =====
  if (sharedPersonality) {
    const h = sharedPersonality.id * 22
    return (
      <div className="h-screen w-screen overflow-hidden flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-sm rounded-3xl bg-card border border-border/50 overflow-hidden relative">
          <div className="h-2" style={{ background: `linear-gradient(90deg, hsl(${h}, 60%, 75%), hsl(${h + 30}, 55%, 80%))` }} />
          <button
            onClick={() => setSharedPersonality(null)}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-card/80 border border-border/50 flex items-center justify-center z-10"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
          <div className="p-7 text-center">
            <p className="text-[10px] font-medium tracking-[0.3em] mb-5" style={{ color: `hsl(${h}, 40%, 70%)` }}>
              五音不全 × SingTI
            </p>
            <div className="mx-auto mb-5">
              <CharacterAvatar personality={sharedPersonality} size={120} />
            </div>
            <p className="text-[11px] font-medium text-muted-foreground mb-1 tracking-widest uppercase">音乐人格</p>
            <h2 className="text-3xl font-black text-foreground mb-1.5">{sharedPersonality.name}</h2>
            <p className="text-sm text-muted-foreground mb-5 max-w-xs mx-auto leading-relaxed">「{sharedPersonality.tagline}」</p>
            <div className="bg-secondary/40 rounded-2xl p-5 text-left mb-4">
              <p className="text-sm text-secondary-foreground leading-relaxed">{sharedPersonality.description}</p>
            </div>
            <button
              onClick={handleSharedPersonalityStart}
              className="text-sm text-primary font-medium hover:underline"
            >
              我也要测 → 开始测试
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 如果未完成引导流程，显示引导页面
  if (!profile.hasCompletedOnboarding) {
    // 登录页
    if (!profile.isLoggedIn || onboardingStep === 'login') {
      return <LoginScreen onLogin={handleLogin} />
    }
    
    // 问卷页
    if (onboardingStep === 'questionnaire') {
      return (
        <Questionnaire 
          onComplete={handleQuestionnaireComplete}
          onBack={() => setOnboardingStep('login')}
        />
      )
    }
    
    // 音域测试介绍页
    if (onboardingStep === 'vocal-range-intro') {
      return (
        <VocalRangeIntro
          onContinue={handleVocalRangeIntroComplete}
        />
      )
    }

    // 音域测试页
    if (onboardingStep === 'vocal-range-test') {
      return (
        <VocalRangeTest
          onComplete={handleVocalRangeTestComplete}
          gender={onboardingGender}
        />
      )
    }
  }

  // 如果在评估页面
  if (appState.view === 'assessment') {
    return (
      <div className="h-screen w-screen overflow-hidden">
        <Assessment
          onComplete={handleAssessmentComplete}
          onBack={handleHome}
        />
      </div>
    )
  }

  // 如果在评估报告页面
  if (appState.view === 'assessment-report') {
    return (
      <div className="h-screen w-screen overflow-hidden">
        <AssessmentReport
          results={appState.results}
          onStart={handleHome}
        />
      </div>
    )
  }

  // 如果在练习或完成页面
  if (appState.view === 'practice') {
    return (
      <div className="h-screen w-screen overflow-hidden">
        <PracticeSession
          level={appState.level}
          onComplete={handleLevelComplete}
          onExit={handleHome}
        />
      </div>
    )
  }

  if (appState.view === 'complete') {
    return (
      <div className="h-screen w-screen overflow-hidden">
        <LevelComplete
          level={appState.level}
          stars={appState.stars}
          accuracy={appState.accuracy}
          onRetry={handleRetry}
          onNext={handleNext}
          onHome={handleHome}
        />
      </div>
    )
  }

  // ===== Rhythm Module Pages =====
  const MAX_UNIT_LEVELS: Record<number, number> = { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 1 }

  if (appState.view === 'rhythm-unit-hall') {
    return (
      <div className="h-screen w-screen overflow-hidden">
        <UnitHall
          onSelectUnit={handleRhythmSelectUnit}
          onBack={handleHome}
        />
      </div>
    )
  }

  if (appState.view === 'rhythm-unit-detail') {
    return (
      <div className="h-screen w-screen overflow-hidden">
        <UnitDetail
          unitId={appState.unitId}
          onStartLevel={handleRhythmStartLevel}
          onBack={handleHome}
        />
      </div>
    )
  }

  if (appState.view === 'rhythm-game') {
    return (
      <div className="h-screen w-screen overflow-hidden">
        <GamePage
          unitId={appState.unitId}
          levelId={appState.levelId}
          onResult={handleRhythmGameResult}
          onBack={handleRhythmBackToUnit}
        />
      </div>
    )
  }

  if (appState.view === 'rhythm-result') {
    const { unitId, levelId, result } = appState
    const hasNextLevel = (levelId % 100) < (MAX_UNIT_LEVELS[unitId] || 3)
    return (
      <div className="h-screen w-screen overflow-hidden">
        <ResultPage
          result={result}
          levelId={levelId}
          hasNextLevel={hasNextLevel}
          onRetry={handleRhythmRetry}
          onNextLevel={handleRhythmNextLevel}
          onBackToUnit={handleRhythmBackToUnit}
        />
      </div>
    )
  }

  // ===== SingTI Page =====
  if (appState.view === 'singti') {
    return (
      <div className="h-screen w-screen overflow-hidden">
        <SingTITest
          onComplete={handleSingTIComplete}
          onBack={handleHome}
        />
      </div>
    )
  }

  // ===== Karaoke Room =====
  if (appState.view === 'karaoke') {
    return (
      <KaraokeRoom onBack={handleHome} />
    )
  }

  // ===== Vocal Range Re-test =====
  if (appState.view === 'vocal-range-retest') {
    return (
      <div className="h-screen w-screen overflow-hidden bg-gradient-to-b from-[#FDF8F3] to-[#F5EDE5]">
        {/* Top bar */}
        <div className="px-4 pt-6 pb-2 flex items-center gap-4">
          <button
            onClick={handleHome}
            className="w-9 h-9 rounded-full bg-white/80 border border-border/50 flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-foreground">重新测试音域</h1>
            <p className="text-xs text-muted-foreground">从最低音唱到最高音</p>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <PitchMeter
            tracking
            initialRange={profile.vocalRange}
            onComplete={handleVocalRangeRetestComplete}
          />
        </div>
      </div>
    )
  }

  // 主视图
  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col">
      <main className="flex-1 overflow-hidden">
        {currentTab === 'tutorial' && (
          <TutorialMap onStartLevel={handleStartLevel} onOpenRhythmTraining={handleRhythmTraining} />
        )}
        {currentTab === 'theory' && (
          <TheoryTab />
        )}
        {currentTab === 'ai-song' && (
          <AiSingingTab onBack={() => setCurrentTab('home')} />
        )}
        {currentTab === 'ai' && (
          <AIMentorTab />
        )}
        {currentTab === 'home' && (
          <HomeTab
            onStartAssessment={handleStartAssessment}
            onOpenSingTI={handleOpenSingTI}
            onOpenVocalRangeTest={handleVocalRangeRetest}
            onOpenKaraoke={handleOpenKaraoke}
            singTIPersonality={singTIPersonality}
          />
        )}
      </main>
      <BottomNavigation />
    </div>
  )
}

export default function Page() {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  )
}
