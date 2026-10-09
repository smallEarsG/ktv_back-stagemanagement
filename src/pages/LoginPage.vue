<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { PLATFORM_ACCOUNT_MESSAGE } from '@/utils/auth'
import UiInput from '@/components/UiInput.vue'
import UiButton from '@/components/UiButton.vue'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const demoMode = import.meta.env.VITE_DEMO_MODE === 'true'
const demoAccount = import.meta.env.VITE_DEMO_ACCOUNT || 'platform-local'
const demoPassword = import.meta.env.VITE_DEMO_PASSWORD || 'LocalDemo123!'

const form = reactive({
  phone: '',
  password: '',
})

const errors = reactive({
  phone: '',
  password: '',
})

const submitting = ref(false)
const apiError = ref(route.query.reason === 'platform-account-required' ? PLATFORM_ACCOUNT_MESSAGE : '')
const entryExpired = ref(route.query.reason === 'demo-entry-expired')
const entryUrl = `/demo/access/?next=${encodeURIComponent('/demo/platform/login')}`
if (entryExpired.value) apiError.value = '演示入口验证已过期，请重新验证入口后登录'

function fillDemoAccount() {
  form.phone = demoAccount
  form.password = demoPassword
  errors.phone = ''; errors.password = ''
}

function validate() {
  errors.phone = ''
  errors.password = ''
  apiError.value = ''

  let ok = true
  if (!String(form.phone).trim()) {
    errors.phone = '请输入账号或手机号'
    ok = false
  }
  if (!String(form.password).trim()) {
    errors.password = '请输入密码'
    ok = false
  }
  return ok
}

async function onSubmit() {
  if (submitting.value) return
  if (!validate()) return
  submitting.value = true
  apiError.value = ''
  entryExpired.value = false
  try {
    await auth.login(form.phone, form.password)
    const redirect = route.query.redirect
    router.replace(typeof redirect === 'string' && redirect ? redirect : '/merchants')
  } catch (e) {
    apiError.value = e?.message || '登录失败'
    entryExpired.value = Boolean(e?.demoEntryExpired)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#F5F7FA]">
    <div class="mx-auto flex min-h-screen max-w-[1440px] items-center justify-center px-6">
      <div class="w-full max-w-md rounded-lg bg-white p-6 shadow">
        <div class="mb-6">
          <div class="text-lg font-semibold text-zinc-900">平台管理员登录</div>
          <div class="mt-1 text-sm text-zinc-500">使用平台账号登录，商家店长账号请进入商家后台</div>
        </div>

        <form class="space-y-4" @submit.prevent="onSubmit">
          <UiInput
            v-model="form.phone"
            name="phone"
            label="账号 / 手机号"
            placeholder="请输入账号或手机号"
            :error="errors.phone"
          />
          <UiInput
            v-model="form.password"
            name="password"
            type="password"
            label="密码"
            placeholder="请输入密码"
            :error="errors.password"
          />

          <div v-if="apiError" class="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {{ apiError }}
            <a v-if="demoMode && entryExpired" :href="entryUrl" class="mt-2 block font-medium underline">重新验证演示入口</a>
          </div>

          <UiButton class="w-full" type="submit" :loading="submitting">登录</UiButton>
        </form>

        <div v-if="demoMode" class="mt-6 text-center text-xs text-zinc-500">
          <p>演示账号：{{ demoAccount }} / {{ demoPassword }}</p>
          <UiButton variant="secondary" class="mt-3" :disabled="submitting" @click="fillDemoAccount">填入演示平台账号</UiButton>
          <a :href="entryUrl" class="mt-3 block text-blue-600 underline">重新验证演示入口</a>
        </div>
      </div>
    </div>
  </div>
</template>

