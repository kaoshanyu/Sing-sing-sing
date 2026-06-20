import { useEffect, useState } from "react"
import { fetchModules } from "../api/client"
import type { Module } from "../api/types"
import { GraduationCap } from "lucide-react"

export function Levels() {
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchModules()
      .then(setModules)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading">加载中...</div>
  if (error) return <div className="error-banner">{error}</div>

  if (modules.length === 0) {
    return (
      <div className="empty-state">
        <GraduationCap size={48} />
        <p>暂无关卡数据</p>
        <p style={{ fontSize: 11, marginTop: 4 }}>后端 API 返回空或未实现</p>
      </div>
    )
  }

  return (
    <div>
      {modules.map(mod => (
        <div key={mod.id} className="card" style={{ marginBottom: 12, padding: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{mod.title}</h3>
          <p style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 12 }}>{mod.subtitle}</p>

          {mod.levels && mod.levels.length > 0 ? (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>顺序</th>
                    <th>关卡名称</th>
                    <th style={{ width: 50 }}>难度</th>
                    <th style={{ width: 60 }}>类型</th>
                  </tr>
                </thead>
                <tbody>
                  {mod.levels.map(lv => (
                    <tr key={lv.id}>
                      <td>{lv.order}</td>
                      <td>{lv.title}</td>
                      <td>{lv.difficulty}</td>
                      <td><span className="badge badge-rhythm">{lv.type}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ fontSize: 11, color: "var(--text-muted)" }}>暂无关卡</p>
          )}
        </div>
      ))}
    </div>
  )
}
