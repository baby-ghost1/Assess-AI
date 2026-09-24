import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

const SKIP_REFRESH_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/admin/login', '/auth/refresh']

// Single-flight: concurrent 401s share one refresh request
let refreshPromise = null

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config
    const shouldSkip = SKIP_REFRESH_ENDPOINTS.some((path) => original.url?.includes(path))
    if (error.response?.status === 401 && !original._retry && !shouldSkip) {
      original._retry = true
      try {
        if (!refreshPromise) {
          refreshPromise = axios
            .post('/api/v1/auth/refresh', {}, { withCredentials: true })
            .then((r) => r.data)
            .finally(() => {
              refreshPromise = null
            })
        }
        const data = await refreshPromise
        localStorage.setItem('accessToken', data.data.accessToken)
        original.headers.Authorization = `Bearer ${data.data.accessToken}`
        return api(original)
      } catch {
        localStorage.removeItem('accessToken')
        window.dispatchEvent(new Event('session-expired'))
        return Promise.reject(error)
      }
    }
    return Promise.reject(error)
  }
)

export default api
