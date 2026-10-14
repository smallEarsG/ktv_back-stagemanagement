<script setup>
import { useRouter } from 'vue-router'
import { LogOut } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import UiButton from '@/components/UiButton.vue'

const auth = useAuthStore()
const router = useRouter()

function logout() {
  auth.logout()
  router.replace('/login')
}
</script>

<template>
  <header class="border-b bg-white">
    <div class="mx-auto flex min-h-14 max-w-[1440px] flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-6">
      <div class="text-sm font-semibold text-zinc-900">超级管理系统</div>
      <nav class="flex flex-wrap gap-4 text-sm"><RouterLink to="/merchants" class="text-slate-600" active-class="font-semibold text-blue-700">门店管理</RouterLink><RouterLink to="/subscriptions" class="text-slate-600" active-class="font-semibold text-blue-700">服务期限</RouterLink><RouterLink to="/audit" class="text-slate-600" active-class="font-semibold text-blue-700">操作记录</RouterLink><RouterLink to="/operations" class="text-slate-600" active-class="font-semibold text-blue-700">运行保障</RouterLink></nav>
      <div class="flex items-center gap-3">
        <div class="text-sm text-zinc-700">{{ auth.displayName || '管理员' }}</div>
        <UiButton variant="secondary" @click="router.push('/account/security')">修改密码</UiButton>
        <UiButton variant="secondary" @click="logout">
          <LogOut class="mr-2 h-4 w-4" />
          退出
        </UiButton>
      </div>
    </div>
  </header>
</template>

