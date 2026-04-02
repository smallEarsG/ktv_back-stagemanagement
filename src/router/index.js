import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

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
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (!auth.bootstrapped) auth.bootstrap()

  if (to.path === '/login' && auth.isAuthed) return { path: '/merchants' }

  if (to.meta?.requiresAuth && !auth.isAuthed) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  if (to.meta?.requiresAuth && auth.isAuthed && !auth.user) {
    try {
      await auth.fetchMe()
    } catch {
      auth.logout()
      return { path: '/login', query: { redirect: to.fullPath } }
    }
  }

  return true
})

export default router

