const prefix = import.meta.env.VITE_STORAGE_PREFIX || ''
const TOKEN_KEY = prefix + 'sm_token'
const USER_KEY = prefix + 'sm_user'

export const PLATFORM_ACCOUNT_MESSAGE = '此账号不是平台管理员，请使用平台账号登录；商家账号请进入商家后台。'

export function isPlatformUser(user) {
  return user?.storeId === 0 || user?.storeId === '0'
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || ''
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token || '')
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export function getUser() {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function setUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user || null))
}

export function clearUser() {
  localStorage.removeItem(USER_KEY)
}

export function clearAuth() {
  clearToken()
  clearUser()
}

