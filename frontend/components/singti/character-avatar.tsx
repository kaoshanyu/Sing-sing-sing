"use client"

import type { Personality } from "./data"

// 16 人格专属配色
const PERSONALITY_STYLES: Record<number, { hue: number; hair: number; accent: string }> = {
  1:  { hue: 358, hair: 20,  accent: '#E85D5D' },  // 音准稽查官
  2:  { hue: 28,  hair: 30,  accent: '#FF8C42' },  // 即兴拆迁队
  3:  { hue: 35,  hair: 25,  accent: '#D4A574' },  // 人形指挥台
  4:  { hue: 345, hair: 15,  accent: '#FF6B8A' },  // KTV气氛组
  5:  { hue: 42,  hair: 35,  accent: '#FFC85A' },  // 人间小太阳
  6:  { hue: 155, hair: 40,  accent: '#7EC8A8' },  // 灵魂共鸣机
  7:  { hue: 265, hair: 10,  accent: '#B8A5D4' },  // 歌单收藏家
  8:  { hue: 188, hair: 45,  accent: '#6EC8D4' },  // 节奏打印机
  9:  { hue: 212, hair: 50,  accent: '#4A90D9' },  // 声乐研究员
  10: { hue: 255, hair: 5,   accent: '#8B7FD4' },  // 卧室录音师
  11: { hue: 5,   hair: 15,  accent: '#D4837F' },  // 音乐解构者
  12: { hue: 205, hair: 55,  accent: '#7FB4D4' },  // 温柔点唱机
  13: { hue: 0,   hair: 20,  accent: '#D4A0A0' },  // 黄昏氛围组
  14: { hue: 215, hair: 60,  accent: '#8EB0D4' },  // 隐形主唱
  15: { hue: 110, hair: 40,  accent: '#A8C8A0' },  // 浴室艺术家
  16: { hue: 35,  hair: 30,  accent: '#C8A87C' },  // 流浪歌者
}

interface CharacterAvatarProps {
  personality: Personality
  size?: number
}

