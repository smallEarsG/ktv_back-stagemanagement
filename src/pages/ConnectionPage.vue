<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import UiButton from '@/components/UiButton.vue'
const route = useRoute(), router = useRouter(), auth = useAuthStore(), busy = ref(false)
const target = computed(() => {
  const path = route.query.redirect
  return typeof path === 'string' && /^\/(?!\/)/.test(path) && !/^\/(?:login|connection)(?:[/?#]|$)/.test(path) ? path : '/merchants'
})
async function retry() { if (busy.value) return; busy.value = true; try { await router.replace(target.value) } finally { busy.value = false } }
function login() { auth.logout(); router.replace('/login') }
</script>
<template>
  <main class="flex min-h-screen items-center justify-center bg-slate-50 p-5">
    <section class="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-7">
      <h1 class="text-xl font-semibold text-slate-900">暂时无法确认登录信息</h1>
      <p role="alert" class="my-5 text-sm leading-7 text-slate-600">服务暂时未响应，登录凭据已保留。连接恢复后可继续原页面，确认前暂停业务操作。</p>
      <div class="flex flex-wrap gap-3"><UiButton :loading="busy" @click="retry">重新连接</UiButton><UiButton variant="secondary" :disabled="busy" @click="login">重新登录</UiButton></div>
    </section>
  </main>
</template>
