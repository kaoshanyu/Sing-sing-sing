import { useState } from "react"
import { ArrowLeft, Save } from "lucide-react"
import { updateQuestion } from "../api/client"
import type { Question } from "../api/types"

export function QuestionDetail({ question, onBack, showToast }: {
  question: Question
  onBack: () => void
  showToast: (msg: string, type?: "success" | "error") => void
}) {
  const [form, setForm] = useState({ ...question })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateQuestion(form.id, form)
      showToast("保存成功")
    } catch (e: any) {
      showToast(e.message, "error")
    }
    setSaving(false)
  }

  return (
    <div>
      <div className="detail-header">
        <button className="back-btn" onClick={onBack}><ArrowLeft size={18} /></button>
        <h3>编辑题目</h3>
        <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving} style={{ marginLeft: "auto" }}>
          <Save size={14} /> {saving ? "保存中..." : "保存"}
        </button>
      </div>

      <div className="card" style={{ padding: 16 }}>
        <div className="form-group">
          <label>题目 ID</label>
          <div className="form-input" style={{ background: "var(--bg)", fontSize: 11, color: "var(--text-muted)" }}>
            {form.id}
          </div>
        </div>

        <div className="form-group">
          <label>题型</label>
          <div className="form-input" style={{ background: "var(--bg)", fontSize: 11, color: "var(--text-muted)" }}>
            {form.type} {form.subtype ? `/ ${form.subtype}` : ""}
          </div>
        </div>

        <div className="form-group">
          <label>难度</label>
          <select className="form-select" value={form.difficulty} onChange={e => setForm({ ...form, difficulty: +e.target.value })}>
            {[1, 2, 3, 4, 5].map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label>提示语 (prompt)</label>
          <textarea className="form-textarea" value={form.prompt} onChange={e => setForm({ ...form, prompt: e.target.value })} />
        </div>

        <div className="form-group">
          <label>选项 (options)</label>
          <textarea
            className="form-textarea"
            value={Array.isArray(form.options) ? form.options.join("\n") : form.options}
            onChange={e => setForm({ ...form, options: e.target.value.split("\n").filter(Boolean) })}
            placeholder="每行一个选项"
          />
        </div>

        <div className="form-group">
          <label>答案 (answer)</label>
          <textarea
            className="form-textarea"
            value={Array.isArray(form.answer) ? form.answer.join("\n") : form.answer}
            onChange={e => setForm({ ...form, answer: e.target.value })}
          />
        </div>

        <div className="form-group">
          <h4 style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>预览</h4>
          <div className="question-preview">{form.prompt}</div>
        </div>
      </div>
    </div>
  )
}
