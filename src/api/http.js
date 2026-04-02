import axios from 'axios'
import { getToken, clearAuth } from '@/utils/auth'

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || '/api'

export function createHttpClient() {
  const http = axios.create({
    baseURL: API_BASE_URL,
    timeout: 20000,
  })

  http.interceptors.request.use((config) => {
    const url = config?.url || ''
    const isLogin = url.includes('/auth/login')

    config.headers = config.headers || {}
    config.headers['X-Store-Id'] = '0'

    if (!isLogin) {
      const token = getToken()
      if (token) config.headers.Authorization = `Bearer ${token}`
    }

    return config
  })

  http.interceptors.response.use(
    (response) => response,
    async (error) => {
      const status = error?.response?.status
      const code = error?.response?.data?.code

      if (status === 401 || code === 401) {
        clearAuth()
        const current =
          window.location.pathname +
          window.location.search +
          window.location.hash
        if (!window.location.pathname.startsWith('/login')) {
          window.location.replace(
            `/login?redirect=${encodeURIComponent(current)}`,
          )
        }
      }

      return Promise.reject(error)
    },
  )

  return http
}

export const http = createHttpClient()

