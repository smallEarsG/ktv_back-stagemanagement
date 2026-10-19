import { defineStore } from 'pinia'
import { getToken, getUser, setToken, setUser, clearAuth, isPlatformUser, supersededAuthRequest, PLATFORM_ACCOUNT_MESSAGE } from '@/utils/auth'
import { getCurrentUser, login as loginApi } from '@/api/auth'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: getToken(),
    user: getUser(),
    bootstrapped: false,
    sessionGeneration: 0,
    profileGeneration: 0,
  }),
  getters: {
    isAuthed: (s) => Boolean(s.token),
    displayName: (s) => s.user?.nickname || s.user?.username || '',
  },
  actions: {
    bootstrap() {
      this.sessionGeneration++
      this.profileGeneration++
      this.token = getToken()
      this.user = getUser()
      this.bootstrapped = true
    },
    setAuth(payload) {
      this.sessionGeneration++
      this.profileGeneration++
      this.token = payload?.token || ''
      this.user = payload?.userInfo || null
      setToken(this.token)
      setUser(this.user)
    },
    async login(phone, password) {
      const generation = ++this.sessionGeneration
      this.profileGeneration++
      let data
      try { data = await loginApi({ phone, password }) }
      catch (error) { if (generation !== this.sessionGeneration) throw supersededAuthRequest(); throw error }
      if (generation !== this.sessionGeneration) throw supersededAuthRequest()
      if (!isPlatformUser(data?.userInfo)) {
        this.logout()
        throw new Error(PLATFORM_ACCOUNT_MESSAGE)
      }
      this.setAuth(data)
      return data
    },
    async fetchMe() {
      const generation = ++this.profileGeneration, session = this.sessionGeneration, token = this.token
      const current = () => generation === this.profileGeneration && session === this.sessionGeneration && token === this.token && token === getToken()
      let me
      try { me = await getCurrentUser() }
      catch (error) { if (!current()) throw supersededAuthRequest(); throw error }
      if (!current()) throw supersededAuthRequest()
      if (!isPlatformUser(me)) {
        this.logout()
        throw new Error(PLATFORM_ACCOUNT_MESSAGE)
      }
      this.user = me
      setUser(me)
      return me
    },
    logout() {
      this.sessionGeneration++
      this.profileGeneration++
      this.token = ''
      this.user = null
      clearAuth()
    },
  },
})

