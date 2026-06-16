import axios from 'axios'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8082/api'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

// ── Request: attach JWT ────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('tf_access_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

// ── Response: handle errors & auto refresh ────────────────────
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refreshToken = localStorage.getItem('tf_refresh_token')
        if (refreshToken) {
          const res = await axios.post(`${BASE_URL}/auth/refresh`, null, {
            params: { refreshToken },
          })
          const { accessToken } = res.data.data
          localStorage.setItem('tf_access_token', accessToken)
          original.headers.Authorization = `Bearer ${accessToken}`
          return api(original)
        }
      } catch {
        localStorage.removeItem('tf_access_token')
        localStorage.removeItem('tf_refresh_token')
        window.location.href = '/login'
        return Promise.reject(error)
      }
    }

    const status = error.response?.status
    if (status === 403) toast.error('Access denied')
    else if (status >= 500) toast.error('Server error – please try again later')

    return Promise.reject(error)
  }
)

export default api

// ── Auth ──────────────────────────────────────────────────────
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
  refresh:  (token) => api.post('/auth/refresh', null, { params: { refreshToken: token } }),
}

// ── Dashboard ─────────────────────────────────────────────────
export const dashboardApi = {
  get: () => api.get('/dashboard'),
}

// ── Workspaces ────────────────────────────────────────────────
export const workspacesApi = {
  getAll:     () => api.get('/workspaces'),
  getPersonal:() => api.get('/workspaces/personal'),
  getById:    (id) => api.get(`/workspaces/${id}`),
  create:     (data) => api.post('/workspaces', data),
}

// ── Boards ────────────────────────────────────────────────────
export const boardsApi = {
  create:        (data) => api.post('/boards', data),
  getById:       (id) => api.get(`/boards/${id}`),
  getByWorkspace:(wsId) => api.get(`/boards/workspace/${wsId}`),
  getMyBoards:   () => api.get('/boards/my'),
  update:        (id, data) => api.put(`/boards/${id}`, data),
  delete:        (id) => api.delete(`/boards/${id}`),
}

// ── Tasks ─────────────────────────────────────────────────────
export const tasksApi = {
  create:     (data) => api.post('/tasks', data),
  getById:    (id) => api.get(`/tasks/${id}`),
  getByBoard: (boardId) => api.get(`/tasks/board/${boardId}`),
  getMyTasks: () => api.get('/tasks/my'),
  getDueToday:() => api.get('/tasks/due-today'),
  update:     (id, data) => api.put(`/tasks/${id}`, data),
  move:       (id, columnId, position) => api.patch(`/tasks/${id}/move`, { columnId, position }),
  delete:     (id) => api.delete(`/tasks/${id}`),
  search:     (q, page = 0, size = 20) => api.get('/tasks/search', { params: { q, page, size } }),
}

// ── Habits ────────────────────────────────────────────────────
export const habitsApi = {
  create:     (data) => api.post('/habits', data),
  getAll:     () => api.get('/habits'),
  toggle:     (id) => api.post(`/habits/${id}/toggle`),
  getHeatmap: (id) => api.get(`/habits/${id}/heatmap`),
  delete:     (id) => api.delete(`/habits/${id}`),
}

// ── Study ─────────────────────────────────────────────────────
export const studyApi = {
  createSession:  (data) => api.post('/study/sessions', data),
  getSessions:    () => api.get('/study/sessions'),
  getStats:       () => api.get('/study/stats'),
  getWeeklyHours: () => api.get('/study/weekly-hours'),
  deleteSession:  (id) => api.delete(`/study/sessions/${id}`),
}

// ── Pomodoro ──────────────────────────────────────────────────
export const pomodoroApi = {
  start:              (data) => api.post('/pomodoro/start', data),
  complete:           (id, data) => api.patch(`/pomodoro/${id}/complete`, data || {}),
  getSessions:        () => api.get('/pomodoro/sessions'),
  getTodayCount:      () => api.get('/pomodoro/today/count'),
  getTodayFocusMinutes:() => api.get('/pomodoro/today/focus-minutes'),
}

// ── Notifications ─────────────────────────────────────────────
export const notificationsApi = {
  getAll:        (page = 0, size = 20) => api.get('/notifications', { params: { page, size } }),
  getUnreadCount:() => api.get('/notifications/unread-count'),
  markAllAsRead: () => api.patch('/notifications/read-all'),
  markAsRead:    (id) => api.patch(`/notifications/${id}/read`),
}
