// API 客户端 - 与语构后端通信
// 使用相对路径，由 Next.js rewrite 代理到后端

const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''
const API_PREFIX = '/api/v1'

function getToken(): string | null {
  try {
    return localStorage.getItem('auth_token')
  } catch {
    return null
  }
}

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${API_PREFIX}${path}`, {
    ...options,
    headers,
  })

  const body = await res.json()
  if (body.code !== 0) {
    throw new Error(body.detail || '请求失败')
  }
  return body.data
}

// ========== Auth ==========

export async function apiLogin(email: string, password: string) {
  const res = await fetch(`${API_BASE}${API_PREFIX}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const body = await res.json()
  if (body.code !== 0) throw new Error(body.detail || '登录失败')
  const token = body.data.token.access_token
  localStorage.setItem('auth_token', token)
  return body.data.user
}

export async function apiRegister(email: string, password: string) {
  const res = await fetch(`${API_BASE}${API_PREFIX}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const body = await res.json()
  if (body.code !== 0) throw new Error(body.detail || '注册失败')
  const token = body.data.token.access_token
  localStorage.setItem('auth_token', token)
  return body.data.user
}

// ========== User ==========

export async function apiGetUser() {
  return apiRequest('/users/me')
}

export async function apiUpdateUser(data: { nickname?: string; avatar_url?: string }) {
  return apiRequest('/users/me', {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function apiSaveQuestionnaire(answers: Record<string, string | string[]>) {
  return apiRequest('/users/me/questionnaire', {
    method: 'POST',
    body: JSON.stringify({ answers }),
  })
}

export async function apiSaveVocalRange(lowest: string, highest: string) {
  return apiRequest('/users/me/vocal-range', {
    method: 'POST',
    body: JSON.stringify({ lowest_note: lowest, highest_note: highest }),
  })
}

export async function apiGetLevelProgress() {
  return apiRequest('/users/me/level-progress')
}

export async function apiResetProgress() {
  return apiRequest('/users/me/progress', { method: 'DELETE' })
}

// ========== Quiz Sessions ==========

export async function apiCreateSession(moduleType: string) {
  return apiRequest('/quiz-sessions', {
    method: 'POST',
    body: JSON.stringify({ module_type: moduleType }),
  })
}

export async function apiGetSession(sessionId: number) {
  return apiRequest(`/quiz-sessions/${sessionId}`)
}

export async function apiSubmitAnswer(sessionId: number, questionId: number, answer: string) {
  return apiRequest(`/quiz-sessions/${sessionId}/answers`, {
    method: 'POST',
    body: JSON.stringify({ question_id: questionId, answer }),
  })
}

export async function apiCompleteSession(sessionId: number) {
  return apiRequest(`/quiz-sessions/${sessionId}/complete`, {
    method: 'POST',
  })
}

// ========== Songs ==========

export async function apiListSongs(params?: { difficulty?: string; page?: number; limit?: number }) {
  const query = new URLSearchParams()
  if (params?.difficulty) query.set('difficulty', params.difficulty)
  if (params?.page) query.set('page', String(params.page))
  if (params?.limit) query.set('limit', String(params.limit))
  const qs = query.toString()
  return apiRequest(`/songs${qs ? `?${qs}` : ''}`)
}

// ========== Singing Records ==========

export async function apiUploadRecording(songId: number, audioBlob: Blob) {
  const token = getToken()
  const formData = new FormData()
  formData.append('song_id', String(songId))
  formData.append('audio_file', audioBlob, 'recording.wav')

  const res = await fetch(`${API_BASE}${API_PREFIX}/singing-records`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })
  const body = await res.json()
  if (body.code !== 0) throw new Error(body.detail || '上传失败')
  return body.data
}

// ========== AI Chat ==========

export async function apiChat(message: string, history: { role: string; content: string }[] = []) {
  const res = await fetch(`${API_BASE}${API_PREFIX}/ai-chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(getToken() ? { Authorization: `Bearer ${getToken()!}` } : {}),
    },
    body: JSON.stringify({
      message,
      conversation_history: history,
    }),
  })
  const body = await res.json()
  if (body.code !== 0) throw new Error(body.detail || 'AI服务不可用')
  return body.data.response as string
}
