<script setup>
import { onBeforeUnmount, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { changePassword } from '@/api/governance'
import { validatePasswordForm } from '@/utils/governance'
import AppHeader from '@/components/AppHeader.vue'
import UiInput from '@/components/UiInput.vue'
import UiButton from '@/components/UiButton.vue'
const auth = useAuthStore(), router = useRouter(), busy = ref(false), error = ref('')
const form = reactive({ currentPassword: '', newPassword: '', confirmPassword: '' })
let disposed = false
onBeforeUnmount(() => { disposed = true; Object.assign(form, { currentPassword: '', newPassword: '', confirmPassword: '' }) })
async function submit() {
  if (busy.value) return
  error.value = validatePasswordForm(form); if (error.value) return
  busy.value = true
  const token = auth.token, session = auth.sessionGeneration
  const current = () => !disposed && token === auth.token && session === auth.sessionGeneration
  try { await changePassword({ ...form }); if (current()) { auth.logout(); router.replace({ path: '/login', query: { reason: 'password-changed' } }) } }
  catch (e) { if (current()) error.value = e.message || '修改结果未确认，请用新密码登录核对' }
  finally { busy.value = false; form.currentPassword = ''; form.newPassword = ''; form.confirmPassword = '' }
}
</script>
<template>
  <div class="min-h-screen bg-slate-50"><AppHeader /><main class="mx-auto max-w-xl p-6"><h1 class="mb-3 text-2xl font-semibold">修改密码</h1><p class="mb-5 text-sm text-slate-600">{{ auth.user?.passwordChangeRequired ? '请先修改初始或临时密码，再继续使用平台。' : '修改后，当前账号的所有旧登录将失效，请重新登录。' }}</p><form class="space-y-4 rounded-xl bg-white p-5" @submit.prevent="submit"><UiInput v-model="form.currentPassword" type="password" name="currentPassword" label="原密码" autocomplete="current-password" :disabled="busy" /><UiInput v-model="form.newPassword" type="password" name="newPassword" label="新密码（至少8位）" autocomplete="new-password" :disabled="busy" /><UiInput v-model="form.confirmPassword" type="password" name="confirmPassword" label="确认新密码" autocomplete="new-password" :disabled="busy" /><p v-if="error" role="alert" class="text-sm text-red-700">{{ error }}</p><UiButton type="submit" :loading="busy">修改并重新登录</UiButton></form></main></div>
</template>
