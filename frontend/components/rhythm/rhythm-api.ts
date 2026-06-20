import { Unit, Level, Question, SubmitResult, Instrument, AudioTrack } from './types'
import { getGrade } from './types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''
const API_PREFIX = '/api/v1'

function getToken(): string | null {
  try {
    return localStorage.getItem('auth_token')
  } catch {
    return null
  }
}

// ===== Mock Data =====

const MOCK_UNITS: Unit[] = [
  { unit_id: 1, unit_name: '基础拍号与强弱感知', unit_description: '学习 BPM、二拍子、四拍子、三拍子的基本概念', unit_order: 1, is_unlocked: true, best_score: 85 },
  { unit_id: 2, unit_name: '时值拆解与静默', unit_description: '全音符到十六分音符的视觉映射与时长关系', unit_order: 2, is_unlocked: true, best_score: null },
  { unit_id: 3, unit_name: '延音与切分音', unit_description: '延音线、切分音和反拍的节奏魅力', unit_order: 3, is_unlocked: true, best_score: null },
  { unit_id: 4, unit_name: '6/8 拍与三连音', unit_description: '复合拍号和三连音的律动感', unit_order: 4, is_unlocked: false, best_score: null },
  { unit_id: 5, unit_name: '复合节奏', unit_description: '双手独立打不同节奏的协调训练', unit_order: 5, is_unlocked: false, best_score: null },
  { unit_id: 6, unit_name: '节奏制作人', unit_description: '综合运用所学节奏知识创作自己的节奏 Loop', unit_order: 6, is_unlocked: false, best_score: null },
]

function mockLevels(unitId: number): Level[] {
  const levels: Level[] = []
  const count = unitId === 6 ? 1 : unitId === 1 ? 4 : 3
  const timeSigs = ['2/4', '3/4', '4/4', '6/8', '9/8', '12/8']
  for (let i = 0; i < count; i++) {
    levels.push({
      level_id: unitId * 100 + i + 1,
      unit_id: unitId,
      difficulty: i + 1,
      bpm_range_min: 60 + i * 20,
      bpm_range_max: 100 + i * 20,
      time_signature: timeSigs[i % timeSigs.length],
      subdivision_level: 1 + Math.floor(i / 2),
      is_unlocked: i === 0,
      is_completed: false,
      best_score: null,
    })
  }
  return levels
}

const QUESTION_TYPES_FOR_UNIT: Record<number, string[]> = {
  1: ['RHYTHM_CLASSIFICATION', 'ACCENT_DETECTION'],
  2: ['RHYTHM_ECHO'],
  3: ['UPBEAT_TRAINING', 'SIGHT_READING'],
  4: ['SPOT_THE_BUG', 'METRIC_MODULATION'],
  5: ['SPLIT_BRAIN', 'ANTI_DISTRACTION'],
  6: ['PRODUCER_SANDBOX'],
}

// Seed-based mock question generator
let questionSeed = 0
function mockQuestion(levelId: number): Question {
  questionSeed++
  const unitId = Math.floor(levelId / 100)
  const types = QUESTION_TYPES_FOR_UNIT[unitId] || ['RHYTHM_CLASSIFICATION']
  const qType = types[questionSeed % types.length] as any
  const bpm = 80 + (questionSeed * 10) % 80
  const timeSig = '4/4'

  const base: Question = {
    question_id: 1000 + questionSeed,
    level_id: levelId,
    question_type: qType,
    bpm,
    time_signature: timeSig,
    duration_ms: 32000,
    audio_url: '',
    question_payload: {},
    expected_hit_times_ms: [],
  }

  // Generate payload per type
  if (qType === 'RHYTHM_CLASSIFICATION') {
    base.question_payload = { options: ['2/4', '3/4', '4/4'] }
  } else if (qType === 'RHYTHM_PUZZLE') {
    base.question_payload = {
      count_options: [3, 4, 5, 6],
      note_pool: [
        { note_id: 'n1', note_type: 'WHOLE', duration_ms: 2000 },
        { note_id: 'n2', note_type: 'HALF', duration_ms: 1000 },
        { note_id: 'n3', note_type: 'QUARTER', duration_ms: 500 },
        { note_id: 'n4', note_type: 'EIGHTH', duration_ms: 250 },
        { note_id: 'n5', note_type: 'SIXTEENTH', duration_ms: 125 },
        { note_id: 'n6', note_type: 'REST', duration_ms: 500 },
      ],
    }
  } else if (qType === 'RHYTHM_ECHO') {
    base.question_payload = {
      echo_steps: [0, 4, 6, 8],
      grid_steps: 16,
      skill_goal: '跟着目标节奏点击。',
      prompt: '目标音出现时点击，空拍时不要点。',
    }
    base.expected_hit_times_ms = [0, 1200, 1800, 2400]
  } else if (qType === 'SIGHT_READING') {
    base.question_payload = {
      score_sheet: [
        { note_type: 'QUARTER', start_ms: 0 },
        { note_type: 'EIGHTH', start_ms: 500 },
        { note_type: 'QUARTER', start_ms: 1000 },
        { note_type: 'HALF', start_ms: 1500 },
      ],
    }
  } else if (qType === 'SPOT_THE_BUG') {
    base.question_payload = {
      score_sheet: [
        { note_type: 'QUARTER', start_ms: 0 },
        { note_type: 'QUARTER', start_ms: 500 },
        { note_type: 'EIGHTH', start_ms: 1000 },
        { note_type: 'HALF', start_ms: 1500 },
        { note_type: 'QUARTER', start_ms: 2500 },
      ],
    }
  } else if (qType === 'PRODUCER_SANDBOX') {
    base.question_payload = { available_instruments: [1, 2, 3, 4, 5] }
  }

  // Generate expected hit times
  const interval = 60000 / bpm
  for (let i = 0; i < 32; i++) {
    base.expected_hit_times_ms.push(Math.round(i * interval * 2))
  }

  return base
}

