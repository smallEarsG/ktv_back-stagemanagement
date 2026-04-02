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
      const current =
        window.location.pathname + window.location.search + window.location.hash
      if (!window.location.pathname.startsWith('/login')) {
        window.location.replace(`/login?redirect=${encodeURIComponent(current)}`)
      }
    }
    const err = new Error(payload.msg || '请求失败')
    err.code = payload.code
    throw err
  }

  return payload.data
}

