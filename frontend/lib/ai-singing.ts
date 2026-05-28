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

// ========== Mock Data ==========

const MOCK_SONGS: Song[] = [
  { id: 'moment', title: '瞬间的瞬间', artist: '本地示例歌曲', key: 'G', difficulty: '中高音', coverInitial: '瞬', status: 'ready', lyrics: LYRICS_MOMENT },
  { id: 'star', title: '小星星', artist: '儿歌精选', key: 'C', difficulty: '入门', coverInitial: '星', status: 'ready', lyrics: LYRICS_STAR },
  { id: 'moon', title: '月亮代表我的心', artist: '经典金曲', key: 'F', difficulty: '中音', coverInitial: '月', status: 'ready', lyrics: LYRICS_MOON },
  { id: 'river', title: '小河淌水', artist: '民歌集', key: 'D', difficulty: '高音', coverInitial: '河', status: 'needs_upload', lyrics: LYRICS_RIVER },
  { id: 'ocean', title: '大海', artist: '流行金曲', key: 'A', difficulty: '中高音', coverInitial: '海', status: 'needs_upload', lyrics: LYRICS_OCEAN },
]

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

export async function apiConvertVoice(
  _material: VoiceMaterial,
  _song: Song,
  onProgress?: (status: ConversionStatus) => void,
): Promise<ConversionResult> {
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
  return {
    jobId: `job_${Date.now()}`,
    urls: {
      final_mix: '/placeholder.mp3',
      final_wav: '/placeholder.wav',
      converted_vocal: '/placeholder.wav',
      accompaniment: '/placeholder.wav',
    },
  }
}

export async function apiUploadTargetSong(_songId: string, _file: File): Promise<void> {
  await new Promise(r => setTimeout(r, 1000))
}
