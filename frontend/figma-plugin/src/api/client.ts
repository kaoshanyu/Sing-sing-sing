import type { ApiResponse, Question, Module, UserProgress, Stats } from "./types"

function getConfig() {
  try {
    const raw = localStorage.getItem("figma_plugin_config")
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { apiUrl: "http://localhost:8000", token: "" }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const config = getConfig()
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }
  if (config.token) {
    headers["Authorization"] = `Bearer ${config.token}`
  }

  const res = await fetch(`${config.apiUrl}/api/v1${path}`, {
    ...options,
    headers: { ...headers, ...(options?.headers as Record<string, string>) },
  })
  const body: ApiResponse<T> = await res.json()
  if (body.code !== 0) throw new Error(body.detail || "请求失败")
  return body.data
}

// ===== 题库 API =====
export async function fetchQuestions(type?: string): Promise<Question[]> {
  const params = type ? `?type=${type}` : ""
  return request<Question[]>(`/quiz/questions${params}`)
}

export async function fetchQuestion(id: string): Promise<Question> {
  return request<Question>(`/quiz/questions/${id}`)
}

export async function createQuestion(q: Partial<Question>): Promise<Question> {
  return request<Question>("/quiz/questions", {
    method: "POST",
    body: JSON.stringify(q),
  })
}

export async function updateQuestion(id: string, q: Partial<Question>): Promise<Question> {
  return request<Question>(`/quiz/questions/${id}`, {
    method: "PUT",
    body: JSON.stringify(q),
  })
}

export async function deleteQuestion(id: string): Promise<void> {
  return request<void>(`/quiz/questions/${id}`, { method: "DELETE" })
}

// ===== 模块/关卡 API =====
export async function fetchModules(): Promise<Module[]> {
  return request<Module[]>("/modules")
}

// ===== 用户 API =====
export async function fetchUsers(): Promise<UserProgress[]> {
  return request<UserProgress[]>("/users/progress")
}

// ===== 统计 API =====
export async function fetchStats(): Promise<Stats> {
  return request<Stats>("/stats")
}

// ===== 健康检查 =====
export async function healthCheck(): Promise<boolean> {
  try {
    const config = getConfig()
    const res = await fetch(`${config.apiUrl}/api/v1/health`, { signal: AbortSignal.timeout(5000) })
    return res.ok
  } catch {
    return false
  }
}
