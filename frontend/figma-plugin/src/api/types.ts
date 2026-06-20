// ===== 题目类型 =====
export interface Question {
  id: string
  type: QuestionType
  subtype?: string
  difficulty: number
  prompt: string
  options: string[]
  answer: string | string[]
  lesson_id?: string
  unit_id?: string
  metadata?: Record<string, unknown>
}

export type QuestionType =
  | "T1" | "T2" | "T3" | "T4" | "T5" | "T6" | "T7"
  | "RHYTHM_CLASSIFICATION"
  | "ACCENT_DETECTION"
  | "RHYTHM_PUZZLE"
  | "RHYTHM_ECHO"
  | "UPBEAT_TRAINING"
  | "SIGHT_READING"
  | "SPOT_THE_BUG"
  | "METRIC_MODULATION"
  | "SPLIT_BRAIN"
  | "ANTI_DISTRACTION"
  | "PRODUCER_SANDBOX"

// ===== 关卡类型 =====
export interface Level {
  id: string
  module_id: string
  title: string
  subtitle?: string
  order: number
  type: string
  difficulty: number
  questions?: string[]
}

export interface Module {
  id: string
  title: string
  subtitle: string
  order: number
  levels?: Level[]
}

// ===== 用户/进度 =====
export interface UserProgress {
  user_id: string
  display_name: string
  level: number
  xp: number
  completed_lessons: number
  accuracy: number
}

// ===== API 响应 =====
export interface ApiResponse<T> {
  code: number
  data: T
  detail?: string
}

// ===== 统计数据 =====
export interface Stats {
  total_questions: number
  total_levels: number
  total_modules: number
  total_users: number
  by_type: Record<string, number>
}
