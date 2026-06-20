// ===== 单元 =====
export interface Unit {
  unit_id: number
  unit_name: string
  unit_description: string
  unit_order: number
  is_unlocked: boolean
  best_score: number | null
}

// ===== 关卡 =====
export interface Level {
  level_id: number
  unit_id: number
  difficulty: number       // 1-5
  bpm_range_min: number
  bpm_range_max: number
  time_signature: string   // "2/4", "3/4", "4/4", "6/8"...
  subdivision_level: number
  is_unlocked: boolean
  is_completed: boolean
  best_score: number | null
}

// ===== 题目 =====
export type QuestionType =
  | 'RHYTHM_CLASSIFICATION'
  | 'ACCENT_DETECTION'
  | 'RHYTHM_PUZZLE'
  | 'RHYTHM_ECHO'
  | 'UPBEAT_TRAINING'
  | 'SIGHT_READING'
  | 'SPOT_THE_BUG'
  | 'METRIC_MODULATION'
  | 'SPLIT_BRAIN'
  | 'ANTI_DISTRACTION'
  | 'PRODUCER_SANDBOX'

export interface Question {
  question_id: number
  level_id: number
  question_type: QuestionType
  bpm: number
  time_signature: string
  duration_ms: number
  audio_url: string
  question_payload: QuestionPayload
  expected_hit_times_ms: number[]
}

export interface QuestionPayload {
  options?: string[]
  count_options?: number[]
  target_label?: string
  name?: string
  prompt?: string
  skill_goal?: string
  echo_steps?: number[]
  grid_steps?: number
  note_pool?: NotePoolItem[]
  pattern_options?: PatternOption[]
  score_sheet?: ScoreNote[]
  available_instruments?: number[]
  groove_presets?: GroovePreset[]
  step_count?: number
  loop_duration_ms?: number
  quantize_grid_ms?: number
  quantize_grid_timestamps_ms?: number[]
}

export interface NotePoolItem {
  note_id: string
  note_type: NoteType
  duration_ms: number
}

export type NoteType = 'WHOLE' | 'HALF' | 'QUARTER' | 'EIGHTH' | 'SIXTEENTH' | 'REST'

export interface PatternOption {
  pattern_id: string
  label: string
  sequence: NoteType[]
  grid_steps: number
  hit_steps: number[]
}

export interface ScoreNote {
  note_type: NoteType
  start_ms: number
  duration_ms?: number
}

export interface GroovePreset {
  preset_id: string
  name: string
  tracks: { instrument_id: number; steps: number[] }[]
}

// ===== 提交请求 =====
export interface SubmitClassification {
  selected_answer: string
}

export interface SubmitHitTimestamps {
  hit_timestamps_ms: number[]
}

export interface SubmitPuzzleNotes {
  selected_notes: { note_id: string; note_type: NoteType; position: number }[]
  selected_pattern?: string
  selected_count?: number
}

export interface SubmitSpotBug {
  selected_position: number
}

export interface SubmitSplitBrain {
  left_hand_timestamps_ms: number[]
  right_hand_timestamps_ms: number[]
}

export interface SubmitProducer {
  loop_tracks: { instrument_id: number; hit_times_ms: number[] }[]
}

// ===== 提交结果 =====
export interface SubmitResult {
  score: number
  grade: Grade
  feedback: string
  is_passed: boolean
  statistics: {
    hit_count: number
    miss_count: number
    avg_deviation_ms: number
    max_deviation_ms: number
    deviation_list: number[]
  }
  radar_chart: RadarData | null
  reward: Reward | null
}

export type Grade = 'S' | 'A' | 'B' | 'C' | 'F'

export interface RadarData {
  precision: number
  theory_logic: number
  complexity: number
}

export interface Reward {
  reward_type: string
  instrument_id: number
  instrument_name: string
}

// ===== 乐器 & 曲目 =====
export interface Instrument {
  instrument_id: number
  name: string
  icon: string
  sound_url: string
}

