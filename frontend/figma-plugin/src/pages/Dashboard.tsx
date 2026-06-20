import { useEffect, useState } from "react"
import { BookOpen, GraduationCap, Users, Music } from "lucide-react"
import { fetchStats } from "../api/client"
import type { Stats } from "../api/types"

export function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchStats()
      .then(setStats)
      .catch(e => setError(e.message))
  }, [])

  const cards = [
    { icon: BookOpen, label: "题目总数", value: stats?.total_questions ?? "—" },
    { icon: GraduationCap, label: "关卡数", value: stats?.total_levels ?? "—" },
    { icon: Music, label: "模块数", value: stats?.total_modules ?? "—" },
    { icon: Users, label: "用户数", value: stats?.total_users ?? "—" },
  ]

  return (
    <div>
      {error && <div className="error-banner">{error}</div>}

      <div className="card-grid">
        {cards.map(c => (
          <div key={c.label} className="card stat-card">
            <c.icon size={20} style={{ color: "var(--primary)", marginBottom: 8 }} />
            <div className="stat-value">{c.value}</div>
            <div className="stat-label">{c.label}</div>
          </div>
        ))}
      </div>

      {stats?.by_type && (
        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: 13, marginBottom: 12 }}>题目类型分布</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {Object.entries(stats.by_type).map(([type, count]) => (
              <div key={type} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className={`badge badge-${type.startsWith("T") ? type.toLowerCase().slice(0, 2) : "rhythm"}`}>
                  {type}
                </span>
                <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{count} 题</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
