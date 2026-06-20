import { useState, useEffect } from "react"
import { Link, CheckCircle, XCircle } from "lucide-react"
import { healthCheck } from "../api/client"

export function Settings({ onConnectedChange }: { onConnectedChange: (v: boolean) => void }) {
  const [apiUrl, setApiUrl] = useState("http://localhost:8000")
  const [token, setToken] = useState("")
  const [connected, setConnected] = useState(false)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem("figma_plugin_config")
      if (raw) {
        const cfg = JSON.parse(raw)
        setApiUrl(cfg.apiUrl || "http://localhost:8000")
        setToken(cfg.token || "")
      }
    } catch { /* ignore */ }
  }, [])

  const save = () => {
    localStorage.setItem("figma_plugin_config", JSON.stringify({ apiUrl, token }))
  }

  const test = async () => {
    setChecking(true)
    const ok = await healthCheck()
    setConnected(ok)
    onConnectedChange(ok)
    setChecking(false)
  }

  return (
    <div>
      <div className="settings-section card" style={{ padding: 16 }}>
        <h3>API 连接</h3>

        <div className="form-group">
          <label>API 地址</label>
          <input
            className="form-input"
            value={apiUrl}
            onChange={e => { setApiUrl(e.target.value); save() }}
            placeholder="http://localhost:8000"
          />
        </div>

        <div className="form-group">
          <label>Auth Token（可选）</label>
          <input
            className="form-input"
            value={token}
            onChange={e => { setToken(e.target.value); save() }}
            placeholder="Bearer token"
            type="password"
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
          <button className="btn" onClick={test} disabled={checking}>
            <Link size={14} /> {checking ? "检测中..." : "测试连接"}
          </button>
          {connected !== null && (
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
              {connected ? (
                <><CheckCircle size={14} style={{ color: "var(--accent-green)" }} /> 连接成功</>
              ) : (
                <><XCircle size={14} style={{ color: "var(--danger)" }} /> 连接失败</>
              )}
            </span>
          )}
        </div>
      </div>

      <div className="settings-section card" style={{ padding: 16, marginTop: 12 }}>
        <h3>关于</h3>
        <div className="field-row">
          <span className="field-label">版本</span>
          <span className="field-value">1.0.0</span>
        </div>
        <div className="field-row">
          <span className="field-label">项目</span>
          <span className="field-value">五音不全 - AI音乐教学</span>
        </div>
        <div className="field-row">
          <span className="field-label">提示</span>
          <span className="field-value" style={{ fontSize: 11, color: "var(--text-muted)" }}>
            后端 API 默认在 localhost:8000 启动
          </span>
        </div>
      </div>
    </div>
  )
}
