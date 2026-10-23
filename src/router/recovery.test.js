import { beforeEach, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { getCurrentUser } from '@/api/auth'
import { getToken } from '@/utils/auth'
import router from './index'

vi.mock('@/api/auth', () => ({ getCurrentUser: vi.fn(), login: vi.fn() }))
beforeEach(async () => {
  localStorage.clear(); setActivePinia(createPinia()); vi.clearAllMocks()
  await router.replace('/login')
})
it('keeps a valid saved token and offers retry after a temporary profile failure', async () => {
  const auth = useAuthStore(); auth.setAuth({ token:'valid-session', userInfo:null })
  getCurrentUser.mockRejectedValue(Object.assign(new Error('temporarily unavailable'), { response:{status:503} }))
  await router.replace('/merchants')
  expect(auth.token).toBe('valid-session'); expect(getToken()).toBe('valid-session')
  expect(router.currentRoute.value.path).toBe('/connection')
  expect(router.currentRoute.value.query.redirect).toBe('/merchants')
  getCurrentUser.mockResolvedValue({id:7,storeId:0,role:'admin'})
  await router.replace('/merchants')
  expect(router.currentRoute.value.path).toBe('/merchants'); expect(auth.user.id).toBe(7)
})
it('still clears a genuinely expired saved session', async () => {
  const auth=useAuthStore(); auth.setAuth({token:'expired-session',userInfo:null})
  getCurrentUser.mockRejectedValue(Object.assign(new Error('expired'),{code:401}))
  await router.replace('/merchants')
  expect(auth.token).toBe(''); expect(router.currentRoute.value.path).toBe('/login')
})
it('does not turn an older profile failure into logout after a newer login', async () => {
  let reject
  const auth=useAuthStore();auth.setAuth({token:'session-A',userInfo:null})
  getCurrentUser.mockReturnValue(new Promise((yes,no)=>{reject=no}))
  const navigation=router.replace('/merchants')
  await vi.waitFor(()=>expect(getCurrentUser).toHaveBeenCalledTimes(1))
  auth.setAuth({token:'session-B',userInfo:{id:8,storeId:0,role:'admin'}})
  reject(Object.assign(new Error('old failure'),{code:401}));await navigation
  expect(auth.token).toBe('session-B');expect(auth.user.id).toBe(8)
})
