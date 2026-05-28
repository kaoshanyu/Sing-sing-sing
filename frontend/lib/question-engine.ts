/**
 * 五音不全 App - 题库抽题与晋级算法 v1
 * 前端可直接使用；也可以放到后端/云函数中统一出题。
 */

export type Level = "L1" | "L2" | "L3";
export type ModuleId = "pitch" | "interval" | "sing";
export type QuestionType = "T1" | "T2" | "T3" | "T4" | "T5" | "T6" | "T7";

export interface Question {
  id: string;
  moduleId: ModuleId;
  level: Level;
  type: QuestionType;
  title: string;
  prompt: string;
  audios?: Record<string, string>;
  keyboardAudios?: Record<string, string>;
  options?: Array<{ id: string; text: string }>;
  answer?: string[];
  answerMode?: "single" | "multi";
  maxSelect?: number;
  target?: {
    notes: Array<{ pitchMidi: number; durationBeat: number }>;
    toleranceCent: number;
    minScore: number;
  };
  answerType?: "choice" | "pitchTracking" | "melodyTracking";
  skillTags?: string[];
  difficulty?: number;
  explain?: string;
}

export interface UserModuleState {
  moduleId: ModuleId;
  currentLevel: Level;
  points: number;
  masteredLevels: Level[];
  recentQuestionIds: string[];
}

export interface AnswerRecord {
  questionId: string;
  isCorrect: boolean;
  score?: number; // 跟唱题可用 0-100
  usedSlowAudio?: boolean;
}

export interface SessionResult {
  accuracy: number;
  pointsEarned: number;
  nextLevel: Level;
  shouldPromote: boolean;
  shouldDemote: boolean;
  feedback: string;
}

const levelOrder: Level[] = ["L1", "L2", "L3"];

export function getNextLevel(level: Level): Level {
  const idx = levelOrder.indexOf(level);
  return levelOrder[Math.min(idx + 1, levelOrder.length - 1)];
}

export function getPrevLevel(level: Level): Level {
  const idx = levelOrder.indexOf(level);
  return levelOrder[Math.max(idx - 1, 0)];
}

/**
 * 抽题逻辑：
 * 1. 根据模块 + 当前等级筛选题目；
 * 2. 优先避开最近做过的题；
 * 3. 按 difficulty 从低到高混入，前几题更简单；
 * 4. 默认抽 20 题。
 */
export function buildSessionQuestions(
  allQuestions: Question[],
  state: UserModuleState,
  sessionSize = 20
): Question[] {
  const pool = allQuestions.filter(
    q => q.moduleId === state.moduleId && q.level === state.currentLevel
  );

  const fresh = pool.filter(q => !state.recentQuestionIds.includes(q.id));
  const source = fresh.length >= sessionSize ? fresh : pool;

  const sorted = [...source].sort((a, b) => (a.difficulty ?? 1) - (b.difficulty ?? 1));

  // 前 5 题偏简单，后 15 题随机，避免体验太机械
  const warmup = sorted.slice(0, Math.min(8, sorted.length));
  const rest = sorted.slice(Math.min(8, sorted.length));

  return [
    ...shuffle(warmup).slice(0, Math.min(5, sessionSize)),
    ...shuffle(rest).slice(0, Math.max(0, sessionSize - 5))
  ].slice(0, sessionSize);
}

/**
 * 客观选择题判分：T1-T5
 * T4 是双选题，必须两个都选对才算正确。
 */
export function gradeChoiceQuestion(question: Question, selectedIds: string[]): boolean {
  const answer = [...(question.answer ?? [])].sort();
  const selected = [...selectedIds].sort();
  return JSON.stringify(answer) === JSON.stringify(selected);
}

/**
 * 跟唱题判分建议：T6-T7
 * 前端或音频分析服务计算 pitchScore/rhythmScore/completionScore 后传入。
 */
export function gradeSingingQuestion(input: {
  pitchScore: number;      // 0-100
  rhythmScore?: number;    // 0-100，T6 可不传
  completionScore?: number;// 0-100，T6 可不传
  minScore: number;
}): { isCorrect: boolean; score: number } {
  const rhythm = input.rhythmScore ?? 100;
  const completion = input.completionScore ?? 100;
  const score = Math.round(input.pitchScore * 0.65 + rhythm * 0.2 + completion * 0.15);
  return { isCorrect: score >= input.minScore, score };
}

/**
 * 结算逻辑：
 * L1：正确率 >= 80% 升 L2
 * L2：正确率 >= 82% 升 L3；<55% 降 L1
 * L3：正确率 >= 85% 视为掌握；<58% 降 L2
 */
export function finishSession(
  state: UserModuleState,
  records: AnswerRecord[]
): SessionResult {
  const answered = records.length || 1;
  const correct = records.filter(r => r.isCorrect).length;
  const accuracy = correct / answered;

  let basePoint = state.currentLevel === "L1" ? 10 : state.currentLevel === "L2" ? 12 : 15;
  const pointsEarned = records.reduce((sum, r) => {
    const slowPenalty = r.usedSlowAudio ? 0.8 : 1;
    const scoreFactor = typeof r.score === "number" ? Math.max(0.6, r.score / 100) : 1;
    return sum + (r.isCorrect ? Math.round(basePoint * slowPenalty * scoreFactor) : 0);
  }, 0);

  let nextLevel = state.currentLevel;
  let shouldPromote = false;
  let shouldDemote = false;
  let feedback = "继续练习，保持稳定。";

  if (state.currentLevel === "L1" && answered >= 20 && accuracy >= 0.8) {
    nextLevel = "L2"; shouldPromote = true; feedback = "已达到L1晋级标准，下一轮进入L2。";
  } else if (state.currentLevel === "L2" && answered >= 20 && accuracy >= 0.82) {
    nextLevel = "L3"; shouldPromote = true; feedback = "已达到L2晋级标准，下一轮进入L3。";
  } else if (state.currentLevel === "L2" && accuracy < 0.55) {
    nextLevel = "L1"; shouldDemote = true; feedback = "本轮正确率偏低，下一轮回到L1巩固。";
  } else if (state.currentLevel === "L3" && answered >= 20 && accuracy >= 0.85) {
    nextLevel = "L3"; shouldPromote = false; feedback = "L3表现优秀，当前模块可标记为已掌握。";
  } else if (state.currentLevel === "L3" && accuracy < 0.58) {
    nextLevel = "L2"; shouldDemote = true; feedback = "L3难度较高，下一轮回到L2加强。";
  }

  return { accuracy, pointsEarned, nextLevel, shouldPromote, shouldDemote, feedback };
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
