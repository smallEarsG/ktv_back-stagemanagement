import { defineStore } from 'pinia'
import { getToken, getUser, setToken, setUser, clearAuth, isPlatformUser, PLATFORM_ACCOUNT_MESSAGE } from '@/utils/auth'
import { getCurrentUser, login as loginApi } from '@/api/auth'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: getToken(),
    user: getUser(),
    bootstrapped: false,
  }),
  getters: {
    isAuthed: (s) => Boolean(s.token),
    displayName: (s) => s.user?.nickname || s.user?.username || '',
  },
  actions: {
    bootstrap() {
      this.token = getToken()
      this.user = getUser()
      this.bootstrapped = true
    },
    setAuth(payload) {
      this.token = payload?.token || ''
      this.user = payload?.userInfo || null
      setToken(this.token)
      setUser(this.user)
    },
    async login(phone, password) {
      const data = await loginApi({ phone, password })
      if (!isPlatformUser(data?.userInfo)) {
        this.logout()
        throw new Error(PLATFORM_ACCOUNT_MESSAGE)
      }
      this.setAuth(data)
      return data
    },
    async fetchMe() {
      const me = await getCurrentUser()
      if (!isPlatformUser(me)) {
        this.logout()
        throw new Error(PLATFORM_ACCOUNT_MESSAGE)
      }
      this.user = me
      setUser(me)
      return me
    },
    logout() {
      this.token = ''
      this.user = null
      clearAuth()
    },
  },
})

