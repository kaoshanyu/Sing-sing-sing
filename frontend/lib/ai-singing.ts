"use client"

// ========== Types ==========

export interface VoiceMaterial {
  file: File | Blob
  url: string
  name: string
  duration: number
  type: 'upload' | 'recording'
}

export interface LyricLine {
  time: number
  text: string
}

export interface Song {
  id: string
  title: string
  artist: string
  key: string
  difficulty: string
  coverInitial: string
  status: 'ready' | 'needs_upload'
  lyrics: LyricLine[]
}

export interface ConversionUrls {
  final_mix: string
  final_wav: string
  converted_vocal: string
  accompaniment: string
}

export interface ConversionResult {
  jobId: string
  urls: ConversionUrls
}

export type ConversionStatus =
  | 'idle'
  | 'preparing'
  | 'extracting'
  | 'processing'
  | 'mixing'
  | 'done'
  | 'error'

export const CONVERSION_STATUS_LABELS: Record<ConversionStatus, string> = {
  idle: '等待素材和歌曲',
  preparing: '正在准备音频素材',
  extracting: '正在提取你的音色提示',
  processing: '正在调用本地 Seed-VC 模型',
  mixing: '正在混回伴奏并导出音频',
  done: 'AI音色替换完成',
  error: '生成失败',
}

export const CONVERSION_CHAIN = [
  { key: 'reference', label: '参考清唱' },
  { key: 'prompt', label: '声线提示' },
  { key: 'target', label: '目标歌人声' },
  { key: 'seedvc', label: 'Seed-VC 转换' },
  { key: 'mix', label: '混回伴奏' },
] as const

// ========== Lyrics Data ==========

const LYRICS_STAR = [
  { time: 0, text: "一闪一闪亮晶晶" },
  { time: 4, text: "满天都是小星星" },
  { time: 8, text: "挂在天上放光明" },
  { time: 12, text: "好像许多小眼睛" },
  { time: 16, text: "一闪一闪亮晶晶" },
  { time: 20, text: "满天都是小星星" },
]

const LYRICS_MOON = [
  { time: 0, text: "你问我爱你有多深" },
  { time: 4.5, text: "我爱你有几分" },
  { time: 8, text: "我的情也真" },
  { time: 10.5, text: "我的爱也真" },
  { time: 13, text: "月亮代表我的心" },
  { time: 18, text: "你问我爱你有多深" },
  { time: 22.5, text: "我爱你有几分" },
  { time: 26, text: "我的情不移" },
  { time: 28.5, text: "我的爱不变" },
  { time: 31, text: "月亮代表我的心" },
  { time: 36, text: "轻轻的一个吻" },
  { time: 40, text: "已经打动我的心" },
  { time: 44, text: "深深的一段情" },
  { time: 48, text: "教我思念到如今" },
  { time: 52, text: "你问我爱你有多深" },
  { time: 56.5, text: "我爱你有几分" },
  { time: 60, text: "你去想一想" },
  { time: 62.5, text: "你去看一看" },
  { time: 65, text: "月亮代表我的心" },
]

const LYRICS_MOMENT = [
  { time: 0, text: "就在那一瞬间" },
  { time: 4, text: "时间仿佛停止" },
  { time: 8, text: "你的笑容定格在" },
  { time: 12, text: "我记忆的深处" },
  { time: 16, text: "每一个瞬间" },
  { time: 20, text: "都是永恒的诗篇" },
  { time: 24, text: "时光流转不停歇" },
  { time: 28, text: "唯有思念不变" },
]

const LYRICS_RIVER = [
  { time: 0, text: "小河淌水清悠悠" },
  { time: 5, text: "月亮挂在柳梢头" },
  { time: 10, text: "歌声飘过山岗去" },
  { time: 15, text: "捎去我的相思愁" },
  { time: 20, text: "小河淌水不停流" },
  { time: 25, text: "带走多少春与秋" },
]

const LYRICS_OCEAN = [
  { time: 0, text: "大海啊大海" },
  { time: 5, text: "是我生长的地方" },
  { time: 10, text: "海风吹海浪涌" },
  { time: 15, text: "随我飘流四方" },
  { time: 20, text: "大海啊大海" },
  { time: 25, text: "就像妈妈一样" },
]

const LYRICS_TWINKLE = [
  { time: 0, text: "Twinkle twinkle little star" },
  { time: 4, text: "How I wonder what you are" },
  { time: 8, text: "Up above the world so high" },
  { time: 12, text: "Like a diamond in the sky" },
]

const LYRICS_JASMINE = [
  { time: 0, text: "好一朵美丽的茉莉花" },
  { time: 4, text: "好一朵美丽的茉莉花" },
  { time: 8, text: "芬芳美丽满枝桠" },
  { time: 12, text: "又香又白人人夸" },
  { time: 16, text: "让我来将你摘下" },
  { time: 20, text: "送给别人家" },
  { time: 24, text: "茉莉花呀茉莉花" },
]

