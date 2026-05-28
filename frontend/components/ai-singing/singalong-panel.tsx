"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Play, Pause, Mic, Volume2, Disc3, Music2, Maximize2 } from "lucide-react"
import type { Song, ConversionResult } from "@/lib/ai-singing"

interface Props {
  conversionResult: ConversionResult | null
  song: Song | null
  onEnterFullScreen: () => void
}

export function SingalongPanel({ conversionResult, song, onEnterFullScreen }: Props) {
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)

  const audioRef = useRef<HTMLAudioElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval>>()

  const isReady = !!conversionResult && !!song

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return
    if (playing) {
      audioRef.current.pause()
      clearInterval(timerRef.current)
    } else {
      audioRef.current.play()
      timerRef.current = setInterval(() => {
        if (audioRef.current) {
          setProgress((audioRef.current.currentTime / (audioRef.current.duration || 1)) * 100)
        }
      }, 200)
    }
    setPlaying(!playing)
  }, [playing])

  useEffect(() => {
    return () => clearInterval(timerRef.current)
  }, [])

  useEffect(() => {
    setPlaying(false)
    setProgress(0)
  }, [conversionResult])

  return (
    <div className="rounded-2xl bg-card border border-border/50 p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-6 h-6 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-bold">4</span>
        <h3 className="text-foreground font-semibold text-sm">开始跟唱</h3>
        {isReady && (
          <button
            onClick={onEnterFullScreen}
            className="ml-auto flex items-center gap-1 text-xs text-primary font-medium hover:underline"
          >
            <Maximize2 className="w-3 h-3" />
            进入全屏伴唱
          </button>
        )}
      </div>

      {!isReady ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Music2 className="w-10 h-10 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">完成AI生成后，即可在这里用你的声音跟唱</p>
        </div>
      ) : (
        <div>
          {/* Song info */}
          <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-secondary/50">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0">
              <Disc3 className="w-6 h-6 text-foreground/60" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-foreground font-semibold truncate">{song!.title}</p>
              <p className="text-xs text-muted-foreground">{song!.artist} · {song!.key}调</p>
            </div>
          </div>

          {/* Waveform preview */}
          <div className="h-16 rounded-xl bg-secondary/50 border border-border/50 mb-4 flex items-center justify-center overflow-hidden">
            {playing ? (
              <div className="flex items-end gap-0.5 h-10">
                {Array.from({ length: 40 }, (_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-primary/50 rounded-full"
                    style={{
                      height: `${20 + Math.random() * 60}%`,
                      animation: `pulse-bar 0.4s ${i * 0.05}s infinite alternate`
                    }}
                  />
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">音高线预览</p>
            )}
          </div>

          {/* Mini player */}
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 active:scale-95 transition-all shrink-0"
            >
              {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>
            <div className="flex-1">
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
            <button
              onClick={onEnterFullScreen}
              className="px-4 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-1.5"
            >
              <Maximize2 className="w-4 h-4" />
              伴唱
            </button>
          </div>

          {/* Hidden audio */}
          {conversionResult && (
            <audio
              ref={audioRef}
              src={conversionResult.urls.final_mix}
              onEnded={() => { setPlaying(false); clearInterval(timerRef.current); setProgress(100) }}
              className="hidden"
            />
          )}
        </div>
      )}
    </div>
  )
}
