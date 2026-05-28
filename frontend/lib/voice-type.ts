// 音域 / 声部分类标准（科学音高记法）
// 参考：国际合唱分类标准（C3=中音C下面的C，即130.81Hz）

export interface VoiceTypeInfo {
  label: string       // 中文名，如"女高音"
  labelEn: string     // 英文名，如"Soprano"
  typicalRange: string // 典型音域展示
  lowNote: string     // 最低参考音
  highNote: string    // 最高参考音
  description: string // 一句话描述
  icon: string        // emoji 图标
}

export const VOICE_TYPES: Record<string, VoiceTypeInfo> = {
  soprano: {
    label: '女高音',
    labelEn: 'Soprano',
    typicalRange: 'C4 – C6',
    lowNote: 'C4',
    highNote: 'C6',
    description: '明亮华丽，能轻松驾驭高音区',
    icon: '🎭',
  },
  mezzoSoprano: {
    label: '女中音',
    labelEn: 'Mezzo-soprano',
    typicalRange: 'A3 – A5',
    lowNote: 'A3',
    highNote: 'A5',
    description: '温暖丰满，中音区富有表现力',
    icon: '🎭',
  },
  alto: {
    label: '女低音',
    labelEn: 'Alto',
    typicalRange: 'F3 – F5',
    lowNote: 'F3',
    highNote: 'F5',
    description: '深沉厚实，低音区浑厚有力',
    icon: '🎭',
  },
  tenor: {
    label: '男高音',
    labelEn: 'Tenor',
    typicalRange: 'B2 – G4',
    lowNote: 'B2',
    highNote: 'G4',
    description: '明亮高亢，擅长高音区的爆发',
    icon: '🎭',
  },
  baritone: {
    label: '男中音',
    labelEn: 'Baritone',
    typicalRange: 'G2 – E4',
    lowNote: 'G2',
    highNote: 'E4',
    description: '浑厚均衡，中音区饱满有力',
    icon: '🎭',
  },
  bass: {
    label: '男低音',
    labelEn: 'Bass',
    typicalRange: 'D2 – C4',
    lowNote: 'D2',
    highNote: 'C4',
    description: '低沉威严，最低的男声声部',
    icon: '🎭',
  },
}

// 音名字符串 → 半音数值（C0=0）
const NOTE_TO_SEMI: Record<string, number> = {
  'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
  'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
  'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11,
}

export function noteToSemitone(note: string): number {
  const match = note.match(/^([A-G][#b]?)(\d+)$/)
  if (!match) return 0
  const [, name, octave] = match
  const semi = NOTE_TO_SEMI[name]
  if (semi === undefined) return 0
  return semi + parseInt(octave) * 12
}

// 根据音域 + 性别推断面部分类
export function classifyVoiceType(
  lowest: string,
  highest: string,
  gender: 'male' | 'female'
): VoiceTypeInfo {
  const lowSemi = noteToSemitone(lowest)
  const highSemi = noteToSemitone(highest)

  if (gender === 'female') {
    // 检查与各类型的匹配度（取最低和最高音的平均偏置）
    const candidates = [
      { key: 'soprano', ...VOICE_TYPES.soprano, lowS: noteToSemitone('C4'), highS: noteToSemitone('C6') },
      { key: 'mezzoSoprano', ...VOICE_TYPES.mezzoSoprano, lowS: noteToSemitone('A3'), highS: noteToSemitone('A5') },
      { key: 'alto', ...VOICE_TYPES.alto, lowS: noteToSemitone('F3'), highS: noteToSemitone('F5') },
    ]
    let best = candidates[0]
    let bestScore = -Infinity
    for (const c of candidates) {
      const lowDiff = Math.abs(lowSemi - c.lowS)
      const highDiff = Math.abs(highSemi - c.highS)
      const score = -(lowDiff * 0.4 + highDiff * 0.6) // weighted toward high note
      if (score > bestScore) {
        bestScore = score
        best = c
      }
    }
    return VOICE_TYPES[best.key as keyof typeof VOICE_TYPES]
  } else {
    const candidates = [
      { key: 'tenor', ...VOICE_TYPES.tenor, lowS: noteToSemitone('B2'), highS: noteToSemitone('G4') },
      { key: 'baritone', ...VOICE_TYPES.baritone, lowS: noteToSemitone('G2'), highS: noteToSemitone('E4') },
      { key: 'bass', ...VOICE_TYPES.bass, lowS: noteToSemitone('D2'), highS: noteToSemitone('C4') },
    ]
    let best = candidates[0]
    let bestScore = -Infinity
    for (const c of candidates) {
      const lowDiff = Math.abs(lowSemi - c.lowS)
      const highDiff = Math.abs(highSemi - c.highS)
      const score = -(lowDiff * 0.4 + highDiff * 0.6)
      if (score > bestScore) {
        bestScore = score
        best = c
      }
    }
    return VOICE_TYPES[best.key as keyof typeof VOICE_TYPES]
  }
}
