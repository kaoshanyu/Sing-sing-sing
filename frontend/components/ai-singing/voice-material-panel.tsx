"use client"

import { useState, useRef, useCallback } from "react"
import { Upload, Mic, Square, Trash2, Play, Pause, CheckCircle2 } from "lucide-react"
import type { VoiceMaterial } from "@/lib/ai-singing"

interface Props {
  onVoiceChange: (material: VoiceMaterial | null) => void
}

export function VoiceMaterialPanel({ onVoiceChange }: Props) {
  const [material, setMaterial] = useState<VoiceMaterial | null>(null)
  const [recording, setRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [playing, setPlaying] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval>>()
  const audioRef = useRef<HTMLAudioElement>(null)

  const getDuration = useCallback((blob: Blob): Promise<number> => {
    return new Promise(resolve => {
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audio.onloadedmetadata = () => {
        resolve(audio.duration)
        URL.revokeObjectURL(url)
      }
      audio.onerror = () => resolve(0)
    })
  }, [])

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    const duration = await getDuration(file)
    const m: VoiceMaterial = { file, url, name: file.name, duration, type: 'upload' }
    setMaterial(m)
    onVoiceChange(m)
  }, [getDuration, onVoiceChange])

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      chunksRef.current = []
      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder
      recorder.ondataavailable = e => chunksRef.current.push(e.data)
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const duration = await getDuration(blob)
        const url = URL.createObjectURL(blob)
        const m: VoiceMaterial = { file: blob, url, name: '现场录制', duration, type: 'recording' }
        setMaterial(m)
        onVoiceChange(m)
        stream.getTracks().forEach(t => t.stop())
      }
      recorder.start()
      setRecording(true)
      setRecordingTime(0)
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000)
    } catch {
      alert('需要麦克风权限，或请使用上传功能')
    }
  }, [getDuration, onVoiceChange])

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop()
    setRecording(false)
    clearInterval(timerRef.current)
  }, [])

  const handleClear = useCallback(() => {
    if (material) URL.revokeObjectURL(material.url)
    setMaterial(null)
    onVoiceChange(null)
  }, [material, onVoiceChange])

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return
    if (playing) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setPlaying(!playing)
  }, [playing])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div className="rounded-2xl bg-card border border-border/50 p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-6 h-6 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-bold">1</span>
        <h3 className="text-foreground font-semibold text-sm">导入我的声音</h3>
        {material && (
          <span className="ml-auto text-xs text-accent-foreground flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> 已导入
          </span>
        )}
      </div>

      {!material ? (
        <div className="flex gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border hover:border-primary/60 py-8 transition-colors bg-secondary/30"
          >
            <Upload className="w-6 h-6 text-primary" />
            <span className="text-sm text-foreground font-medium">上传音频</span>
            <span className="text-xs text-muted-foreground">m4a / mp3 / wav</span>
          </button>
          <button
            onClick={recording ? stopRecording : startRecording}
            className={`flex-1 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-8 transition-colors ${
              recording
                ? 'border-destructive bg-destructive/10'
                : 'border-border hover:border-primary/60 bg-secondary/30'
            }`}
          >
            {recording ? (
              <>
                <Square className="w-6 h-6 text-destructive fill-destructive" />
                <span className="text-sm text-destructive font-medium">停止</span>
                <span className="text-xs text-destructive">{formatTime(recordingTime)}</span>
              </>
            ) : (
              <>
                <Mic className="w-6 h-6 text-primary" />
                <span className="text-sm text-foreground font-medium">录制清唱</span>
                <span className="text-xs text-muted-foreground">建议 15-30 秒</span>
              </>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>
      ) : (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
          <button
            onClick={togglePlay}
            className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center hover:bg-primary/25 transition-colors shrink-0"
          >
            {playing ? <Pause className="w-4 h-4 text-primary" /> : <Play className="w-4 h-4 text-primary ml-0.5" />}
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground truncate font-medium">{material.name}</p>
            <p className="text-xs text-muted-foreground">{formatTime(material.duration)} · {material.type === 'recording' ? '现场录制' : '已上传'}</p>
          </div>
          <button
            onClick={handleClear}
            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-destructive/10 transition-colors shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5 text-destructive" />
          </button>
          <audio ref={audioRef} src={material.url} onEnded={() => setPlaying(false)} className="hidden" />
        </div>
      )}
    </div>
  )
}
