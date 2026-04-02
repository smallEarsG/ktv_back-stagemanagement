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
    <div class="mx-auto flex h-14 max-w-[1440px] items-center justify-between px-6">
      <div class="text-sm font-semibold text-zinc-900">超级管理系统</div>
      <div class="flex items-center gap-3">
        <div class="text-sm text-zinc-700">{{ auth.displayName || '管理员' }}</div>
        <UiButton variant="secondary" @click="logout">
          <LogOut class="mr-2 h-4 w-4" />
          退出
        </UiButton>
      </div>
    </div>
  </header>
</template>

