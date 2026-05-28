import { calculateChapterResult, calculateModuleReward } from "./starEngine";
import type { ModuleId, TheoryQuestion } from "./types";
import type { QuestionAttempt, ChapterProgress, WrongBookItem } from "./types";

const PROGRESS_KEY = "theory_progress_v1";
const WRONGBOOK_KEY = "theory_wrongbook_v1";
const ATTEMPTS_KEY = "theory_attempts_v1";

function readJson<T>(key: string, fallback: T): T {
  if (typeof localStorage === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function recordQuestionAttempt(params: {
  question: TheoryQuestion;
  selectedAnswer: string;
}) {
  const isCorrect = params.selectedAnswer === params.question.answer;
  const attempt: QuestionAttempt = {
    questionId: params.question.id,
    moduleId: params.question.moduleId,
    chapterId: params.question.chapterId,
    selectedAnswer: params.selectedAnswer,
    correctAnswer: params.question.answer,
    isCorrect,
    answeredAt: new Date().toISOString(),
  };

  const attempts = readJson<QuestionAttempt[]>(ATTEMPTS_KEY, []);
  attempts.push(attempt);
  writeJson(ATTEMPTS_KEY, attempts);

  if (!isCorrect) addToWrongBook(params.question);
  return attempt;
}

export function addToWrongBook(question: TheoryQuestion) {
  const wrongBook = readJson<Record<string, WrongBookItem>>(WRONGBOOK_KEY, {});
  const old = wrongBook[question.id];
  wrongBook[question.id] = {
    questionId: question.id,
    moduleId: question.moduleId,
    chapterId: question.chapterId,
    wrongCount: old ? old.wrongCount + 1 : 1,
    lastWrongAt: new Date().toISOString(),
    mastered: false,
  };
  writeJson(WRONGBOOK_KEY, wrongBook);
}

export function markWrongQuestionMastered(questionId: string) {
  const wrongBook = readJson<Record<string, WrongBookItem>>(WRONGBOOK_KEY, {});
  if (wrongBook[questionId]) {
    wrongBook[questionId].mastered = true;
    writeJson(WRONGBOOK_KEY, wrongBook);
  }
}

export function getWrongBookItems() {
  const wrongBook = readJson<Record<string, WrongBookItem>>(WRONGBOOK_KEY, {});
  return Object.values(wrongBook).filter((item) => !item.mastered);
}

export function getWrongBookItem(questionId: string) {
  const wrongBook = readJson<Record<string, WrongBookItem>>(WRONGBOOK_KEY, {});
  return wrongBook[questionId] || null;
}

export function submitChapterResult(params: {
  moduleId: ModuleId;
  chapterId: string;
  correctCount: number;
  totalCount: number;
}) {
  const progress = readJson<Record<string, ChapterProgress>>(PROGRESS_KEY, {});
  const key = `${params.moduleId}:${params.chapterId}`;
  const old = progress[key];
  const result = calculateChapterResult({
    correctCount: params.correctCount,
    totalCount: params.totalCount,
    previousBestStars: old?.bestStars ?? 0,
  });

  progress[key] = {
    moduleId: params.moduleId,
    chapterId: params.chapterId,
    bestStars: result.stars,
    lastStars: result.stars,
    bestAccuracy: Math.max(old?.bestAccuracy ?? 0, result.accuracy),
    lastAccuracy: result.accuracy,
    completed: result.passed,
    unlocked: true,
    attempts: (old?.attempts ?? 0) + 1,
  };
  writeJson(PROGRESS_KEY, progress);
  return result;
}

export function getModuleRewardState(params: { moduleId: ModuleId; chapterCount: number }) {
  const progress = readJson<Record<string, ChapterProgress>>(PROGRESS_KEY, {});
  const earnedStars = Object.values(progress)
    .filter((p) => p.moduleId === params.moduleId)
    .reduce((sum, p) => sum + p.bestStars, 0);
  return calculateModuleReward({ earnedStars, totalStars: params.chapterCount * 3 });
}

export function getChapterProgress(moduleId: ModuleId, chapterId: string): ChapterProgress | null {
  const progress = readJson<Record<string, ChapterProgress>>(PROGRESS_KEY, {});
  return progress[`${moduleId}:${chapterId}`] || null;
}

export function getAllChapterProgress(): Record<string, ChapterProgress> {
  return readJson<Record<string, ChapterProgress>>(PROGRESS_KEY, {});
}

export function isChapterUnlocked(
  chapter: { id: string; moduleId: ModuleId; unlockRule: string },
  allProgress: Record<string, ChapterProgress>,
): boolean {
  if (chapter.unlockRule === "none") return true;
  if (chapter.unlockRule === "previous_chapter_passed") {
    const prev = allProgress[`${chapter.moduleId}:${String(Number(chapter.id.split("_").pop()) - 1).padStart(2, "0")}`];
    return prev?.bestStars !== undefined && prev.bestStars >= 2;
  }
  if (chapter.unlockRule === "jianpu_02_passed") {
    const jianpu02 = allProgress["jianpu:jianpu_02"];
    return jianpu02?.bestStars !== undefined && jianpu02.bestStars >= 2;
  }
  return true;
}
