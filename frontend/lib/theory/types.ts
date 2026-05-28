export type ModuleId = "staff" | "jianpu" | "gongche";

export type QuestionType =
  | "CLICK_OR_CHOICE_STAFF_POSITION"
  | "STAFF_CONCEPT_CHOICE"
  | "STAFF_NOTE_NAME_CHOICE"
  | "CLICK_PIANO_KEY_OR_CHOICE"
  | "BINARY_CHOICE"
  | "ACCIDENTAL_CHOICE"
  | "RHYTHM_VALUE_CHOICE"
  | "COMPREHENSIVE_CHOICE"
  | "JIANPU_NUMBER_CHOICE"
  | "JIANPU_OCTAVE_CHOICE"
  | "JIANPU_RHYTHM_CHOICE"
  | "SCALE_CHOICE"
  | "JIANPU_KEY_ACCIDENTAL_CHOICE"
  | "GONGCHE_CHAR_CHOICE"
  | "GONGCHE_MAPPING_CHOICE"
  | "GONGCHE_MELODY_CHOICE"
  | "GONGCHE_CHALLENGE_CHOICE";

export interface TheoryQuestion {
  id: string;
  moduleId: ModuleId;
  chapterId: string;
  type: QuestionType;
  difficulty: number;
  prompt: string;
  instruction: string;
  assets: { image?: string; audio?: string };
  interaction?: Record<string, unknown>;
  options: string[];
  answer: string;
  explanation: string;
  score: number;
  uiHints: { showProgress: boolean; showConfirmButton: boolean; allowRetryAfterWrong: boolean };
}

export interface ChapterResultInput {
  correctCount: number;
  totalCount: number;
  previousBestStars?: number;
}

export interface ChapterResult {
  accuracy: number;
  stars: 0 | 1 | 2 | 3;
  passed: boolean;
  unlockNext: boolean;
  message: string;
}

export interface QuestionAttempt {
  questionId: string;
  moduleId: ModuleId;
  chapterId: string;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  answeredAt: string;
}

export interface ChapterProgress {
  moduleId: ModuleId;
  chapterId: string;
  bestStars: 0 | 1 | 2 | 3;
  lastStars: 0 | 1 | 2 | 3;
  bestAccuracy: number;
  lastAccuracy: number;
  completed: boolean;
  unlocked: boolean;
  attempts: number;
}

export interface WrongBookItem {
  questionId: string;
  moduleId: ModuleId;
  chapterId: string;
  wrongCount: number;
  lastWrongAt: string;
  mastered: boolean;
}

export interface Module {
  id: ModuleId;
  title: string;
  shortTitle: string;
  icon: string;
  route: string;
  order: number;
  status: string;
  unitCount: number;
  theme: { main: string; accent: string; reward: string };
  entryCard: { progressText: string; tapAction: string };
}

export interface Chapter {
  id: string;
  moduleId: ModuleId;
  order: number;
  title: string;
  subtitle: string;
  goal: string;
  questionTarget: number;
  passStars: number;
  unlockRule: string;
}

export interface LessonFlow {
  id: string;
  moduleId: ModuleId;
  chapterId: string;
  title: string;
  order: number;
  route: string;
  nodes: FlowNode[];
  unlockNextWhen: { minStars: number };
  perfectRewardWhen: { stars: number; effect: string };
}

export interface FlowNode {
  id: string;
  type: "teaching" | "practice" | "result";
  lessonId?: string;
  questionIds?: string[];
  questionCount?: number;
  starRule?: string;
  required: boolean;
}

export interface TeachingLesson {
  id: string;
  moduleId: ModuleId;
  chapterId: string;
  title: string;
  goal: string;
  steps: TeachingStep[];
}

export interface TeachingStep {
  type: string;
  title: string;
  text: string;
  primaryAction?: string;
  component?: string;
}

export interface PageConfig {
  page: string;
  deleteCards: string[];
  topCardsMapToModules: ModuleId[];
  bottomCards: BottomCard[];
  moduleCardBehavior: string;
}

export interface BottomCard {
  id: string;
  title: string;
  route: string;
  badgeFrom: string;
}

export interface UiRoutes {
  root: string;
  home: RouteConfig;
  moduleMap: RouteConfig;
  chapterPlay: RouteConfig;
  chapterResult: RouteConfig;
  wrongbook: RouteConfig;
}

export interface RouteConfig {
  route: string;
  screen: string;
  source: string;
}

export interface RewardConfig {
  perQuestionCorrect: { animation: string; durationMs: number; textPool: string[] };
  perQuestionWrong: { animation: string; durationMs: number; text: string };
  chapterStars: {
    oneStar: { minAccuracy: number; maxAccuracy: number; passed: boolean };
    twoStars: { minAccuracy: number; maxAccuracy: number; passed: boolean };
    threeStars: { minAccuracy: number; maxAccuracy: number; passed: boolean };
  };
  moduleGoldReward: { threshold: number; effect: string; description: string };
  unlockRules: { chapter: string; gongche: string };
}

export const MODULE_THEME_COLORS: Record<ModuleId, { main: string; light: string; bg: string; gradient: string }> = {
  staff: { main: "#A8CBB7", light: "#D6F5E6", bg: "#E8F5EE", gradient: "from-[#A8CBB7] to-[#B4C7E8]" },
  jianpu: { main: "#F2CFA4", light: "#FFE4D6", bg: "#FFF5E8", gradient: "from-[#F2CFA4] to-[#E8B4D4]" },
  gongche: { main: "#C8B8A8", light: "#E8DDD5", bg: "#F5F0EB", gradient: "from-[#C8B8A8] to-[#DDB29C]" },
};
