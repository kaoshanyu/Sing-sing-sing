"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import {
  Lock, Star, BookOpen, Music, ChevronLeft, ChevronRight, Crown, Check, X, RefreshCw, RotateCcw,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useGame } from "@/lib/game-context"

// ===== Question Bank Data =====
import modulesData from "@/lib/theory/questionbank/data/modules.json"
import chaptersData from "@/lib/theory/questionbank/data/chapters.json"
import lessonFlowData from "@/lib/theory/questionbank/data/lessonFlow.json"
import teachingLessonsData from "@/lib/theory/questionbank/data/teachingLessons.json"
import questionsData from "@/lib/theory/questionbank/data/questions.json"
import pageConfigData from "@/lib/theory/questionbank/data/pageConfig.json"
import uiRoutesData from "@/lib/theory/questionbank/data/uiRoutes.json"
import rewardConfigData from "@/lib/theory/questionbank/data/rewardConfig.json"

import type {
  ModuleId, Module, Chapter, LessonFlow, TheoryQuestion,
  TeachingLesson, TeachingStep, RewardConfig, WrongBookItem,
} from "@/lib/theory/types"
import { MODULE_THEME_COLORS } from "@/lib/theory/types"
import { submitChapterResult, getChapterProgress, getAllChapterProgress, getWrongBookItems, getWrongBookItem, markWrongQuestionMastered, recordQuestionAttempt, getModuleRewardState, isChapterUnlocked } from "@/lib/theory/progressEngine"

// ===== Helpers =====
function resolveImagePath(assetPath?: string): string | null {
  if (!assetPath) return null;
  const filename = assetPath.split("/").pop();
  return filename ? `/theory/images/${filename}` : null;
}

function getModuleChapters(moduleId: ModuleId): Chapter[] {
  return chaptersData.filter((c) => c.moduleId === moduleId).sort((a, b) => a.order - b.order) as Chapter[];
}

function getModuleFlow(moduleId: ModuleId): LessonFlow[] {
  return lessonFlowData.filter((f) => f.moduleId === moduleId).sort((a, b) => a.order - b.order) as LessonFlow[];
}

function getChapterQuestions(chapterId: string): TheoryQuestion[] {
  const flow = lessonFlowData.find((f) => f.chapterId === chapterId) as LessonFlow | undefined;
  if (!flow) return [];
  const practiceNode = flow.nodes.find((n) => n.type === "practice");
  if (!practiceNode?.questionIds) return [];
  return practiceNode.questionIds
    .map((qid: string) => questionsData.find((q) => q.id === qid))
    .filter(Boolean) as TheoryQuestion[];
}

function getTeachingLesson(lessonId?: string): TeachingLesson | null {
  if (!lessonId) return null;
  return (teachingLessonsData.find((t) => t.id === lessonId) as TeachingLesson | undefined) || null;
}

function getModuleTotalStars(moduleId: ModuleId): number {
  return getModuleChapters(moduleId).length * 3;
}

function getModuleCompletedStars(moduleId: ModuleId): number {
  const progress = getAllChapterProgress();
  return Object.values(progress)
    .filter((p) => p.moduleId === moduleId)
    .reduce((sum, p) => sum + p.bestStars, 0);
}

const moduleIcons: Record<ModuleId, string> = { staff: "🎵", jianpu: "1", gongche: "上" };

// ===== StarDisplay =====
function StarDisplay({ stars, maxStars = 3, size = "md" }: { stars: number; maxStars?: number; size?: "sm" | "md" | "lg" }) {
  const sizeMap = { sm: "w-3.5 h-3.5", md: "w-5 h-5", lg: "w-7 h-7" };
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: maxStars }, (_, i) => (
        <Star
          key={i}
          className={cn(
            sizeMap[size],
            "transition-all duration-300",
            i < stars
              ? "fill-[#FFB800] text-[#FFB800] drop-shadow-sm"
              : "text-[#E8DDD5] fill-[#E8DDD5]",
          )}
        />
      ))}
    </div>
  );
}

// ===== SmallProgressBar =====
function SmallProgressBar({ value, max = 100, color }: { value: number; max?: number; color?: string }) {
  const pct = Math.min(100, max > 0 ? (value / max) * 100 : 0);
  return (
    <div className="h-1.5 rounded-full bg-[#F0E8E0] overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, backgroundColor: color || "#A8CBB7" }}
      />
    </div>
  );
}