const MOCK_INSTRUMENTS: Instrument[] = [
  { instrument_id: 1, name: '底鼓', icon: '🥁', sound_url: '' },
  { instrument_id: 2, name: '军鼓', icon: '🪘', sound_url: '' },
  { instrument_id: 3, name: '踩镲', icon: '🔔', sound_url: '' },
  { instrument_id: 4, name: '沙锤', icon: '🪇', sound_url: '' },
  { instrument_id: 5, name: '非洲鼓', icon: '🪘', sound_url: '' },
]

const MOCK_AUDIO_TRACKS: AudioTrack[] = [
  { track_id: 1, name: '流行钢琴', audio_url: '', bpm: 100 },
  { track_id: 2, name: '民谣吉他', audio_url: '', bpm: 90 },
  { track_id: 3, name: '电子合成', audio_url: '', bpm: 120 },
]

// ===== API Client =====

async function apiGet<T>(path: string): Promise<T> {
  const token = getToken()
  const res = await fetch(`${API_BASE}${API_PREFIX}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })
  const body = await res.json()
  if (body.code !== 0) throw new Error(body.detail || '请求失败')
  return body.data as T
}

async function apiPost<T>(path: string, data?: any): Promise<T> {
  const token = getToken()
  const res = await fetch(`${API_BASE}${API_PREFIX}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: data ? JSON.stringify(data) : undefined,
  })
  const body = await res.json()
  if (body.code !== 0) throw new Error(body.detail || '请求失败')
  return body.data as T
}

// ===== Public API Functions =====

export async function fetchUnits(): Promise<Unit[]> {
  try { return await apiGet<Unit[]>('/units') } catch { return MOCK_UNITS }
}

export async function fetchUnit(unitId: number): Promise<Unit> {
  try { return await apiGet<Unit>(`/units/${unitId}`) } catch { return MOCK_UNITS.find(u => u.unit_id === unitId) || MOCK_UNITS[0] }
}

export async function fetchLevels(unitId: number): Promise<Level[]> {
  try { return await apiGet<Level[]>(`/levels?unit_id=${unitId}`) } catch { return mockLevels(unitId) }
}

export async function generateQuestion(levelId: number): Promise<Question> {
  try { return await apiPost<Question>(`/levels/${levelId}/generate`) } catch { return mockQuestion(levelId) }
}

export async function submitAnswer(questionId: number, answer: any): Promise<SubmitResult> {
  try {
    return await apiPost<SubmitResult>(`/questions/${questionId}/submit`, answer)
  } catch {
    // Mock result
    const score = 60 + Math.round(Math.random() * 40)
    const grade = getGrade(score)
    return {
      score,
      grade,
      feedback: score >= 80 ? '表现不错！节奏感很好，继续保持！' : '还需要多加练习，注意听准强拍位置。',
      is_passed: score >= 60,
      statistics: {
        hit_count: Math.round(10 + Math.random() * 10),
        miss_count: Math.round(2 + Math.random() * 5),
        avg_deviation_ms: 20 + Math.round(Math.random() * 40),
        max_deviation_ms: 50 + Math.round(Math.random() * 80),
        deviation_list: [],
      },
      radar_chart: null,
      reward: null,
    }
  }
}

export async function fetchInstruments(): Promise<Instrument[]> {
  try { return await apiGet<Instrument[]>('/instruments') } catch { return MOCK_INSTRUMENTS }
}

export async function fetchAudioTracks(): Promise<AudioTrack[]> {
  try { return await apiGet<AudioTrack[]>('/audio-tracks') } catch { return MOCK_AUDIO_TRACKS }
}