export interface AudioTrack {
  track_id: number
  name: string
  audio_url: string
  bpm: number
}

// ===== 游戏状态 =====
export type GameState = 'loading' | 'ready' | 'playing' | 'stopped' | 'submitting'

// ===== 题型名称映射 =====
export const QUESTION_TYPE_NAMES: Record<QuestionType, string> = {
  RHYTHM_CLASSIFICATION: '律动分类帽',
  ACCENT_DETECTION: '重音识别',
  RHYTHM_PUZZLE: '节奏计数',
  RHYTHM_ECHO: '节奏回声',
  UPBEAT_TRAINING: '反拍训练',
  SIGHT_READING: '视奏跑酷',
  SPOT_THE_BUG: '听音纠错',
  METRIC_MODULATION: '律动变速',
  SPLIT_BRAIN: '左右互搏',
  ANTI_DISTRACTION: '抗干扰训练',
  PRODUCER_SANDBOX: '节奏制作人',
}

export const QUESTION_TYPE_DESCRIPTIONS: Record<QuestionType, string> = {
  RHYTHM_CLASSIFICATION: '系统会播放一段音乐，你需要判断它是几拍子的。2/4 拍像进行曲，3/4 拍像华尔兹，4/4 拍是流行乐最常见的节奏。',
  ACCENT_DETECTION: '系统播放节拍器，你需要在每小节第一拍（强拍）点击屏幕。跟着强拍的节奏，准确地点击下去！',
  RHYTHM_PUZZLE: '听完整段节奏后，判断目标音一共出现了几次。先抓住稳定脉搏，再数更明亮的目标音。',
  RHYTHM_ECHO: '听到目标节奏就跟着点击，把长短、休止和密集节奏转化成身体反应。',
  UPBEAT_TRAINING: '背景会持续播放底鼓（强拍），你需要在两个底鼓之间的反拍位置点击。感受反拍的律动！',
  SIGHT_READING: '乐谱从右向左滚动，当音符经过判定线时点击。就像音乐游戏一样！',
  SPOT_THE_BUG: '系统显示乐谱并播放音频，但音频中某个音符被替换了。找出那个听起来和看起来不一样的音符。',
  METRIC_MODULATION: '底鼓速度不变，但你需要根据屏幕提示瞬间切换敲击密度。从一种节奏无缝切换到另一种！',
  SPLIT_BRAIN: '双手独立操作！屏幕一分为二，左右手分别打出不同的节奏型。挑战你的协调能力！',
  ANTI_DISTRACTION: '清晰底鼓循环中，只打强拍和次强拍。忽略干扰音轨，保持专注！',
  PRODUCER_SANDBOX: '像编曲软件一样点亮鼓组网格，也可以套用模板后再改出自己的节奏 Loop。',
}

// ===== 评级配置 =====
export const GRADE_CONFIG: Record<Grade, { min: number; color: string; label: string }> = {
  S: { min: 95, color: 'text-amber-500', label: 'S' },
  A: { min: 80, color: 'text-primary', label: 'A' },
  B: { min: 65, color: 'text-accent', label: 'B' },
  C: { min: 50, color: 'text-green-500', label: 'C' },
  F: { min: 0, color: 'text-destructive', label: 'F' },
}

export function getGrade(score: number): Grade {
  if (score >= 95) return 'S'
  if (score >= 80) return 'A'
  if (score >= 65) return 'B'
  if (score >= 50) return 'C'
  return 'F'
}

// ===== 音符类型中文名 =====
export const NOTE_TYPE_NAMES: Record<NoteType, { cn: string; sym: string }> = {
  WHOLE: { cn: '全音符', sym: '𝅝' },
  HALF: { cn: '二分音符', sym: '𝅗𝅥' },
  QUARTER: { cn: '四分音符', sym: '♩' },
  EIGHTH: { cn: '八分音符', sym: '♪' },
  SIXTEENTH: { cn: '十六分音符', sym: '𝅘𝅥𝅯' },
  REST: { cn: '休止符', sym: '𝄽' },
}
