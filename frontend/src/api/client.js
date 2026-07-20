const API_BASE = import.meta.env.VITE_API_URL ?? ''
const TOKEN_KEY = 'argus_token'

function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

class ApiError extends Error {
  constructor(message, status, detail) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
  }
}

async function request(path, options = {}) {
  const headers = {
    ...(options.body && !(options.body instanceof FormData)
      ? { 'Content-Type': 'application/json' }
      : {}),
    ...options.headers,
  }

  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })

  if (res.status === 204) return null

  const contentType = res.headers.get('content-type') || ''
  let data
  if (contentType.includes('application/json')) {
    data = await res.json()
  } else {
    data = await res.text()
  }

  if (!res.ok) {
    const detail =
      typeof data === 'object' && data?.detail
        ? typeof data.detail === 'string'
          ? data.detail
          : JSON.stringify(data.detail)
        : typeof data === 'string'
          ? data
          : res.statusText
    if (res.status === 401) {
      setToken(null)
    }
    throw new ApiError(detail || 'Request failed', res.status, data)
  }

  return data
}

export const api = {
  getToken,
  setToken,
  clearToken() {
    setToken(null)
  },

  async health() {
    return request('/health')
  },

  async login(email, password) {
    const data = await request('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    if (data?.access_token) setToken(data.access_token)
    return data
  },

  async register({ email, full_name, password, role = 'investigator' }) {
    const data = await request('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, full_name, password, role }),
    })
    if (data?.access_token) setToken(data.access_token)
    return data
  },

  async me() {
    return request('/api/v1/auth/me')
  },

  async ask(query) {
    return request('/api/v1/ask', {
      method: 'POST',
      body: JSON.stringify({ query }),
    })
  },

  async heatmap() {
    return request('/api/v1/see/heatmap')
  },

  async predict({ zone_id = 'BLR-MG', hour = 20, dow = 5 } = {}) {
    return request('/api/v1/predict', {
      method: 'POST',
      body: JSON.stringify({ zone_id, hour, dow }),
    })
  },

  async notifications() {
    return request('/api/v1/notifications')
  },

  async markNotificationRead(id) {
    return request(`/api/v1/notifications/${id}/read`, { method: 'POST' })
  },

  async billing() {
    return request('/api/v1/billing/subscription')
  },

  async auditExport() {
    return request('/api/v1/audit/export')
  },

  async auditRecent() {
    return request('/api/v1/audit/recent')
  },

  async adminUsers() {
    return request('/api/v1/admin/users')
  },

  async healthDetail() {
    return request('/api/v1/admin/health-detail')
  },

  async crosslink({ case_ref = null, zone_id = null, source, target }) {
    return request('/api/v1/crosslink/resolve', {
      method: 'POST',
      body: JSON.stringify({ case_ref, zone_id, source, target }),
    })
  },

  async graph(case_ref = null) {
    const qs = case_ref ? `?case_ref=${encodeURIComponent(case_ref)}` : ''
    return request(`/api/v1/graph${qs}`)
  },
}

export { ApiError }
export default api
