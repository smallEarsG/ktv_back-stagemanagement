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
    vi.clearAllMocks()
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
})
