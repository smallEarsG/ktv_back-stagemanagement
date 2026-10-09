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
      const responseData = error?.response?.data
      const entryExpired = status === 401 && API_BASE_URL.startsWith('/demo/api') && typeof responseData === 'string'
      if (entryExpired) {
        error.demoEntryExpired = true
        error.message = '演示入口验证已过期，请重新验证入口后登录'
      } else if (responseData?.message || responseData?.msg) {
        error.message = responseData.message || responseData.msg
      }

      if (status === 401 || code === 401) {
        clearAuth()
        const basePath = import.meta.env.BASE_URL || '/'
        const routePath = window.location.pathname.slice(basePath.length - 1)
        const current =
          routePath +
          window.location.search +
          window.location.hash
        if (!routePath.startsWith('/login')) {
          window.location.replace(
            `${basePath}login?${entryExpired ? 'reason=demo-entry-expired&' : ''}redirect=${encodeURIComponent(current)}`,
          )
        }
      }

      return Promise.reject(error)
    },
  )

  return http
}

export const http = createHttpClient()