const LYRICS_LITTLE = [
  { time: 0, text: "世上只有妈妈好" },
  { time: 4, text: "有妈的孩子像个宝" },
  { time: 8, text: "投进了妈妈的怀抱" },
  { time: 12, text: "幸福享不了" },
  { time: 16, text: "世上只有妈妈好" },
  { time: 20, text: "没妈的孩子像根草" },
  { time: 24, text: "离开妈妈的怀抱" },
  { time: 28, text: "幸福哪里找" },
]

const LYRICS_FIND = [
  { time: 0, text: "曾经在幽幽暗暗反反复复中追问" },
  { time: 5, text: "才知道平平淡淡从从容容才是真" },
  { time: 10, text: "再回首恍然如梦" },
  { time: 13, text: "再回首我心依旧" },
  { time: 16, text: "只有那无尽的长路伴着我" },
]

// ========== Mock Data ==========

const MOCK_SONGS: Song[] = [
  // 入门 — 简单旋律，适合初次练习
  { id: 'twinkle', title: 'Twinkle Twinkle', artist: '经典儿歌', key: 'C', difficulty: '入门', coverInitial: 'T', status: 'ready', lyrics: LYRICS_TWINKLE },
  { id: 'jasmine', title: '茉莉花', artist: '中国民歌', key: 'D', difficulty: '入门', coverInitial: '茉', status: 'ready', lyrics: LYRICS_JASMINE },
  { id: 'star', title: '小星星', artist: '儿歌精选', key: 'C', difficulty: '入门', coverInitial: '星', status: 'ready', lyrics: LYRICS_STAR },
  { id: 'little', title: '世上只有妈妈好', artist: '经典儿歌', key: 'C', difficulty: '入门', coverInitial: '妈', status: 'ready', lyrics: LYRICS_LITTLE },
  // 中音 — 经典流行
  { id: 'moon', title: '月亮代表我的心', artist: '邓丽君', key: 'F', difficulty: '中音', coverInitial: '月', status: 'ready', lyrics: LYRICS_MOON },
  { id: 'ocean', title: '大海', artist: '张雨生', key: 'A', difficulty: '中音', coverInitial: '海', status: 'ready', lyrics: LYRICS_OCEAN },
  { id: 'find', title: '再回首', artist: '姜育恒', key: 'G', difficulty: '中音', coverInitial: '再', status: 'ready', lyrics: LYRICS_FIND },
  { id: 'moment', title: '瞬间的瞬间', artist: '示例歌曲', key: 'G', difficulty: '中音', coverInitial: '瞬', status: 'ready', lyrics: LYRICS_MOMENT },
  // 高音 — 需要上传音源
  { id: 'river', title: '小河淌水', artist: '云南民歌', key: 'D', difficulty: '高音', coverInitial: '河', status: 'needs_upload', lyrics: LYRICS_RIVER },
]

// ========== Audio Generation ==========

/** 生成一段简单的 demo 音频（WAV Blob） */
export async function generateDemoAudio(durationSec = 30): Promise<Blob> {
  const sampleRate = 44100
  const numSamples = sampleRate * durationSec
  const buffer = new ArrayBuffer(44 + numSamples * 2)
  const view = new DataView(buffer)

  // WAV header
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i))
  }
  writeString(0, 'RIFF')
  view.setUint32(4, 36 + numSamples * 2, true)
  writeString(8, 'WAVE')
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true) // PCM
  view.setUint16(22, 1, true) // mono
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeString(36, 'data')
  view.setUint32(40, numSamples * 2, true)

  // 生成简单的旋律（C大调音阶片段循环）
  const melody = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25] // C4-C5
  const noteLen = sampleRate * 0.5 // 每个音 0.5 秒
  const beatLen = sampleRate * 0.25

  for (let i = 0; i < numSamples; i++) {
    const noteIdx = Math.floor(i / noteLen) % melody.length
    const freq = melody[noteIdx]
    const t = i / sampleRate
    const noteT = (i % noteLen) / noteLen

    // 用多个泛音让音色更丰富
    let sample = 0
    sample += Math.sin(2 * Math.PI * freq * t) * 0.25
    sample += Math.sin(2 * Math.PI * freq * 2 * t) * 0.08
    sample += Math.sin(2 * Math.PI * freq * 3 * t) * 0.04

    // 简单的包络
    const attack = Math.min(1, noteT * 20)
    const release = Math.min(1, (1 - noteT) * 10)
    const envelope = Math.min(attack, release)

    // 节拍伴奏（简单的鼓点）
    const beatPhase = (i % beatLen) / beatLen
    const kick = beatPhase < 0.1 ? Math.cos(beatPhase * 20) * 0.1 * (1 - beatPhase / 0.1) : 0

    const val = (sample * envelope + kick) * 0.5
    const clamped = Math.max(-1, Math.min(1, val))
    const int16 = clamped < 0 ? clamped * 0x8000 : clamped * 0x7FFF
    view.setInt16(44 + i * 2, int16, true)
  }

  return new Blob([buffer], { type: 'audio/wav' })
}

