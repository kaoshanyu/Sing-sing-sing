"use client"

import { useState, useCallback } from "react"
import { Sparkles, AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { apiConvertVoice, CONVERSION_STATUS_LABELS } from "@/lib/ai-singing"
import type { VoiceMaterial, Song, ConversionResult, ConversionStatus } from "@/lib/ai-singing"

interface Props {
  voiceMaterial: VoiceMaterial | null
  selectedSong: Song | null
  onConversionComplete: (result: ConversionResult) => void
}

export function AIConversionPanel({ voiceMaterial, selectedSong, onConversionComplete }: Props) {
  const [status, setStatus] = useState<ConversionStatus>('idle')
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const disabledReason = !voiceMaterial
    ? '请先导入你的声音'
    : !selectedSong
    ? '请先选择歌曲'
    : selectedSong.status === 'needs_upload'
    ? '请先上传目标歌曲音频'
    : null

  const canGenerate = !disabledReason && !running

  const handleGenerate = useCallback(async () => {
    if (!voiceMaterial || !selectedSong) return
    setRunning(true)
    setError(null)
    setStatus('preparing')

    try {
      await apiConvertVoice(voiceMaterial, selectedSong, (s) => {
        setStatus(s)
      })
      setStatus('done')
      onConversionComplete({
        jobId: `job_${Date.now()}`,
        urls: {
          final_mix: '/placeholder.mp3',
          final_wav: '/placeholder.wav',
          converted_vocal: '/placeholder.wav',
          accompaniment: '/placeholder.wav',
        },
      })
    } catch (e) {
      setStatus('error')
      setError(e instanceof Error ? e.message : '生成失败')
    } finally {
      setRunning(false)
    }
  }, [voiceMaterial, selectedSong, onConversionComplete])

  const isProcessing = status !== 'idle' && status !== 'done' && status !== 'error'

  return (
    <div className="rounded-2xl bg-card border border-border/50 p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-6 h-6 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-bold">3</span>
        <h3 className="text-foreground font-semibold text-sm">AI音色替换</h3>
        {status === 'done' && (
          <span className="ml-auto text-xs text-accent-foreground flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> 已完成
          </span>
        )}
      </div>

      {/* Status card */}
      <div className="rounded-xl bg-secondary/50 p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            status === 'done' ? 'bg-accent/20' : isProcessing ? 'bg-primary/20' : 'bg-muted'
          }`}>
            {status === 'done' ? (
              <CheckCircle2 className="w-5 h-5 text-accent-foreground" />
            ) : isProcessing ? (
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground font-medium">
              {status === 'done' ? 'AI音色替换完成'
                : isProcessing ? CONVERSION_STATUS_LABELS[status]
                : '等待生成'}
            </p>
            <p className="text-xs text-muted-foreground">
              {status === 'done' ? '已准备好你的AI领唱版本，可以开始跟唱了'
                : isProcessing ? '正在处理中，请稍候...'
                : disabledReason || '准备好声音素材和歌曲后即可生成'}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        {isProcessing && (
          <div className="mt-3">
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{
                  width: `${({ preparing: 25, extracting: 50, processing: 75, mixing: 90 } as Record<string, number>)[status] || 0}%`
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={!canGenerate}
        className={`w-full h-11 rounded-xl text-sm font-semibold transition-all ${
          status === 'done'
            ? 'bg-accent/15 text-accent-foreground border border-accent/30 cursor-default'
            : canGenerate
            ? 'bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98]'
            : 'bg-muted text-muted-foreground cursor-not-allowed'
        }`}
      >
        {status === 'done' ? (
          <span className="flex items-center justify-center gap-2"><CheckCircle2 className="w-4 h-4" /> 已完成生成</span>
        ) : running ? (
          <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> 生成中...</span>
        ) : (
          <span className="flex items-center justify-center gap-2"><Sparkles className="w-4 h-4" /> 生成我的AI领唱</span>
        )}
      </button>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 mt-3 text-xs text-destructive">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}
    </div>
  )
}
