import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { clearAuth, getToken, getUser, setToken, setUser } from '@/utils/auth'
import router from '@/router'
import { login, getCurrentUser } from '@/api/auth'

vi.mock('@/api/auth', () => ({
  login: vi.fn(),
  getCurrentUser: vi.fn(),
}))

describe('platform account boundary', () => {
  beforeEach(() => {
    clearAuth()
    setActivePinia(createPinia())
    vi.resetAllMocks()
  })

  it('rejects merchant login before saving a platform session', async () => {
    login.mockResolvedValue({ token: 'merchant-token', userInfo: { storeId: 1, role: 'admin', nickname: '演示店长' } })
    const auth = useAuthStore()
    await expect(auth.login('13800138000', 'test-password')).rejects.toThrow('平台管理员')
    expect(auth.isAuthed).toBe(false)
    expect(getToken()).toBe('')
    expect(getUser()).toBe(null)
  })

  it('redirects an existing merchant session to platform login', async () => {
    setToken('old-merchant-token')
    setUser({ storeId: 1, role: 'admin', nickname: '演示店长' })
    await router.push('/merchants')
    expect(router.currentRoute.value.path).toBe('/login')
    expect(router.currentRoute.value.query.reason).toBe('platform-account-required')
    expect(getToken()).toBe('')
  })

  it('accepts the platform administrator and keeps its session', async () => {
    login.mockResolvedValue({ token: 'platform-token', userInfo: { storeId: 0, role: 'admin' } })
    const auth = useAuthStore()
    await auth.login('13900139000', 'test-password')
    await router.push('/merchants')
    expect(router.currentRoute.value.path).toBe('/merchants')
    expect(getToken()).toBe('platform-token')
  })

  it('validates a recovered user profile before entering the platform', async () => {
    setToken('token-without-profile')
    getCurrentUser.mockResolvedValue({ storeId: 1, role: 'admin' })
    await router.push('/login')
    await router.push('/merchants')
    expect(router.currentRoute.value.path).toBe('/login')
    expect(getToken()).toBe('')
  })

  it('does not log out a new session when an older route profile request fails', async () => {
    await router.push('/login')
    setToken('session-A')
    const auth = useAuthStore()
    auth.bootstrap()
    let rejectOld, started = false
    const old = new Promise((resolve, reject) => { rejectOld = reject })
    getCurrentUser.mockImplementationOnce(() => { started = true; return old })
    const navigation = router.push('/merchants')
    await vi.waitFor(() => expect(started).toBe(true))
    login.mockResolvedValueOnce({ token: 'session-B', userInfo: { id: 2, storeId: 0, role: 'admin' } })
    await auth.login('synthetic-account-B', 'synthetic-password')
    rejectOld(new Error('Old request failed'))
    await navigation
    expect(auth.token).toBe('session-B')
    expect(auth.user.id).toBe(2)
    expect(getToken()).toBe('session-B')
  })

  it('clears expired recovery state so the login route can render', async () => {
    await router.push('/login')
    setToken('expired-session')
    const auth = useAuthStore()
    auth.bootstrap()
    getCurrentUser.mockImplementationOnce(async () => {
      clearAuth()
      const error = new Error('登录已失效')
      error.code = 401
      throw error
    })
    await router.push('/merchants')
    expect(auth.token).toBe('')
    expect(auth.user).toBe(null)
    expect(router.currentRoute.value.path).toBe('/login')
  })
})