// ===== RewardAnimation =====
function RewardAnimation({ type, text, onComplete }: { type: "correct" | "wrong" | "perfect"; text: string; onComplete?: () => void }) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setShow(false);
      onComplete?.();
    }, type === "perfect" ? 1500 : 900);
    return () => clearTimeout(t);
  }, [type, onComplete]);

  if (!show) return null;

  if (type === "wrong") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-lg border border-[#F0E0D8] animate-in fade-in zoom-in duration-300">
          <p className="text-[#C8A090] text-base font-medium">{text}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="relative">
        {type === "perfect" && (
          <div className="absolute inset-0 flex items-center justify-center">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-full bg-[#FFB800] animate-ping"
                style={{
                  transformOrigin: "center",
                  animationDelay: `${i * 0.1}s`,
                  transform: `rotate(${i * 45}deg) translateX(-40px)`,
                }}
              />
            ))}
          </div>
        )}
        <div className={cn(
          "bg-white/95 backdrop-blur-sm rounded-3xl px-8 py-6 shadow-xl border animate-in zoom-in duration-300",
          type === "perfect" ? "border-[#FFB800] scale-110" : "border-[#A8D5BA]",
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              type === "perfect" ? "bg-[#FFF5E0]" : "bg-[#E8F5EE]",
            )}>
              {type === "perfect" ? (
                <Crown className="w-5 h-5 text-[#FFB800] fill-[#FFB800]" />
              ) : (
                <Check className="w-5 h-5 text-[#7AB89A]" />
              )}
            </div>
            <div>
              <p className={cn(
                "text-lg font-bold",
                type === "perfect" ? "text-[#FFB800]" : "text-[#4A7A5A]",
              )}>{text}</p>
              {type === "correct" && <p className="text-xs text-muted-foreground">回答正确！</p>}
              {type === "perfect" && <p className="text-xs text-[#D4A040]">太棒了！完美通关！</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== QuestionRenderer =====
function QuestionRenderer({
  question,
  onAnswer,
  disabled,
}: {
  question: TheoryQuestion;
  onAnswer: (answer: string) => void;
  disabled: boolean;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const imgSrc = resolveImagePath(question.assets.image);

  const handleSelect = (opt: string) => {
    if (disabled) return;
    setSelected(opt);
  };

  const handleConfirm = () => {
    if (selected && !disabled) {
      onAnswer(selected);
    }
  };

  // Binary choice: two big cards
  if (question.type === "BINARY_CHOICE") {
    return (
      <div className="space-y-4">
        {imgSrc && (
          <div className="flex justify-center mb-4">
            <img src={imgSrc} alt="" className="max-h-40 object-contain" />
          </div>
        )}
        <p className="text-center text-lg font-medium text-foreground">{question.prompt}</p>
        <div className="grid grid-cols-2 gap-4">
          {question.options.map((opt) => (
            <button
              key={opt}
              onClick={() => handleSelect(opt)}
              className={cn(
                "h-28 rounded-2xl border-2 transition-all flex items-center justify-center text-lg font-bold",
                selected === opt
                  ? "border-[#A8CBB7] bg-[#E8F5EE] text-[#4A7A5A] scale-[1.02] shadow-md"
                  : "border-[#E8DDD5] bg-white text-foreground hover:border-[#D0C0B0]",
              )}
            >
              {opt}
            </button>
          ))}
        </div>
        {selected && question.uiHints.showConfirmButton && (
          <Button onClick={handleConfirm} className="w-full h-12 text-base rounded-xl bg-[#A8CBB7] hover:bg-[#8DB8A0">
            确认
          </Button>
        )}
      </div>
    );
  }

  // Piano key question
  if (question.type === "CLICK_PIANO_KEY_OR_CHOICE") {
    return (
      <div className="space-y-4">
        {imgSrc && (
          <div className="flex justify-center mb-4">
            <img src={imgSrc} alt="" className="max-h-36 object-contain" />
          </div>
        )}
        <p className="text-center text-base font-medium text-foreground">{question.prompt}</p>
        <p className="text-center text-sm text-muted-foreground">{question.instruction}</p>
        {/* Simple piano visual */}
        <div className="flex justify-center gap-1 py-4">
          {question.options.map((opt) => {
            const isSharp = opt.includes("#") || opt.includes("♯");
            return (
              <button
                key={opt}
                onClick={() => handleSelect(opt)}
                className={cn(
                  "transition-all rounded-b-md",
                  isSharp
                    ? "w-8 h-20 bg-foreground text-background text-[10px] -mx-2 z-10 rounded-md"
                    : "w-10 h-28 bg-white border border-[#E8DDD5] text-xs text-foreground",
                  selected === opt && (isSharp
                    ? "bg-[#4A7A5A] scale-105"
                    : "bg-[#E8F5EE] border-[#A8CBB7] scale-105 shadow-md"),
                )}
              >
                <span className={cn("mx-auto", isSharp ? "pt-1" : "pt-3")}>{opt}</span>
              </button>
            );
          })}
        </div>
        {selected && (
          <Button onClick={handleConfirm} className="w-full h-12 text-base rounded-xl bg-[#A8CBB7] hover:bg-[#8DB8A0">
            确认
          </Button>
        )}
      </div>
    );
  }

  // Default: options as cards
  return (
    <div className="space-y-4">
      {imgSrc && (
        <div className="flex justify-center mb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imgSrc} alt="" className="max-h-40 object-contain" />
        </div>
      )}
      <p className="text-center text-base font-medium text-foreground">{question.prompt}</p>
      {question.instruction && (
        <p className="text-center text-sm text-muted-foreground">{question.instruction}</p>
      )}
      <div className="grid grid-cols-1 gap-3">
        {question.options.map((opt) => (
          <button
            key={opt}
            onClick={() => handleSelect(opt)}
            className={cn(
              "p-4 rounded-xl border-2 transition-all text-left",
              selected === opt
                ? "border-[#A8CBB7] bg-[#E8F5EE] text-foreground scale-[1.01] shadow-sm"
                : "border-[#E8DDD5] bg-white text-foreground hover:border-[#D0C0B0]",
            )}
          >
            <span className="text-sm">{opt}</span>
          </button>
        ))}
      </div>
      {selected && question.uiHints.showConfirmButton !== false && (
        <Button
          onClick={handleConfirm}
          className="w-full h-12 text-base rounded-xl bg-[#A8CBB7] hover:bg-[#8DB8A0] text-white"
        >
          确认
        </Button>
      )}
      {/* Auto-submit for single-option touch-friendly */}
      {selected && question.uiHints.showConfirmButton === false && !disabled && (
        <div className="text-center text-xs text-muted-foreground">已选择，自动提交</div>
      )}
    </div>
  );
}

// ===== TeachingLessonRenderer =====
function TeachingLessonRenderer({
  lesson,
  stepIndex,
  onNext,
  onStartPractice,
}: {
  lesson: TeachingLesson;
  stepIndex: number;
  onNext: () => void;
  onStartPractice: () => void;
}) {
  const step = lesson.steps[stepIndex];
  if (!step) {
    onStartPractice();
    return null;
  }

  const isLast = stepIndex === lesson.steps.length - 1;
  const imgSrc = resolveImagePath(
    lesson.chapterId ? `assets/images/${lesson.chapterId}_teach.svg` : undefined
  );

  return (
    <div className="flex flex-col h-full bg-[#FAF7F4]">
      <div className="flex-1 overflow-y-auto px-6 py-8 pb-[140px]">
        <div className="max-w-lg mx-auto space-y-6">
          {/* Step indicator */}
          <div className="flex items-center gap-2 justify-center mb-4">
            {lesson.steps.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  i === stepIndex ? "bg-[#A8CBB7] w-4" : i < stepIndex ? "bg-[#D0E0D0]" : "bg-[#E8DDD5]",
                )}
              />
            ))}
          </div>

          {/* Content */}
          {step.type === "intro_card" && (
            <div className="text-center space-y-6">
              <h2 className="text-2xl font-bold text-foreground">{step.title}</h2>
              <p className="text-base text-muted-foreground leading-relaxed">{step.text}</p>
              {imgSrc && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imgSrc} alt="" className="mx-auto max-h-48 object-contain" />
              )}
              <p className="text-sm text-muted-foreground bg-[#F0E8E0] rounded-xl p-4">
                🎯 {lesson.goal}
              </p>
              <Button
                onClick={onNext}
                className="w-full h-12 text-base rounded-xl bg-[#A8CBB7] hover:bg-[#8DB8A0] text-white"
              >
                {step.primaryAction || "继续"}
              </Button>
            </div>
          )}

          {step.type === "interactive_demo" && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-foreground text-center">{step.title}</h2>
              <p className="text-sm text-muted-foreground text-center">{step.text}</p>
              {imgSrc && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imgSrc} alt="" className="mx-auto max-h-48 object-contain rounded-xl shadow-sm" />
              )}
              <div className="bg-white rounded-2xl p-6 border border-[#E8DDD5] shadow-sm">
                <div className="flex flex-wrap gap-3 justify-center">
                  {lesson.chapterId === "staff_01" && ["第一线", "第一间", "第二线", "第二间", "第三线", "第三间"].map((pos) => (
                    <button
                      key={pos}
                      className="px-4 py-2 rounded-lg bg-[#F0E8E0] text-sm text-foreground hover:bg-[#E0D5CC] transition-colors"
                    >
                      {pos}
                    </button>
                  ))}
                  {lesson.chapterId?.startsWith("jianpu") && ["1", "2", "3", "4", "5", "6", "7"].map((num) => (
                    <button
                      key={num}
                      className="w-12 h-12 rounded-full bg-[#FFF5E8] text-lg font-bold text-foreground hover:bg-[#FFE4D6] transition-colors border border-[#F2CFA4]"
                    >
                      {num}
                    </button>
                  ))}
                  {lesson.chapterId?.startsWith("gongche") && ["上", "尺", "工", "凡", "六", "五", "乙"].map((char) => (
                    <button
                      key={char}
                      className="px-4 py-2 rounded-lg bg-[#F0E8E0] text-lg font-serif text-foreground hover:bg-[#E0D5CC] transition-colors"
                    >
                      {char}
                    </button>
                  ))}
                  {!lesson.chapterId?.startsWith("staff") && !lesson.chapterId?.startsWith("jianpu") && !lesson.chapterId?.startsWith("gongche") && (
                    <p className="text-sm text-muted-foreground text-center w-full">点一点试试看</p>
                  )}
                </div>
              </div>
              <Button
                onClick={onNext}
                className="w-full h-12 text-base rounded-xl bg-[#A8CBB7] hover:bg-[#8DB8A0] text-white"
              >
                {step.primaryAction || "继续"}
              </Button>
            </div>
          )}

          {step.type === "micro_practice_intro" && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-[#E8F5EE] flex items-center justify-center mx-auto">
                <Music className="w-8 h-8 text-[#A8CBB7]" />
              </div>
              <h2 className="text-xl font-bold text-foreground">{step.title}</h2>
              <p className="text-base text-muted-foreground leading-relaxed">{step.text}</p>
              <Button
                onClick={onStartPractice}
                className="w-full h-14 text-lg font-bold rounded-xl bg-gradient-to-r from-[#A8CBB7] to-[#8DB8A0] hover:from-[#8DB8A0] hover:to-[#7AA890] text-white shadow-lg"
              >
                {step.primaryAction || "开始练习"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ===== TheoryHomePage =====
function TheoryHomePage({
  onNavigateToModule,
  onNavigateToWrongBook,
  onBack,
}: {
  onNavigateToModule: (id: ModuleId) => void;
  onNavigateToWrongBook: () => void;
  onBack: () => void;
}) {
  const wrongItems = getWrongBookItems();
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Check gongche unlock - read fresh every render
  const chapterProgress = getAllChapterProgress();
  const jianpu01 = chapterProgress["jianpu:jianpu_01"];
  const jianpu02 = chapterProgress["jianpu:jianpu_02"];
  const isGongcheUnlocked = (jianpu02?.bestStars ?? 0) >= 2;
  const hasAnyJianpuProgress = (jianpu01?.bestStars ?? 0) >= 1 || (jianpu02?.bestStars ?? 0) >= 1;

  const handleGongcheClick = () => {
    if (isGongcheUnlocked) {
      onNavigateToModule("gongche");
    } else {
      const jp1 = jianpu01?.bestStars ?? 0;
      const jp2 = jianpu02?.bestStars ?? 0;
      setToastMsg(`需要简谱第2关达到2星(当前: 第1关${jp1}星, 第2关${jp2}星)`);
      setTimeout(() => setToastMsg(null), 3500);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#FDF8F3]">
      {toastMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-foreground text-background px-5 py-2.5 rounded-xl text-sm shadow-lg animate-in fade-in">
          {toastMsg}
        </div>
      )}

      <div className="flex items-center justify-between px-4 py-3 border-b border-[#E8DDD5]">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#F5EDE8] transition-colors">
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">乐理知识</h1>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-[140px] space-y-4">
        {/* Module cards */}
        {(modulesData as Module[]).map((mod) => {
          const colors = MODULE_THEME_COLORS[mod.id];
          const chapters = getModuleChapters(mod.id);
          const completedStars = getModuleCompletedStars(mod.id);
          const totalStars = getModuleTotalStars(mod.id);
          const progress = getModuleRewardState({ moduleId: mod.id, chapterCount: chapters.length });
          const isGold = progress.unlocked;
          const isLocked = mod.id === "gongche" && !isGongcheUnlocked;

          if (isLocked) {
            return (
              <Card
                key={mod.id}
                className="overflow-hidden cursor-pointer opacity-60 hover:opacity-80 transition-all"
                onClick={handleGongcheClick}
              >
                <div className="h-2 bg-[#E8DDD5]" />
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-[#F0E8E0] flex items-center justify-center text-xl text-muted-foreground">
                      {mod.id === "gongche" ? "上" : mod.id === "jianpu" ? "1" : "🎵"}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-muted-foreground">{mod.title}</h3>
                      <p className="text-sm text-muted-foreground">即将解锁</p>
                    </div>
                    <Lock className="w-5 h-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            );
          }

          return (
            <Card
              key={mod.id}
              className={cn(
                "overflow-hidden cursor-pointer hover:shadow-lg transition-all",
                isGold && "ring-2 ring-[#FFB800] shadow-lg shadow-[#FFB800]/20",
              )}
              onClick={() => onNavigateToModule(mod.id)}
            >
              <div className="h-2" style={{ backgroundColor: colors.main }} />
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold shrink-0"
                    style={{ backgroundColor: `${colors.main}30`, color: colors.main }}
                  >
                    {mod.id === "staff" ? <Music className="w-7 h-7" /> : mod.id === "jianpu" ? <span>1</span> : <span className="font-serif">上</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-lg text-foreground">{mod.title}</h3>
                      {isGold && <Crown className="w-5 h-5 text-[#FFB800] fill-[#FFB800]" />}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <span>学习进度 {Math.round(completedStars / totalStars * 100)}%</span>
                    </div>
                    <SmallProgressBar value={completedStars} max={totalStars} color={colors.main} />
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-muted-foreground">
                        已学 {chapters.filter((c) => getChapterProgress(mod.id, c.id)?.bestStars ?? 0 >= 2).length}/{chapters.length} 单元
                      </p>
                      <StarDisplay stars={Math.min(3, Math.ceil(completedStars / Math.max(1, totalStars) * 3))} size="sm" />
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Wrong Book Card */}
        <Card
          className="overflow-hidden cursor-pointer hover:shadow-lg transition-all relative"
          onClick={onNavigateToWrongBook}
        >
          <div className="h-2 bg-gradient-to-r from-[#E8B4D4] to-[#D4A0B8]" />
          <CardContent className="p-4">
            {wrongItems.length > 0 && (
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-400 rounded-full flex items-center justify-center text-xs text-white font-bold shadow-sm">
                {wrongItems.length > 99 ? "99+" : wrongItems.length}
              </div>
            )}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-[#E8B4D4]/20 flex items-center justify-center">
                <BookOpen className="w-7 h-7 text-[#E8B4D4]" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-foreground">错题本</h3>
                <p className="text-sm text-muted-foreground">
                  {wrongItems.length > 0 ? `${wrongItems.length} 道错题待复习` : "没有未掌握的错题"}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ===== ModuleMapPage =====
function ModuleMapPage({
  moduleId,
  onBack,
  onChapterSelect,
}: {
  moduleId: ModuleId;
  onBack: () => void;
  onChapterSelect: (chapterId: string) => void;
}) {
  const chapters = getModuleChapters(moduleId);
  const colors = MODULE_THEME_COLORS[moduleId];
  const allProgress = getAllChapterProgress();
  const rewardState = getModuleRewardState({ moduleId, chapterCount: chapters.length });
  const isGold = rewardState.unlocked;
  const completedStars = getModuleCompletedStars(moduleId);
  const totalStars = getModuleTotalStars(moduleId);

  return (
    <div className={cn(
      "flex flex-col h-full bg-[#FAF7F4]",
      isGold && "bg-gradient-to-b from-[#FFFDF0] to-[#FAF7F4]",
    )}>
      <div className={cn(
        "flex items-center justify-between px-4 py-3 border-b border-[#E8DDD5]",
        isGold && "border-[#E8DDA0]",
      )}>
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#F5EDE8] transition-colors">
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">{(modulesData as Module[]).find((m) => m.id === moduleId)?.title}</h1>
        <div className="flex items-center gap-2">
          {isGold && <Crown className="w-5 h-5 text-[#FFB800] fill-[#FFB800]" />}
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Star className="w-4 h-4 fill-[#FFB800] text-[#FFB800]" />
            <span>{completedStars}/{totalStars}</span>
          </div>
        </div>
      </div>


      <div className="flex-1 overflow-y-auto px-4 py-6 pb-[140px]">
        <div className="max-w-md mx-auto relative">
          {/* Vertical connecting line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-[#E8DDD5]" style={{ height: `${chapters.length * 130}px` }} />

          <div className="space-y-2">
            {chapters.map((chapter, index) => {
              const chapProgress = getChapterProgress(moduleId, chapter.id);
              const stars = chapProgress?.bestStars ?? 0;
              // Compute unlock directly using getChapterProgress (reads fresh from localStorage)
              const isUnlocked = (() => {
                if (chapter.unlockRule === "none") return true;
                if (chapter.unlockRule === "previous_chapter_passed") {
                  const prev = chapters.find(c => c.order === chapter.order - 1);
                  if (!prev) return true;
                  return (getChapterProgress(moduleId, prev.id)?.bestStars ?? 0) >= 2;
                }
                if (chapter.unlockRule === "jianpu_02_passed") {
                  return (getChapterProgress("jianpu", "jianpu_02")?.bestStars ?? 0) >= 2;
                }
                return true;
              })();
              const isCompleted = stars >= 2;

              return (
                <div key={chapter.id} className="flex items-start gap-4 relative">
                  {/* Node */}
                  <div className="relative z-10 flex flex-col items-center pt-2">
                    <button
                      onClick={() => isUnlocked && onChapterSelect(chapter.id)}
                      disabled={!isUnlocked}
                      className={cn(
                        "w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all",
                        isCompleted && stars === 3 && "bg-[#FFF5E0] border-[#FFB800] shadow-md",
                        isCompleted && stars === 2 && !isGold && "bg-[#E8F5EE] border-[#A8CBB7]",
                        !isCompleted && isUnlocked && "bg-white border-[#D0C0B0] hover:border-[#A8CBB7]",
                        !isUnlocked && "bg-[#F0E8E0] border-[#E0D5CC] cursor-not-allowed",
                      )}
                    >
                      {!isUnlocked ? (
                        <Lock className="w-5 h-5 text-muted-foreground" />
                      ) : isCompleted && stars === 3 ? (
                        <Crown className="w-6 h-6 text-[#FFB800] fill-[#FFB800]" />
                      ) : isCompleted ? (
                        <Check className="w-6 h-6 text-[#7AB89A]" />
                      ) : (
                        <span className="text-sm font-bold text-muted-foreground">{chapter.order}</span>
                      )}
                    </button>
                    {/* Stars below node */}
                    <div className="mt-1.5">
                      <StarDisplay stars={stars} size="sm" />
                    </div>
                  </div>

                  {/* Chapter info */}
                  <div
                    className={cn(
                      "flex-1 p-3 rounded-xl border transition-all cursor-pointer",
                      isCompleted && "bg-[#E8F5EE] border-[#A8CBB7]/30",
                      !isCompleted && isUnlocked && "bg-white border-[#E8DDD5] hover:border-[#A8CBB7]",
                      !isUnlocked && "bg-[#F5F0EB] border-[#E8DDD5] opacity-60",
                    )}
                    onClick={() => isUnlocked && onChapterSelect(chapter.id)}
                  >
                    <h3 className={cn("font-semibold text-sm", !isUnlocked && "text-muted-foreground")}>
                      {chapter.order}. {chapter.title}
                    </h3>
                    <p className={cn("text-xs mt-0.5", isUnlocked ? "text-muted-foreground" : "text-muted-foreground/60")}>
                      {isUnlocked ? chapter.subtitle : "未解锁"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== ChapterPlayPage =====
function ChapterPlayPage({
  moduleId,
  chapterId,
  onBack,
  onComplete,
}: {
  moduleId: ModuleId;
  chapterId: string;
  onBack: () => void;
  onComplete: () => void;
}) {
  const flow = lessonFlowData.find((f) => f.chapterId === chapterId) as LessonFlow | undefined;
  const chapter = chaptersData.find((c) => c.id === chapterId) as Chapter | undefined;

  // Teaching state
  const teachingNode = flow?.nodes.find((n) => n.type === "teaching");
  const practiceNode = flow?.nodes.find((n) => n.type === "practice");
  const lesson = teachingNode ? getTeachingLesson(teachingNode.lessonId) : null;

  // Practice questions
  const questions = getChapterQuestions(chapterId);

  const [phase, setPhase] = useState<"teaching" | "practice" | "result">("teaching");
  const [teachingStepIndex, setTeachingStepIndex] = useState(0);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [showReward, setShowReward] = useState<"correct" | "wrong" | "perfect" | null>(null);
  const [rewardText, setRewardText] = useState("");
  const [answered, setAnswered] = useState(false);
  const [lastWrong, setLastWrong] = useState(false);
  const [chapterResult, setChapterResult] = useState<{
    stars: number;
    accuracy: number;
    correctCount: number;
    totalCount: number;
    passed: boolean;
    unlockNext: boolean;
  } | null>(null);

  const finishChapter = useCallback((correct: number) => {
    const totalCount = questions.length;
    const result = submitChapterResult({
      moduleId,
      chapterId,
      correctCount: correct,
      totalCount,
    });
    setChapterResult({
      stars: result.stars,
      accuracy: result.accuracy,
      correctCount: correct,
      totalCount,
      passed: result.passed,
      unlockNext: result.unlockNext,
    });
    setPhase("result");
  }, [moduleId, chapterId, questions.length]);

  const handleTeachingNext = useCallback(() => {
    if (lesson && teachingStepIndex < lesson.steps.length - 1) {
      setTeachingStepIndex((i) => i + 1);
    } else {
      setPhase("practice");
      setCurrentQIndex(0);
    }
  }, [lesson, teachingStepIndex]);

  const handleStartPractice = useCallback(() => {
    setPhase("practice");
    setCurrentQIndex(0);
  }, []);

  const handleAnswer = useCallback((selectedAnswer: string) => {
    if (answered || currentQIndex >= questions.length) return;
    const q = questions[currentQIndex];
    if (!q) return;

    const isCorrect = selectedAnswer === q.answer;
    recordQuestionAttempt({ question: q, selectedAnswer });

    setAnswered(true);

    if (isCorrect) {
      const newCorrect = correctCount + 1;
      setCorrectCount(newCorrect);
      const texts = (rewardConfigData as RewardConfig).perQuestionCorrect.textPool;
      setRewardText(texts[Math.floor(Math.random() * texts.length)]);

      if (newCorrect === questions.length) {
        setShowReward("perfect");
        const t = setTimeout(() => {
          setShowReward(null);
          finishChapter(newCorrect);
        }, 1200);
        return;
      }

      setShowReward("correct");
      setLastWrong(false);
      const t = setTimeout(() => {
        setShowReward(null);
        if (currentQIndex < questions.length - 1) {
          setCurrentQIndex((i) => i + 1);
          setAnswered(false);
        } else {
          finishChapter(newCorrect);
        }
      }, 800);
    } else {
      setRewardText((rewardConfigData as RewardConfig).perQuestionWrong.text);
      setShowReward("wrong");
      setLastWrong(true);
      const t = setTimeout(() => {
        setShowReward(null);
        if (currentQIndex < questions.length - 1) {
          setCurrentQIndex((i) => i + 1);
          setAnswered(false);
        } else {
          finishChapter(correctCount);
        }
      }, 600);
    }
  }, [answered, currentQIndex, questions, correctCount, finishChapter]);

  const handleRetry = () => {
    setCurrentQIndex(0);
    setCorrectCount(0);
    setAnswered(false);
    setShowReward(null);
    setChapterResult(null);
    setPhase("practice");
  };

  // Teaching phase
  if (phase === "teaching" && lesson) {
    return (
      <div className="flex flex-col h-full bg-[#FAF7F4]">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#E8DDD5] bg-white">
          <button onClick={onBack} className="w-9 h-9 rounded-full bg-[#F5EDE8] flex items-center justify-center">
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-base font-semibold text-foreground">{chapter?.title || "教学"}</h1>
        </div>
        <TeachingLessonRenderer
          lesson={lesson}
          stepIndex={teachingStepIndex}
          onNext={handleTeachingNext}
          onStartPractice={handleStartPractice}
        />
      </div>
    );
  }

  // Practice phase
  if (phase === "practice") {
    const question = questions[currentQIndex];

    if (!question) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">暂无题目</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full bg-[#FAF7F4]">
        {showReward && (
          <RewardAnimation
            type={showReward}
            text={rewardText}
            onComplete={() => {}}
          />
        )}

        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E8DDD5] bg-white">
          <button onClick={onBack} className="w-9 h-9 rounded-full bg-[#F5EDE8] flex items-center justify-center">
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1 text-center">
            <p className="text-sm font-semibold text-foreground">{chapter?.title}</p>
          </div>
          <div className="w-9" />
        </div>

        {/* Progress */}
        <div className="px-4 py-2 bg-white border-b border-[#E8DDD5]/50">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
            <span>{currentQIndex + 1}/{questions.length}</span>
            <span className="text-[#7AB89A]">✓ {correctCount}</span>
          </div>
          <SmallProgressBar value={currentQIndex + 1} max={questions.length} color="#A8CBB7" />
        </div>

        {/* Question content */}
        <div className="flex-1 overflow-y-auto px-4 py-6 pb-[140px]">
          <div className="max-w-lg mx-auto">
            <QuestionRenderer
              question={question}
              onAnswer={handleAnswer}
              disabled={answered}
            />

            {/* Show explanation after answer */}
            {answered && (
              <div className={cn(
                "mt-4 p-4 rounded-xl border text-sm",
                lastWrong
                  ? "bg-[#FFF0EC] border-[#E8C0B0] text-[#8A6050]"
                  : "bg-[#E8F5EE] border-[#A8CBB7] text-[#4A7A5A]",
              )}>
                <p>{question.explanation}</p>
              </div>
            )}

            {/* Next button after answering (except when animation auto-advances) */}
            {answered && showReward === null && currentQIndex < questions.length - 1 && (
              <Button
                onClick={() => {
                  setCurrentQIndex((i) => i + 1);
                  setAnswered(false);
                }}
                className="w-full mt-4 h-12 text-base rounded-xl bg-[#A8CBB7] hover:bg-[#8DB8A0] text-white"
              >
                下一题 <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            )}

            {/* Last question answered - go to result */}
            {answered && showReward === null && currentQIndex >= questions.length - 1 && (
              <Button
                onClick={() => finishChapter(correctCount)}
                className="w-full mt-4 h-12 text-base rounded-xl bg-[#A8CBB7] hover:bg-[#8DB8A0] text-white"
              >
                查看结果 <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Result phase
  if (phase === "result") {
    // Use state saved by finishChapter, never call submitChapterResult during render
    const stars = chapterResult?.stars ?? 0;
    const accuracy = chapterResult?.accuracy ?? 0;
    const resultCorrectCount = chapterResult?.correctCount ?? correctCount;
    const resultTotalCount = chapterResult?.totalCount ?? questions.length;
    const passed = chapterResult?.passed ?? false;
    const hasNext = chapterResult?.unlockNext ?? false;

    return (
      <ChapterResultPage
        chapter={chapter}
        stars={stars}
        accuracy={accuracy}
        correctCount={resultCorrectCount}
        totalCount={resultTotalCount}
        passed={passed}
        onRetry={handleRetry}
        onBack={() => onComplete()}
        onNext={onComplete}
        hasNext={hasNext}
      />
    );
  }

  return null;
}

// ===== ChapterResultPage =====
function ChapterResultPage({
  chapter,
  stars,
  accuracy,
  correctCount,
  totalCount,
  passed,
  onRetry,
  onNext,
  onBack,
  hasNext,
}: {
  chapter?: Chapter;
  stars: number;
  accuracy: number;
  correctCount: number;
  totalCount: number;
  passed: boolean;
  onRetry: () => void;
  onNext: () => void;
  onBack: () => void;
  hasNext: boolean;
}) {
  const [celebrate, setCelebrate] = useState(false);
  const wrongItems = getWrongBookItems();
  const chapterWrongItems = wrongItems.filter((w) => w.chapterId === chapter?.id);

  useEffect(() => {
    if (stars === 3) {
      setCelebrate(true);
      const t = setTimeout(() => setCelebrate(false), 2000);
      return () => clearTimeout(t);
    }
  }, [stars]);

  return (
    <div className="flex flex-col h-full bg-[#FAF7F4]">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#E8DDD5] bg-white">
        <button onClick={onBack} className="w-9 h-9 rounded-full bg-[#F5EDE8] flex items-center justify-center">
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-base font-semibold text-foreground">关卡结果</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-8 pb-[140px]">
        <div className="max-w-sm mx-auto text-center space-y-6">
          {/* Stars */}
          <div className={cn("transition-all", celebrate && "scale-110")}>
            <div className="flex justify-center gap-2 mb-2">
              {[1, 2, 3].map((i) => (
                <Star
                  key={i}
                  className={cn(
                    "w-12 h-12 transition-all duration-500",
                    i <= stars
                      ? "fill-[#FFB800] text-[#FFB800] drop-shadow-lg scale-110"
                      : "text-[#E8DDD5] fill-[#E8DDD5]",
                    celebrate && i <= stars && "animate-bounce",
                  )}
                  style={celebrate && i <= stars ? { animationDelay: `${i * 0.15}s` } : undefined}
                />
              ))}
            </div>
            <p className="text-lg font-bold text-foreground mt-2">
              {stars === 3 ? "太棒啦！三星通过！" : stars === 2 ? "通过啦！" : stars === 1 ? "继续加油！" : "别灰心，再来一次"}
            </p>
          </div>

          {/* Score card */}
          <div className="bg-white rounded-2xl p-6 border border-[#E8DDD5] shadow-sm space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-2xl font-bold text-foreground">{correctCount}/{totalCount}</p>
                <p className="text-xs text-muted-foreground">正确题数</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{Math.round(accuracy * 100)}%</p>
                <p className="text-xs text-muted-foreground">正确率</p>
              </div>
              <div>
                <p className="text-2xl font-bold flex items-center justify-center gap-0.5">
                  <Star className="w-5 h-5 fill-[#FFB800] text-[#FFB800]" />
                  {stars}
                </p>
                <p className="text-xs text-muted-foreground">获得星星</p>
              </div>
            </div>
          </div>

          {/* Wrong book reminder */}
          {chapterWrongItems.length > 0 && (
            <div className="bg-[#FFF0EC] rounded-xl p-3 border border-[#E8C0B0]">
              <p className="text-sm text-[#8A6050]">📝 {chapterWrongItems.length} 道错题已自动加入错题本</p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            {hasNext && stars >= 2 ? (
              <Button
                onClick={onNext}
                className="w-full h-12 text-base rounded-xl bg-gradient-to-r from-[#A8CBB7] to-[#8DB8A0] hover:from-[#8DB8A0] hover:to-[#7AA890] text-white shadow-md"
              >
                下一关 <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            ) : (
              <Button
                disabled
                className="w-full h-12 text-base rounded-xl bg-[#E8DDD5] text-muted-foreground cursor-not-allowed"
              >
                {stars < 2 ? "未达2星，下一关未解锁" : "已是最后一关"}
              </Button>
            )}
            <Button
              onClick={onRetry}
              variant="outline"
              className="w-full h-12 text-base rounded-xl border-[#E8DDD5] text-foreground hover:bg-[#F5EDE8]"
            >
              <RefreshCw className="w-4 h-4 mr-2" /> 再练一次
            </Button>
          </div>
        </div>
      </div>

      {celebrate && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-[#FFB800] animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.1}s`,
                animationDuration: "1s",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ===== WrongBookPage =====
function WrongBookPage({ onBack }: { onBack: () => void }) {
  const items = getWrongBookItems();
  const [reviewMode, setReviewMode] = useState(false);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [reviewItems, setReviewItems] = useState<WrongBookItem[]>([]);
  const [showMastered, setShowMastered] = useState(false);

  // Group by module
  const grouped = items.reduce(
    (acc, item) => {
      const group = acc[item.moduleId] || [];
      group.push(item);
      acc[item.moduleId] = group;
      return acc;
    },
    {} as Record<string, WrongBookItem[]>,
  );

  const moduleNames: Record<string, string> = { staff: "五线谱", jianpu: "简谱", gongche: "工尺谱" };

  const handleReview = (moduleId: string) => {
    const moduleItems = grouped[moduleId] || [];
    setReviewItems(moduleItems);
    setCurrentReviewIndex(0);
    setReviewMode(true);
  };

  // Review mode
  if (reviewMode && reviewItems.length > 0) {
    const currentItem = reviewItems[currentReviewIndex];
    const question = questionsData.find((q) => q.id === currentItem.questionId) as TheoryQuestion | undefined;

    if (!question) {
      return (
        <div className="flex flex-col h-full bg-[#FAF7F4]">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[#E8DDD5] bg-white">
            <button onClick={() => setReviewMode(false)} className="w-9 h-9 rounded-full bg-[#F5EDE8] flex items-center justify-center">
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="text-base font-semibold text-foreground">错题复习</h1>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">题目数据不存在</p>
          </div>
        </div>
      );
    }

    return (
      <ReviewQuestion
        question={question}
        wrongItem={currentItem}
        total={reviewItems.length}
        index={currentReviewIndex}
        onNext={() => {
          if (currentReviewIndex < reviewItems.length - 1) {
            setCurrentReviewIndex((i) => i + 1);
          } else {
            setReviewMode(false);
          }
        }}
        onBack={() => setReviewMode(false)}
        onMastered={(qid) => {
          markWrongQuestionMastered(qid);
          const remaining = reviewItems.filter((r) => r.questionId !== qid);
          setReviewItems(remaining);
          if (remaining.length === 0) {
            setReviewMode(false);
          } else if (currentReviewIndex >= remaining.length) {
            setCurrentReviewIndex(remaining.length - 1);
          }
        }}
      />
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#FAF7F4]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#E8DDD5] bg-white">
        <button onClick={onBack} className="w-9 h-9 rounded-full bg-[#F5EDE8] flex items-center justify-center">
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-base font-semibold text-foreground">错题本</h1>
        <div className="w-9" />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-[140px] space-y-6">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 rounded-full bg-[#E8F5EE] flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-[#A8CBB7]" />
            </div>
            <p className="text-muted-foreground">暂无未掌握的错题</p>
            <p className="text-xs text-muted-foreground/60 mt-1">做错的题目会自动加入这里</p>
          </div>
        ) : (
          Object.entries(grouped).map(([moduleId, moduleItems]) => (
            <div key={moduleId}>
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className={cn(
                  "w-3 h-3 rounded-full",
                  moduleId === "staff" && "bg-[#A8CBB7]",
                  moduleId === "jianpu" && "bg-[#F2CFA4]",
                  moduleId === "gongche" && "bg-[#C8B8A8]",
                )} />
                {moduleNames[moduleId] || moduleId}
                <span className="text-sm text-muted-foreground font-normal">({moduleItems.length})</span>
              </h3>
              <div className="space-y-2">
                {moduleItems.map((item) => {
                  const q = questionsData.find((q) => q.id === item.questionId) as TheoryQuestion | undefined;
                  return (
                    <Card key={item.questionId} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {q?.prompt || item.questionId}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              错误 {item.wrongCount} 次 · {new Date(item.lastWrongAt).toLocaleDateString("zh-CN")}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="shrink-0 rounded-lg border-[#A8CBB7] text-[#4A7A5A] hover:bg-[#E8F5EE]"
                            onClick={() => handleReview(moduleId)}
                          >
                            复习
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2 rounded-xl border-[#A8CBB7] text-[#4A7A5A] hover:bg-[#E8F5EE]"
                onClick={() => handleReview(moduleId)}
              >
                复习全部 {moduleItems.length} 题
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ===== ReviewQuestion =====
function ReviewQuestion({
  question,
  wrongItem,
  total,
  index,
  onNext,
  onBack,
  onMastered,
}: {
  question: TheoryQuestion;
  wrongItem: WrongBookItem;
  total: number;
  index: number;
  onNext: () => void;
  onBack: () => void;
  onMastered: (questionId: string) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const imgSrc = resolveImagePath(question.assets.image);

  const handleConfirm = () => {
    if (!selected) return;
    const correct = selected === question.answer;
    setIsCorrect(correct);
    setAnswered(true);
    if (correct) {
      recordQuestionAttempt({ question, selectedAnswer: selected });
    } else {
      recordQuestionAttempt({ question, selectedAnswer: selected });
    }
  };

  const handleMastered = () => {
    onMastered(question.id);
  };

  return (
    <div className="flex flex-col h-full bg-[#FAF7F4]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#E8DDD5] bg-white">
        <button onClick={onBack} className="w-9 h-9 rounded-full bg-[#F5EDE8] flex items-center justify-center">
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="text-sm text-muted-foreground">
          错题复习 {index + 1}/{total}
        </div>
        <div className="w-9" />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 pb-[140px]">
        <div className="max-w-lg mx-auto space-y-4">
          {imgSrc && (
            <div className="flex justify-center mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imgSrc} alt="" className="max-h-36 object-contain" />
            </div>
          )}
          <p className="text-center text-base font-medium text-foreground">{question.prompt}</p>

          <div className="grid grid-cols-1 gap-3">
            {question.options.map((opt) => (
              <button
                key={opt}
                onClick={() => !answered && setSelected(opt)}
                className={cn(
                  "p-4 rounded-xl border-2 transition-all text-left",
                  answered && opt === question.answer && "border-[#A8CBB7] bg-[#E8F5EE]",
                  answered && opt === selected && opt !== question.answer && "border-[#E8C0B0] bg-[#FFF0EC]",
                  !answered && selected === opt && "border-[#A8CBB7] bg-[#E8F5EE] scale-[1.01]",
                  !answered && "border-[#E8DDD5] bg-white hover:border-[#D0C0B0]",
                )}
              >
                <span className="text-sm">{opt}</span>
              </button>
            ))}
          </div>

          {answered && (
            <div className={cn(
              "p-4 rounded-xl border text-sm",
              isCorrect ? "bg-[#E8F5EE] border-[#A8CBB7] text-[#4A7A5A]" : "bg-[#FFF0EC] border-[#E8C0B0] text-[#8A6050]",
            )}>
              <p>{isCorrect ? "✅ 回答正确！" : "❌ "}{question.explanation}</p>
            </div>
          )}

          {/* "已掌握" button (only when answered correctly) */}
          {answered && isCorrect && (
            <Button
              onClick={handleMastered}
              className="w-full h-12 text-base rounded-xl bg-[#A8CBB7] hover:bg-[#8DB8A0] text-white"
            >
              <Check className="w-5 h-5 mr-2" /> 已掌握，移出错题本
            </Button>
          )}

          {answered && !isCorrect && (
            <Button
              onClick={onNext}
              className="w-full h-12 text-base rounded-xl bg-[#A8CBB7] hover:bg-[#8DB8A0] text-white"
            >
              {index < total - 1 ? "下一题" : "完成复习"}
            </Button>
          )}

          {!answered && selected && (
            <Button
              onClick={handleConfirm}
              className="w-full h-12 text-base rounded-xl bg-[#A8CBB7] hover:bg-[#8DB8A0] text-white"
            >
              确认
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ===== Main Theory Tab =====
type TheoryView =
  | { type: "main" }
  | { type: "module-map"; moduleId: ModuleId }
  | { type: "chapter-play"; moduleId: ModuleId; chapterId: string }
  | { type: "wrongbook" };

export function TheoryTab() {
  const { setCurrentTab } = useGame();
  const [view, setView] = useState<TheoryView>({ type: "main" });

  const handleBack = () => {
    if (view.type === "main") {
      setCurrentTab("home");
    } else {
      setView({ type: "main" });
    }
  };

  if (view.type === "module-map") {
    return (
      <ModuleMapPage
        moduleId={view.moduleId}
        onBack={handleBack}
        onChapterSelect={(chapterId) => setView({ type: "chapter-play", moduleId: view.moduleId, chapterId })}
      />
    );
  }

  if (view.type === "chapter-play") {
    return (
      <ChapterPlayPage
        moduleId={view.moduleId}
        chapterId={view.chapterId}
        onBack={handleBack}
        onComplete={() => setView({ type: "module-map", moduleId: view.moduleId })}
      />
    );
  }

  if (view.type === "wrongbook") {
    return <WrongBookPage onBack={handleBack} />;
  }

  return (
    <TheoryHomePage
      onNavigateToModule={(id) => setView({ type: "module-map", moduleId: id })}
      onNavigateToWrongBook={() => setView({ type: "wrongbook" })}
      onBack={handleBack}
    />
  );
}
