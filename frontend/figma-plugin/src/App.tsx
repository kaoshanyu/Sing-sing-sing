import { useState, useEffect, useCallback } from "react"
import { Sidebar, Page } from "./components/Sidebar"
import { Dashboard } from "./pages/Dashboard"
import { QuestionBank } from "./pages/QuestionBank"
import { QuestionDetail } from "./pages/QuestionDetail"
import { Levels } from "./pages/Levels"
import { Settings } from "./pages/Settings"
import { healthCheck } from "./api/client"
import type { Question } from "./api/types"

export default function App() {
  const [page, setPage] = useState<Page>("dashboard")
  const [connected, setConnected] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 2500)
  }, [])

  useEffect(() => {
    const check = async () => {
      const ok = await healthCheck()
      setConnected(ok)
    }
    check()
    const timer = setInterval(check, 10000)
    return () => clearInterval(timer)
  }, [])

  const handleEditQuestion = (q: Question) => {
    setEditingQuestion(q)
    setPage("question-detail")
  }

  const handleBackToQuestions = () => {
    setEditingQuestion(null)
    setPage("questions")
  }

  return (
    <div className="app">
      <Sidebar current={page} onChange={setPage} connected={connected} />
      <div className="main">
        <div className="topbar">
          {page === "question-detail" ? (
            <>
              <h2>编辑题目</h2>
              <span className="subtitle">{editingQuestion?.id}</span>
            </>
          ) : (
            <>
              {page === "dashboard" && <><h2>总览</h2><span className="subtitle">项目数据概览</span></>}
              {page === "questions" && <><h2>题库管理</h2><span className="subtitle">共 0 题</span></>}
              {page === "levels" && <><h2>关卡配置</h2><span className="subtitle">教程关卡结构</span></>}
              {page === "settings" && <><h2>设置</h2><span className="subtitle">API 连接配置</span></>}
            </>
          )}
        </div>
        <div className="content">
          {page === "dashboard" && <Dashboard />}
          {page === "questions" && <QuestionBank onEdit={handleEditQuestion} showToast={showToast} />}
          {page === "question-detail" && editingQuestion && (
            <QuestionDetail question={editingQuestion} onBack={handleBackToQuestions} showToast={showToast} />
          )}
          {page === "levels" && <Levels />}
          {page === "settings" && <Settings onConnectedChange={setConnected} />}
        </div>
      </div>
      {toast && (
        <div className={`toast toast-${toast.type}`}>{toast.message}</div>
      )}
    </div>
  )
}
