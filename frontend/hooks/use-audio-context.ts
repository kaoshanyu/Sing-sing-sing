"use client"

import { useRef, useCallback } from "react"

// 共享 AudioContext 单例（浏览器限制通常 6-8 个并发）
let globalAudioCtx: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!globalAudioCtx || globalAudioCtx.state === 'closed') {
    globalAudioCtx = new AudioContext()
  }
  if (globalAudioCtx.state === 'suspended') {
    globalAudioCtx.resume()
  }
  return globalAudioCtx
}

export function useAudioContext() {
  const ctxRef = useRef<AudioContext | null>(null)

  const getCtx = useCallback((): AudioContext => {
    if (!ctxRef.current || ctxRef.current.state === 'closed') {
      ctxRef.current = getAudioContext()
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume()
    }
    return ctxRef.current
  }, [])

  const playNote = useCallback((freq: number, startTime: number, duration: number, type: OscillatorType = 'sine') => {
    try {
      const ctx = getCtx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = type
      osc.frequency.setValueAtTime(freq, startTime)
      gain.gain.setValueAtTime(0.3, startTime)
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(startTime)
      osc.stop(startTime + duration + 0.1)
    } catch (e) {
      // AudioContext not available
    }
  }, [getCtx])

  const playTone = useCallback((freq: number, duration: number = 0.8, type: OscillatorType = 'sine') => {
    const ctx = getCtx()
    const now = ctx.currentTime
    playNote(freq, now, duration, type)
  }, [getCtx, playNote])

  return { getAudioContext: getCtx, playTone, playNote }
}
