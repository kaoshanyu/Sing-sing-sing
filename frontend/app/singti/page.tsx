"use client"

import { useEffect, useState } from "react"
import { SingTITest } from "@/components/singti/singti-test"
import type { Personality } from "@/components/singti/data"
import { PERSONALITIES } from "@/components/singti/data"
import { CharacterAvatar } from "@/components/singti/character-avatar"
import { ChevronLeft } from "lucide-react"

export default function SingTIPage() {
  const [sharedPersonality, setSharedPersonality] = useState<Personality | null>(null)
  const [showTest, setShowTest] = useState(false)
  const [currentUrl, setCurrentUrl] = useState("")

  useEffect(() => {
    setCurrentUrl(window.location.origin + "/singti")

    // Support both ?singti=ID and ?p=ID for compatibility
    const params = new URLSearchParams(window.location.search)
    const id = params.get("singti") || params.get("p")
    if (id) {
      const personality = PERSONALITIES.find((p) => p.id === Number(id))
      if (personality) {
        setSharedPersonality(personality)
      }
    }
  }, [])

  const handleComplete = (personality: Personality) => {
    localStorage.setItem("singti_personality", JSON.stringify(personality))
    window.location.href = `/singti?singti=${personality.id}`
  }

  // Shared personality card
  if (sharedPersonality && !showTest) {
    const h = sharedPersonality.id * 22
    const shareUrl = `${currentUrl}?singti=${sharedPersonality.id}`
    const qrSize = typeof window !== "undefined" && window.innerWidth >= 768 ? 200 : 160

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-sm rounded-3xl bg-card border border-border/50 overflow-hidden relative shadow-sm">
          <div
            className="h-2"
            style={{
              background: `linear-gradient(90deg, hsl(${h}, 60%, 75%), hsl(${h + 30}, 55%, 80%))`,
            }}
          />
          <div className="p-7 text-center">
            <p
              className="text-[10px] font-medium tracking-[0.3em] mb-5"
              style={{ color: `hsl(${h}, 40%, 70%)` }}
            >
              五音不全 × SingTI
            </p>

            <CharacterAvatar personality={sharedPersonality} size={120} />

            <p className="text-[11px] font-medium text-muted-foreground mt-4 mb-1 tracking-widest uppercase">
              音乐人格
            </p>
            <h2 className="text-3xl font-black text-foreground mb-1.5">
              {sharedPersonality.name}
            </h2>
            <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
              「{sharedPersonality.tagline}」
            </p>

            <div className="bg-secondary/40 rounded-2xl p-5 text-left mb-5">
              <p className="text-sm text-secondary-foreground leading-relaxed">
                {sharedPersonality.description}
              </p>
            </div>

            {/* QR Code */}
            {currentUrl && (
              <div className="mb-5">
                <div className="inline-flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-border/30">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(shareUrl)}&bgcolor=FFF8F0&margin=10`}
                    alt="Scan to take the SingTI test"
                    className="rounded-lg"
                    width={qrSize}
                    height={qrSize}
                  />
                  <p className="text-[10px] text-muted-foreground tracking-wider">
                    扫码测测你的音乐人格
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={() => {
                setShowTest(true)
                setSharedPersonality(null)
              }}
              className="text-sm text-primary font-semibold hover:underline"
            >
              我也要测 →
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <SingTITest onComplete={handleComplete} onBack={() => window.history.back()} />
    </div>
  )
}
