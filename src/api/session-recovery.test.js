import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { AxiosError } from 'axios'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { clearAuth, getToken, getUser, setToken, setUser } from '@/utils/auth'
import { login, getCurrentUser } from '@/api/auth'

vi.mock('@/api/auth', () => ({ login: vi.fn(), getCurrentUser: vi.fn() }))
const user = id => ({ id, storeId: 0, role: 'admin' })
const deferred = () => {
  let resolve, reject
  const promise = new Promise((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}
const expired = config => new AxiosError('Expired', 'ERR_BAD_REQUEST', config, null, { status: 401, data: { code: 401, message: '登录已失效' }, config })

beforeEach(() => {
  clearAuth()
  setActivePinia(createPinia())
  vi.clearAllMocks()
  vi.stubEnv('VITE_API_BASE_URL', '/api')
  vi.stubEnv('BASE_URL', '/platform/')
  vi.stubGlobal('window', { location: { pathname: '/platform/merchants', search: '', hash: '', replace: vi.fn() } })
})
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals() })

it('keeps the new session when an old HTTP 401 arrives', async () => {
  const { createHttpClient } = await import('@/api/http')
  setToken('session-A')
  let finish
  const pending = createHttpClient().get('/platform/merchants', { adapter: config => new Promise((resolve, reject) => { finish = () => reject(expired(config)) }) }).catch(error => error)
  await vi.waitFor(() => expect(finish).toBeTypeOf('function'))
  setToken('session-B'); setUser(user(2))
  finish(); await pending
  expect(getToken()).toBe('session-B')
  expect(getUser().id).toBe(2)
  expect(window.location.replace).not.toHaveBeenCalled()
})

it('keeps the new session when an old business 401 is unwrapped', async () => {
  const { createHttpClient } = await import('@/api/http')
  const { unwrapResult } = await import('@/utils/result')
  setToken('session-A')
  let finish
  const pending = createHttpClient().get('/auth/user', { adapter: config => new Promise(resolve => { finish = () => resolve({ status: 200, headers: {}, config, data: { code: 401, message: '登录已失效' } }) }) })
  await vi.waitFor(() => expect(finish).toBeTypeOf('function'))
  setToken('session-B'); setUser(user(2))
  finish()
  const response = await pending
  expect(() => unwrapResult(response)).toThrow('登录已失效')
  expect(getToken()).toBe('session-B')
  expect(window.location.replace).not.toHaveBeenCalled()
})

it('still clears an expired current session and redirects to login', async () => {
  const { createHttpClient } = await import('@/api/http')
  setToken('current-session'); setUser(user(1))
  await createHttpClient().get('/platform/merchants', { adapter: async config => { throw expired(config) } }).catch(() => {})
  expect(getToken()).toBe('')
  expect(getUser()).toBe(null)
  expect(window.location.replace).toHaveBeenCalledWith('/platform/login?redirect=%2Fmerchants')
})

it('still clears an expired current session from a business 401', async () => {
  const { createHttpClient } = await import('@/api/http')
  const { unwrapResult } = await import('@/utils/result')
  setToken('current-session'); setUser(user(1))
  const response = await createHttpClient().get('/auth/user', { adapter: async config => ({ status: 200, headers: {}, config, data: { code: 401, message: '登录已失效' } }) })
  expect(() => unwrapResult(response)).toThrow('登录已失效')
  expect(getToken()).toBe('')
  expect(window.location.replace).toHaveBeenCalledWith('/platform/login?redirect=%2Fmerchants')
})

it('does not clear a valid session for an unauthenticated login failure', async () => {
  const { createHttpClient } = await import('@/api/http')
  setToken('current-session'); setUser(user(1))
  await createHttpClient().post('/auth/login', {}, { adapter: async config => { throw expired(config) } }).catch(() => {})
  expect(getToken()).toBe('current-session')
  expect(window.location.replace).not.toHaveBeenCalled()
})

it.each(['success', 'failure', 'wrong-role'])('ignores an old profile %s after a new login', async outcome => {
  const old = deferred()
  getCurrentUser.mockReturnValueOnce(old.promise)
  const auth = useAuthStore()
  auth.setAuth({ token: 'session-A', userInfo: user(1) })
  const pending = auth.fetchMe().catch(error => error)
  login.mockResolvedValueOnce({ token: 'session-B', userInfo: user(2) })
  await auth.login('account-B', 'synthetic-password')
  if (outcome === 'failure') old.reject(new Error('Old network error'))
  else old.resolve(outcome === 'wrong-role' ? { id: 3, role: 'admin', storeId: 7 } : user(1))
  expect((await pending).code).toBe('AUTH_SUPERSEDED')
  expect(auth.token).toBe('session-B')
  expect(auth.user.id).toBe(2)
  expect(getUser().id).toBe(2)
})

it('keeps the latest of two login requests', async () => {
  const old = deferred()
  login.mockReturnValueOnce(old.promise).mockResolvedValueOnce({ token: 'session-B', userInfo: user(2) })
  const auth = useAuthStore()
  const pending = auth.login('account-A', 'synthetic-password').catch(error => error)
  await auth.login('account-B', 'synthetic-password')
  old.resolve({ token: 'session-A', userInfo: user(1) })
  expect((await pending).code).toBe('AUTH_SUPERSEDED')
  expect(auth.token).toBe('session-B')
  expect(auth.user.id).toBe(2)
})

it('does not restore a login after explicit logout', async () => {
  const old = deferred()
  login.mockReturnValueOnce(old.promise)
  const auth = useAuthStore()
  const pending = auth.login('account-A', 'synthetic-password').catch(error => error)
  auth.logout()
  old.resolve({ token: 'session-A', userInfo: user(1) })
  expect((await pending).code).toBe('AUTH_SUPERSEDED')
  expect(auth.token).toBe('')
  expect(getToken()).toBe('')
})
