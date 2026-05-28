"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Search, Upload, CheckCircle2, Music2 } from "lucide-react"
import { apiSearchSongs, apiUploadTargetSong } from "@/lib/ai-singing"
import type { Song } from "@/lib/ai-singing"

interface Props {
  onSongSelect: (song: Song | null) => void
}

export function SongSearchPanel({ onSongSelect }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Song[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [searching, setSearching] = useState(false)
  const [uploading, setUploading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (!query.trim()) { setResults([]); return }
    setSearching(true)
    timerRef.current = setTimeout(async () => {
      const songs = await apiSearchSongs(query)
      setResults(songs)
      setSearching(false)
    }, 300)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [query])

  const handleSelect = useCallback((song: Song) => {
    setSelectedId(song.id)
    onSongSelect(song)
  }, [onSongSelect])

  const handleUploadTarget = useCallback(async (song: Song, e: React.MouseEvent) => {
    e.stopPropagation()
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'audio/*'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      setUploading(true)
      await apiUploadTargetSong(song.id, file)
      setUploading(false)
      alert('音频已上传，可开始生成AI领唱版本')
    }
    input.click()
  }, [])

  return (
    <div className="rounded-2xl bg-card border border-border/50 p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-6 h-6 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-bold">2</span>
        <h3 className="text-foreground font-semibold text-sm">选择歌曲</h3>
        {searching && <span className="ml-auto text-xs text-muted-foreground">搜索中...</span>}
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="搜索歌名、歌手名..."
          className="w-full h-10 pl-10 pr-4 rounded-xl bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground outline-none focus:border-primary/60 transition-colors"
        />
      </div>

      <div className="space-y-2 max-h-[280px] overflow-y-auto">
        {results.length === 0 && query.trim() && !searching && (
          <p className="text-center text-xs text-muted-foreground py-6">未找到匹配歌曲</p>
        )}
        {results.map(song => {
          const isSelected = selectedId === song.id
          return (
            <button
              key={song.id}
              onClick={() => handleSelect(song)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                isSelected
                  ? 'bg-primary/10 border border-primary/30'
                  : 'bg-secondary/50 border border-transparent hover:border-border'
              }`}
            >
              <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center text-primary text-sm font-bold shrink-0">
                {song.coverInitial}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm text-foreground font-medium truncate">{song.title}</p>
                <p className="text-xs text-muted-foreground">{song.artist} · {song.key}调</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{song.difficulty}</span>
                {song.status === 'ready' ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/15 text-accent-foreground whitespace-nowrap">可转换</span>
                ) : (
                  <span
                    onClick={e => handleUploadTarget(song, e)}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary whitespace-nowrap cursor-pointer hover:bg-primary/25"
                  >
                    {uploading ? '上传中...' : '需上传音源'}
                  </span>
                )}
                {isSelected && <CheckCircle2 className="w-4 h-4 text-primary" />}
              </div>
            </button>
          )
        })}
      </div>

      {selectedId && results.find(s => s.id === selectedId)?.status === 'needs_upload' && (
        <p className="mt-3 text-xs text-primary flex items-center gap-1.5">
          <Upload className="w-3 h-3" />
          点击"需上传音源"上传目标歌曲音频
        </p>
      )}
    </div>
  )
}
