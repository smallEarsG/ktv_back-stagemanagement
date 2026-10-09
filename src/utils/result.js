import { clearAuth } from '@/utils/auth'

export function unwrapResult(res) {
  const payload = res?.data
  if (!payload) {
    const err = new Error('服务响应为空')
    err.code = 'EMPTY_RESPONSE'
    throw err
  }

  if (payload.code !== 200) {
    if (payload.code === 401) {
      clearAuth()
      const basePath = import.meta.env.BASE_URL || '/'
      const routePath = window.location.pathname.slice(basePath.length - 1)
      const current =
        routePath + window.location.search + window.location.hash
      if (!routePath.startsWith('/login')) {
        window.location.replace(`${basePath}login?redirect=${encodeURIComponent(current)}`)
      }
    }
    const err = new Error(payload.message || payload.msg || '请求失败')
    err.code = payload.code
    throw err
  }

  return payload.data
}