export function CharacterAvatar({ personality, size = 100 }: CharacterAvatarProps) {
  const style = PERSONALITY_STYLES[personality.id] || PERSONALITY_STYLES[1]
  const [d0, d1, d2, d3] = personality.dims

  // 基于 dims 生成视觉特征
  const isExtrovert = d0 === 0  // 外放
  const isRigorous = d1 === 0   // 严谨
  const isEmotional = d2 === 0  // 感性
  const isControlling = d3 === 0 // 掌控

  const bgColor = `hsl(${style.hue}, 65%, 92%)`
  const primaryColor = style.accent
  const secondaryColor = `hsl(${style.hue}, 55%, 75%)`
  const skinColor = '#FDE8D0'
  const skinShadow = '#F0D4B8'
  const hairColor = `hsl(${style.hair}, 40%, ${isRigorous ? 40 : 50}%)`

  // 眼睛
  const eyeY = 48
  const eyeSpacing = 16
  const eyeL = 60 - eyeSpacing
  const eyeR = 60 + eyeSpacing

  const renderEyes = () => {
    if (isExtrovert) {
      // 大圆眼
      return (
        <>
          <circle cx={eyeL} cy={eyeY} r="6" fill="#3D2B1F" />
          <circle cx={eyeL - 1.5} cy={eyeY - 2} r="2" fill="white" opacity={0.8} />
          <circle cx={eyeR} cy={eyeY} r="6" fill="#3D2B1F" />
          <circle cx={eyeR - 1.5} cy={eyeY - 2} r="2" fill="white" opacity={0.8} />
        </>
      )
    }
    // 内敛小眼（弯线）
    return (
      <>
        <path d={`M${eyeL - 5} ${eyeY} Q${eyeL} ${eyeY - 5} ${eyeL + 5} ${eyeY}`} stroke="#3D2B1F" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d={`M${eyeR - 5} ${eyeY} Q${eyeR} ${eyeY - 5} ${eyeR + 5} ${eyeY}`} stroke="#3D2B1F" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </>
    )
  }

  // 嘴巴
  const renderMouth = () => {
    const mouthY = 62
    if (isExtrovert) {
      // 大笑
      return <path d={`M52 ${mouthY} Q60 ${mouthY + 12} 68 ${mouthY}`} stroke="#3D2B1F" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    }
    // 微笑
    return <path d={`M54 ${mouthY} Q60 ${mouthY + 6} 66 ${mouthY}`} stroke="#3D2B1F" strokeWidth="2" fill="none" strokeLinecap="round" />
  }

  // 腮红
  const renderBlush = () => {
    const blushColor = isEmotional ? '#FFB5B5' : '#FFD4B5'
    return (
      <>
        <ellipse cx={44} cy={57} rx="5" ry="3.5" fill={blushColor} opacity={0.5} />
        <ellipse cx={76} cy={57} rx="5" ry="3.5" fill={blushColor} opacity={0.5} />
      </>
    )
  }

  // 头发
  const renderHair = () => {
    if (isRigorous) {
      // 整齐短发
      return (
        <>
          <path d="M38 48 Q38 30 48 26 Q55 23 60 22 Q65 23 72 26 Q82 30 82 48" fill={hairColor} />
          <path d="M38 48 L38 42 Q40 38 45 36" fill={hairColor} />
          <path d="M82 48 L82 42 Q80 38 75 36" fill={hairColor} />
        </>
      )
    }
    // 随性乱发
    return (
      <>
        <path d="M35 45 Q32 28 42 22 Q50 18 60 16 Q70 18 78 22 Q88 28 85 45" fill={hairColor} />
        <path d="M38 42 Q34 25 40 18" stroke={hairColor} strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M82 42 Q86 25 80 18" stroke={hairColor} strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M55 20 Q52 12 58 10" stroke={hairColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </>
    )
  }

  // 装饰品
  const renderAccessory = () => {
    const accessories: React.ReactNode[] = []

    if (isControlling) {
      // 耳机 -> 掌控型
      accessories.push(
        <g key="headphone">
          <path d="M38 48 Q38 20 60 18 Q82 20 82 48" stroke={secondaryColor} strokeWidth="3" fill="none" />
          <rect x="34" y="44" width="8" height="14" rx="4" fill={secondaryColor} />
          <rect x="78" y="44" width="8" height="14" rx="4" fill={secondaryColor} />
        </g>
      )
    } else {
      // 即兴型 — 音符飘浮
      accessories.push(
        <g key="notes" opacity={0.6}>
          <path d="M88 30 L88 22 L94 20 L94 28" stroke={primaryColor} strokeWidth="1.8" fill="none" />
          <ellipse cx="86.5" cy="31" rx="3" ry="2.5" fill={primaryColor} />
          <ellipse cx="92.5" cy="29" rx="3" ry="2.5" fill={primaryColor} />
          <path d="M28 38 L28 30 L34 28 L34 36" stroke={primaryColor} strokeWidth="1.5" fill="none" />
          <ellipse cx="26.5" cy="39" rx="2.5" ry="2" fill={primaryColor} />
        </g>
      )
    }

    if (isRigorous) {
      // 眼镜
      accessories.push(
        <g key="glasses">
          <rect x={eyeL - 9} y={eyeY - 7} width="18" height="14" rx="4" stroke={secondaryColor} strokeWidth="1.5" fill="none" />
          <rect x={eyeR - 9} y={eyeY - 7} width="18" height="14" rx="4" stroke={secondaryColor} strokeWidth="1.5" fill="none" />
          <line x1={eyeL + 9} y1={eyeY} x2={eyeR - 9} y2={eyeY} stroke={secondaryColor} strokeWidth="1.5" />
        </g>
      )
    }

    if (isEmotional) {
      // 爱心
      accessories.push(
        <g key="heart">
          <path d="M96 50 Q96 45 92 45 Q88 45 88 50 Q88 55 92 58 Q96 55 96 50" fill={primaryColor} opacity={0.6} />
        </g>
      )
    } else {
      // 五角星
      accessories.push(
        <g key="star">
          <polygon points="92,42 94,47 99,47 95,50 96,55 92,52 88,55 89,50 85,47 90,47" fill={primaryColor} opacity={0.4} />
        </g>
      )
    }

    return accessories
  }

  return (
    <svg width={size} height={size} viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
      {/* 背景圆 */}
      <circle cx="60" cy="60" r="58" fill={bgColor} />
      <circle cx="60" cy="60" r="55" fill="none" stroke={secondaryColor} strokeWidth="1" opacity={0.4} />

      {/* 头发（底层） */}
      {renderHair()}

      {/* 脸 */}
      <circle cx="60" cy="55" r="26" fill={skinColor} />
      <circle cx="60" cy="55" r="26" fill="none" stroke={skinShadow} strokeWidth="0.5" opacity={0.3} />

      {/* 腮红 */}
      {renderBlush()}

      {/* 眼睛 */}
      {renderEyes()}

      {/* 嘴巴 */}
      {renderMouth()}

      {/* 装饰品 */}
      {renderAccessory()}
    </svg>
  )
}
