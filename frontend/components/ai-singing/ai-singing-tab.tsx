"use client"

import { useState } from "react"
import { ChevronLeft, Mic, Search, Sparkles, Music2 } from "lucide-react"
import { VoiceMaterialPanel } from "./voice-material-panel"
import { SongSearchPanel } from "./song-search-panel"
import { AIConversionPanel } from "./ai-conversion-panel"
import { SingalongPanel } from "./singalong-panel"
import { SingalongFullScreen } from "./singalong-fullscreen"
import type { VoiceMaterial, Song, ConversionResult } from "@/lib/ai-singing"

const STEPS = [
  { icon: Mic, label: "导入声音" },
  { icon: Search, label: "选歌曲" },
  { icon: Sparkles, label: "AI生成" },
  { icon: Music2, label: "开始唱" },
]

interface AiSingingTabProps {
  onBack?: () => void
}

export function AiSingingTab({ onBack }: AiSingingTabProps) {
  const [voiceMaterial, setVoiceMaterial] = useState<VoiceMaterial | null>(null)
  const [selectedSong, setSelectedSong] = useState<Song | null>(null)
  const [conversionResult, setConversionResult] = useState<ConversionResult | null>(null)
  const [showFullscreen, setShowFullscreen] = useState(false)

  const currentStep = (() => {
    if (!voiceMaterial) return 0
    if (!selectedSong) return 1
    if (!conversionResult) return 2
    return 3
  })()

  // Full-screen karaoke mode
  if (showFullscreen && selectedSong && conversionResult) {
    return (
      <SingalongFullScreen
        song={selectedSong}
        conversionResult={conversionResult}
        onBack={() => setShowFullscreen(false)}
      />
    )
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="px-4 pt-5 pb-3 flex items-center gap-3 border-b border-border/50">
        {onBack && (
          <button
            onClick={onBack}
            className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0"
          >
            <ChevronLeft className="w-4 h-4 text-foreground" />
          </button>
        )}
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">AI+音色整曲学习</h1>
          <p className="text-xs text-muted-foreground">用你的声音学唱整首歌</p>
        </div>
        <span className="text-[10px] px-2 py-1 rounded-full bg-primary/15 text-primary font-medium">
          Seed-VC
        </span>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-around px-6 py-3 bg-secondary/30 border-b border-border/30">
        {STEPS.map((step, i) => {
          const Icon = step.icon
          const isActive = i === currentStep
          const isDone = i < currentStep
          return (
            <div key={step.label} className="flex flex-col items-center gap-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  isDone
                    ? "bg-accent text-accent-foreground"
                    : isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span
                className={`text-[10px] font-medium ${
                  isDone
                    ? "text-accent-foreground"
                    : isActive
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Panels */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-6">
        <VoiceMaterialPanel onVoiceChange={setVoiceMaterial} />
        <SongSearchPanel onSongSelect={setSelectedSong} />
        <AIConversionPanel
          voiceMaterial={voiceMaterial}
          selectedSong={selectedSong}
          onConversionComplete={setConversionResult}
        />
        <SingalongPanel
          conversionResult={conversionResult}
          song={selectedSong}
          onEnterFullScreen={() => setShowFullscreen(true)}
        />
      </div>
    </div>
  )
}
