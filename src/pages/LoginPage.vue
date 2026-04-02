<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import UiInput from '@/components/UiInput.vue'
import UiButton from '@/components/UiButton.vue'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const form = reactive({
  phone: '',
  password: '',
})

const errors = reactive({
  phone: '',
  password: '',
})

const submitting = ref(false)
const apiError = ref('')

function validate() {
  errors.phone = ''
  errors.password = ''
  apiError.value = ''

  let ok = true
  if (!String(form.phone).trim()) {
    errors.phone = '请输入手机号'
    ok = false
  }
  if (!String(form.password).trim()) {
    errors.password = '请输入密码'
    ok = false
  }
  return ok
}

async function onSubmit() {
  if (!validate()) return
  submitting.value = true
  apiError.value = ''
  try {
    await auth.login(form.phone, form.password)
    const redirect = route.query.redirect
    router.replace(typeof redirect === 'string' && redirect ? redirect : '/merchants')
  } catch (e) {
    apiError.value = e?.message || '登录失败'
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
          <div class="text-lg font-semibold text-zinc-900">登录</div>
          <div class="mt-1 text-sm text-zinc-500">使用管理员账号登录系统</div>
        </div>

        <form class="space-y-4" @submit.prevent="onSubmit">
          <UiInput
            v-model="form.phone"
            name="phone"
            label="手机号"
            placeholder="请输入手机号"
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
          </div>

          <UiButton class="w-full" type="submit" :loading="submitting">登录</UiButton>
        </form>

        <div class="mt-6 text-center text-xs text-zinc-500">超级管理系统</div>
      </div>
    </div>
  </div>
</template>

