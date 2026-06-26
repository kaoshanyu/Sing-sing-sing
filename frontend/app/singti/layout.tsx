import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "SingTI 音乐人格测试 — 五音不全",
  description:
    "唱一段《小星星》，回答 16 道题，解锁你的专属 SingTI 音乐人格。由五音不全 AI 音乐教学提供。",
  openGraph: {
    title: "SingTI 音乐人格测试",
    description:
      "唱一段《小星星》，回答 16 道题，解锁你的专属 SingTI 音乐人格。",
    type: "website",
  },
}

export default function SingTILayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