// ========== Mock API ==========

export async function apiSearchSongs(query: string): Promise<Song[]> {
  await new Promise(r => setTimeout(r, 400 + Math.random() * 300))
  if (!query.trim()) return []
  const q = query.toLowerCase()
  return MOCK_SONGS.filter(
    s =>
      s.title.toLowerCase().includes(q) ||
      s.artist.toLowerCase().includes(q) ||
      s.difficulty.toLowerCase().includes(q),
  )
}

export function getDemoSongs(): Song[] {
  return MOCK_SONGS.filter(s => s.status === 'ready')
}

export function getDifficultyLabel(difficulty: string): string {
  const labels: Record<string, string> = {
    '入门': '🎯 新手友好',
    '中音': '🎤 经典必唱',
    '高音': '🔥 高手挑战',
  }
  return labels[difficulty] || difficulty
}

export async function apiConvertVoice(
  material: VoiceMaterial,
  song: Song,
  onProgress?: (status: ConversionStatus) => void,
): Promise<ConversionResult> {
  const VOICE_SERVER = process.env.NEXT_PUBLIC_VOICE_API_URL || 'https://unopposed-flyaway-unthawed.ngrok-free.dev'
  const VOICE_PREFIX = '/api/v1'

  // Check if voice server is available
  let serverAvailable = false
  try {
    const healthRes = await fetch(`${VOICE_SERVER}/health`, { signal: AbortSignal.timeout(2000) })
    serverAvailable = healthRes.ok
  } catch {
    // Server not running
  }

  if (serverAvailable) {
    // ===== Real voice server pipeline =====
    onProgress?.('preparing')

    // 1. Upload voice material as tone profile
    onProgress?.('extracting')
    const profileForm = new FormData()
    profileForm.append('file', material.file, material.name.endsWith('.webm') ? 'recording.webm' : 'reference_voice.wav')
    profileForm.append('name', 'default')
    const profileRes = await fetch(`${VOICE_SERVER}${VOICE_PREFIX}/voice/profile`, {
      method: 'POST',
      body: profileForm,
    })
    const profileBody = await profileRes.json()
    if (profileBody.code !== 0) {
      throw new Error(profileBody.detail || '音色档案创建失败')
    }

    // 2. Generate demo audio and convert it
    onProgress?.('processing')
    const demoBlob = await generateDemoAudio(30)
    const convertForm = new FormData()
    convertForm.append('vocals', demoBlob, 'target_vocals.wav')
    convertForm.append('profile_name', 'default')
    convertForm.append('strength', '0.72')
    const convertRes = await fetch(`${VOICE_SERVER}${VOICE_PREFIX}/voice/convert`, {
      method: 'POST',
      body: convertForm,
    })
    const convertBody = await convertRes.json()
    if (convertBody.code !== 0) {
      throw new Error(convertBody.detail || '音色转换失败')
    }

    onProgress?.('mixing')
    // Wait a moment for mixing to finalize
    await new Promise(r => setTimeout(r, 500))

    onProgress?.('done')
    const data = convertBody.data
    // Build full URLs for the audio files
    const baseUrl = VOICE_SERVER
    return {
      jobId: `job_${Date.now()}`,
      urls: {
        final_mix: data.mixed_url ? `${baseUrl}${data.mixed_url}` : `${baseUrl}${data.converted_vocals_url}`,
        final_wav: `${baseUrl}${data.converted_vocals_url}`,
        converted_vocal: `${baseUrl}${data.converted_vocals_url}`,
        accompaniment: '',
      },
    }
  }

  // ===== Fallback: mock conversion =====
  const steps: { status: ConversionStatus; delay: number }[] = [
    { status: 'preparing', delay: 600 },
    { status: 'extracting', delay: 800 },
    { status: 'processing', delay: 1200 },
    { status: 'mixing', delay: 800 },
  ]
  for (const step of steps) {
    await new Promise(r => setTimeout(r, step.delay + Math.random() * 400))
    onProgress?.(step.status)
  }
  onProgress?.('done')

  const audioBlob = await generateDemoAudio(30)
  const audioUrl = URL.createObjectURL(audioBlob)
  return {
    jobId: `job_${Date.now()}`,
    urls: {
      final_mix: audioUrl,
      final_wav: audioUrl,
      converted_vocal: audioUrl,
      accompaniment: audioUrl,
    },
  }
}

export async function apiUploadTargetSong(_songId: string, _file: File): Promise<void> {
  await new Promise(r => setTimeout(r, 1000))
}
