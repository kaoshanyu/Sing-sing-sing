import { useEffect, useState } from "react"
import { Search, Plus, Trash2 } from "lucide-react"
import { fetchQuestions, deleteQuestion } from "../api/client"
import type { Question } from "../api/types"

const TYPE_OPTIONS = [
  { value: "", label: "全部题型" },
  { value: "T1", label: "T1 双音比较" },
  { value: "T2", label: "T2 三音比较" },
  { value: "T3", label: "T3 音程比较" },
  { value: "T4", label: "T4 多音程" },
  { value: "T5", label: "T5 听写" },
  { value: "T6", label: "T6 跟唱单音" },
  { value: "T7", label: "T7 跟唱短句" },
  { value: "RHYTHM", label: "节奏" },
]

export function QuestionBank({ onEdit, showToast }: {
  onEdit: (q: Question) => void
  showToast: (msg: string, type?: "success" | "error") => void
}) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [filtered, setFiltered] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [error, setError] = useState("")

  const load = async () => {
    setLoading(true)
    setError("")
    try {
      const data = await fetchQuestions()
      setQuestions(data)
      setFiltered(data)
    } catch (e: any) {
      setError(e.message)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    let list = questions
    if (typeFilter) {
      list = list.filter(q => q.type === typeFilter || (typeFilter === "RHYTHM" && q.type.startsWith("RHYTHM")))
    }
    if (search) {
      const s = search.toLowerCase()
      list = list.filter(q => q.prompt.toLowerCase().includes(s) || q.id.toLowerCase().includes(s))
    }
    setFiltered(list)
  }, [search, typeFilter, questions])

  const handleDelete = async (id: string) => {
    if (!confirm("确定删除这道题？")) return
    try {
      await deleteQuestion(id)
      showToast("删除成功")
      load()
    } catch (e: any) {
      showToast(e.message, "error")
    }
  }

  const typeBadge = (type: string) => {
    if (type.startsWith("T")) return `badge-${type.toLowerCase().slice(0, 2)}`
    return "badge-rhythm"
  }

  if (loading) return <div className="loading">加载中...</div>

  return (
    <div>
      {error && <div className="error-banner">{error}</div>}

      <div className="search-bar">
        <div className="form-input" style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px" }}>
          <Search size={14} style={{ color: "var(--text-muted)" }} />
          <input
            type="text"
            placeholder="搜索题目..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ border: "none", outline: "none", flex: 1, fontSize: 12, background: "transparent" }}
          />
        </div>
        <select className="form-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ width: 120 }}>
          {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <Search size={48} />
          <p>没有找到题目</p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th style={{ width: 60 }}>题型</th>
                <th>提示语</th>
                <th style={{ width: 50 }}>难度</th>
                <th style={{ width: 80 }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(q => (
                <tr key={q.id} onClick={() => onEdit(q)} style={{ cursor: "pointer" }}>
                  <td><span className={`badge ${typeBadge(q.type)}`}>{q.type}</span></td>
                  <td style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {q.prompt}
                  </td>
                  <td>{q.difficulty}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={e => { e.stopPropagation(); handleDelete(q.id) }}
                    >
                      <Trash2 size={12} /> 删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
