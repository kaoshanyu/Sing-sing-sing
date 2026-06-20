import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  Settings,
  Music,
} from "lucide-react"

export type Page = "dashboard" | "questions" | "question-detail" | "levels" | "settings"

export function Sidebar({ current, onChange, connected }: {
  current: Page
  onChange: (page: Page) => void
  connected: boolean
}) {
  const items = [
    { id: "dashboard" as Page, label: "总览", icon: LayoutDashboard },
    { id: "questions" as Page, label: "题库管理", icon: BookOpen },
    { id: "levels" as Page, label: "关卡配置", icon: GraduationCap },
    { id: "settings" as Page, label: "设置", icon: Settings },
  ]

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1>五音不全</h1>
        <p>
          <Music size={10} style={{ display: "inline", verticalAlign: "middle", marginRight: 2 }} />
          数据管理
        </p>
        <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{
            width: 6, height: 6, borderRadius: "50%",
            background: connected ? "#5ab88a" : "#e86060",
            display: "inline-block"
          }} />
          <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
            {connected ? "已连接" : "未连接"}
          </span>
        </div>
      </div>
      <nav className="sidebar-nav">
        {items.map(item => (
          <button
            key={item.id}
            className={`nav-item ${current === item.id ? "active" : ""}`}
            onClick={() => onChange(item.id)}
          >
            <item.icon />
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
