import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getToken, isPlatformUser, PLATFORM_ACCOUNT_MESSAGE } from '@/utils/auth'

import LoginPage from '@/pages/LoginPage.vue'
import MerchantsPage from '@/pages/MerchantsPage.vue'
import OperationsPage from '@/pages/OperationsPage.vue'

const routes = [
  { path: '/connection', name: 'connection', component: () => import('@/pages/ConnectionPage.vue'), meta: { requiresAuth: true } },
  { path: '/integrations', name: 'integrations', component: () => import('@/pages/IntegrationsPage.vue'), meta: { requiresAuth: true } },
  { path: '/audit', name: 'audit', component: () => import('@/pages/AuditPage.vue'), meta: { requiresAuth: true } },
  { path: '/subscriptions', name: 'subscriptions', component: () => import('@/pages/SubscriptionsPage.vue'), meta: { requiresAuth: true } },
  { path: '/account/security', name: 'account-security', component: () => import('@/pages/AccountSecurityPage.vue'), meta: { requiresAuth: true } },
  { path: '/operations', name: 'operations', component: OperationsPage, meta: { requiresAuth: true } },
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
      if (error?.code === 'AUTH_SUPERSEDED' && getToken()) return false
      const expired = [error?.code, error?.response?.status].some(code => Number(code) === 401)
      if (getToken() && !expired && error?.message !== PLATFORM_ACCOUNT_MESSAGE) {
        if (to.path === '/connection') return true
        return { path: '/connection', query: { redirect: to.fullPath } }
      }
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

  if (auth.isAuthed && auth.user?.passwordChangeRequired && to.path !== '/account/security') return { path: '/account/security' }
  if (to.path === '/connection' && auth.user) return { path: '/merchants' }
  if (to.path === '/login' && auth.isAuthed) return { path: '/merchants' }

  if (to.meta?.requiresAuth && !auth.isAuthed) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  return true
})

export default router

