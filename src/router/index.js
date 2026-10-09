import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { isPlatformUser, PLATFORM_ACCOUNT_MESSAGE } from '@/utils/auth'

import LoginPage from '@/pages/LoginPage.vue'
import MerchantsPage from '@/pages/MerchantsPage.vue'

const routes = [
  { path: '/', redirect: '/merchants' },
  { path: '/login', name: 'login', component: LoginPage },
  {
    path: '/merchants',
    name: 'merchants',
    component: MerchantsPage,
    meta: { requiresAuth: true },
  },
  { path: '/:pathMatch(.*)*', redirect: '/merchants' },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (!auth.bootstrapped) auth.bootstrap()

  if (auth.isAuthed && !auth.user) {
    try {
      await auth.fetchMe()
    } catch (error) {
      auth.logout()
      return {
        path: '/login',
        query: error?.message === PLATFORM_ACCOUNT_MESSAGE ? { reason: 'platform-account-required' } : {},
      }
    }
  }

  if (auth.isAuthed && !isPlatformUser(auth.user)) {
    auth.logout()
    return { path: '/login', query: { reason: 'platform-account-required' } }
  }

  if (to.path === '/login' && auth.isAuthed) return { path: '/merchants' }

  if (to.meta?.requiresAuth && !auth.isAuthed) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  return true
})

export default router

