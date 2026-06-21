"use client"

import { useState, useCallback } from "react"
import { Mic, Sparkles, Music2, Search, ChevronLeft, Play } from "lucide-react"
import { VoiceMaterialPanel } from "./voice-material-panel"
import { AIConversionPanel } from "./ai-conversion-panel"
import { SingalongFullScreen } from "./singalong-fullscreen"
import { apiSearchSongs, getDemoSongs, generateDemoAudio, getDifficultyLabel } from "@/lib/ai-singing"
import type { VoiceMaterial, Song, ConversionResult } from "@/lib/ai-singing"

type Step =
  | 'select-song'
  | 'choose-mode'
  | 'voice-setup'
  | 'converting'
  | 'singing'

interface AiSingingTabProps {
  onBack?: () => void
}

export function AiSingingTab({ onBack }: AiSingingTabProps) {
  const [step, setStep] = useState<Step>('select-song')
  const [selectedSong, setSelectedSong] = useState<Song | null>(null)
  const [voiceMaterial, setVoiceMaterial] = useState<VoiceMaterial | null>(null)
  const [conversionResult, setConversionResult] = useState<ConversionResult | null>(null)
  const [directAudioUrl, setDirectAudioUrl] = useState<string | null>(null)

  const handleSelectSong = useCallback((song: Song) => {
    setSelectedSong(song)
    setStep('choose-mode')
  }, [])

  const handleBack = useCallback(() => {
    switch (step) {
      case 'choose-mode':
        setSelectedSong(null)
        setStep('select-song')
        break
      case 'voice-setup':
        setVoiceMaterial(null)
        setStep('choose-mode')
        break
      case 'converting':
        setConversionResult(null)
        setStep('voice-setup')
        break
      case 'singing':
        setStep('select-song')
        setSelectedSong(null)
        setVoiceMaterial(null)
        setConversionResult(null)
        setDirectAudioUrl(null)
        break
      default:
        onBack?.()
    }
  }, [step, onBack])

  // AI mode: after voice material is ready, go to conversion
  const handleVoiceReady = useCallback((material: VoiceMaterial | null) => {
    setVoiceMaterial(material)
    if (material) {
      setStep('converting')
    }
  }, [])

  // AI mode: conversion complete
  const handleConversionComplete = useCallback((result: ConversionResult) => {
    setConversionResult(result)
    setStep('singing')
  }, [])

  // Direct mode: use real accompaniment if available, otherwise generate demo
  const handleDirectSing = useCallback(async () => {
    if (!selectedSong) return

    if (selectedSong.accompanimentUrl) {
      // Use real audio file (absolute path, same origin — works on Vercel)
      const url = selectedSong.accompanimentUrl
      setDirectAudioUrl(url)
      setConversionResult({
        jobId: 'direct',
        urls: {
          final_mix: url,
          final_wav: url,
          converted_vocal: url,
          accompaniment: url,
        },
      })
    } else {
      // Fallback to generated demo
      const blob = await generateDemoAudio(30)
      const url = URL.createObjectURL(blob)
      setDirectAudioUrl(url)
      setConversionResult({
        jobId: 'direct',
        urls: {
          final_mix: url,
          final_wav: url,
          converted_vocal: url,
          accompaniment: url,
        },
      })
    }
    setStep('singing')
  }, [selectedSong])

  // Fullscreen
  if (step === 'singing' && selectedSong && conversionResult) {
    return (
      <SingalongFullScreen
        song={selectedSong}
        conversionResult={conversionResult}
        onBack={handleBack}
      />
    )
  }

  // Conversion panel
  if (step === 'converting' && selectedSong) {
    return (
      <div className="h-full bg-background flex flex-col">
        <div className="px-4 pt-6 pb-2 flex items-center gap-3">
          <button onClick={handleBack} className="w-9 h-9 rounded-full bg-card border border-border/50 flex items-center justify-center">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-foreground">AI 音色转换</h1>
            <p className="text-xs text-muted-foreground">{selectedSong.title} · {selectedSong.artist}</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <AIConversionPanel
            voiceMaterial={voiceMaterial}
            selectedSong={selectedSong}
            onConversionComplete={handleConversionComplete}
          />
        </div>
      </div>
    )
  }

  // Voice material setup (AI mode)
  if (step === 'voice-setup' && selectedSong) {
    return (
      <div className="h-full bg-background flex flex-col">
        <div className="px-4 pt-6 pb-2 flex items-center gap-3">
          <button onClick={handleBack} className="w-9 h-9 rounded-full bg-card border border-border/50 flex items-center justify-center">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-foreground">导入你的声音</h1>
            <p className="text-xs text-muted-foreground">上传或录制一段清唱，用于 AI 音色替换</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          <VoiceMaterialPanel onVoiceChange={handleVoiceReady} />
        </div>
      </div>
    )
  }

  // Mode selection
  if (step === 'choose-mode' && selectedSong) {
    return (
      <div className="h-full bg-background flex flex-col">
        <div className="px-4 pt-6 pb-2 flex items-center gap-3">
          <button onClick={handleBack} className="w-9 h-9 rounded-full bg-card border border-border/50 flex items-center justify-center">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">{selectedSong.title}</h1>
            <p className="text-xs text-muted-foreground">{selectedSong.artist} · {selectedSong.key}调 · {getDifficultyLabel(selectedSong.difficulty)}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {/* Song Preview Card */}
          <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-primary via-accent to-primary" />
            <div className="p-6 text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-4">
                <Music2 className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground">{selectedSong.title}</h2>
              <p className="text-sm text-muted-foreground">{selectedSong.artist}</p>
            </div>
          </div>

          {/* Two mode cards */}
          <div className="space-y-3">
            {/* AI 生成音色伴唱 */}
            <button
              onClick={() => setStep('voice-setup')}
              className="w-full p-5 rounded-2xl bg-card border border-border/50 hover:border-primary/40 hover:shadow-md transition-all text-left active:scale-[0.99]"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center shrink-0">
                  <Sparkles className="w-7 h-7 text-purple-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-foreground text-base">AI 生成音色伴唱</h3>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    用你的声音替换原唱音色，生成专属 AI 领唱版本，再跟着你的 AI 音色学唱
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-500 font-medium">需要上传清唱</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">Seed-VC 转换</span>
                  </div>
                </div>
                <ChevronLeft className="w-5 h-5 text-muted-foreground rotate-180" />
              </div>
            </button>

            {/* 直接演唱 */}
            <button
              onClick={handleDirectSing}
              className="w-full p-5 rounded-2xl bg-card border border-border/50 hover:border-primary/40 hover:shadow-md transition-all text-left active:scale-[0.99]"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center shrink-0">
                  <Play className="w-7 h-7 text-green-500 ml-1" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-foreground text-base">直接演唱</h3>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    不经过 AI 处理，直接跟着原曲伴奏演唱，适合想马上开唱的时候
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/15 text-green-500 font-medium">即时开唱</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-medium">无需准备</span>
                  </div>
                </div>
                <ChevronLeft className="w-5 h-5 text-muted-foreground rotate-180" />
              </div>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Default: Song selection (entry point)
  return (
    <div className="h-full bg-background flex flex-col">
      {/* Header */}
      <div className="px-4 pt-6 pb-3 border-b border-border/50">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-xl font-bold text-foreground">AI+音色整曲学习</h1>
            <p className="text-xs text-muted-foreground mt-0.5">选择歌曲，用你的声音学唱整首歌</p>
          </div>
          {onBack && (
            <button onClick={onBack} className="w-9 h-9 rounded-full bg-card border border-border/50 flex items-center justify-center">
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Song search + list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-6">
        <SongSearchList onSelect={handleSelectSong} />
      </div>
    </div>
  )
}

// ===== Inline Song Search + List =====
function SongSearchList({ onSelect }: { onSelect: (song: Song) => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Song[]>(() => getDemoSongs())

  const handleSearch = useCallback(async (q: string) => {
    setQuery(q)
    if (!q.trim()) {
      setResults(getDemoSongs())
      return
    }
    const songs = await apiSearchSongs(q)
    setResults(songs)
  }, [])

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={query}
          onChange={e => handleSearch(e.target.value)}
          placeholder="搜索歌名、歌手名..."
          className="w-full h-11 pl-10 pr-4 rounded-xl bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground outline-none focus:border-primary/60 transition-colors"
        />
      </div>

      {/* Song list */}
      <div className="space-y-2">
        {results.length === 0 && query.trim() && (
          <p className="text-center text-xs text-muted-foreground py-10">未找到匹配歌曲</p>
        )}
        {results.map(song => (
          <button
            key={song.id}
            onClick={() => onSelect(song)}
            className="w-full flex items-center gap-3 p-4 rounded-2xl bg-card border border-border/50 hover:border-primary/40 hover:shadow-sm transition-all text-left active:scale-[0.99]"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-primary text-lg font-bold shrink-0">
              {song.coverInitial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-foreground font-semibold truncate">{song.title}</p>
              <p className="text-xs text-muted-foreground">{song.artist} · {song.key}调</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{song.difficulty}</span>
              {song.status === 'ready' ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/15 text-accent-foreground">可唱</span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary">需上传音源</span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
