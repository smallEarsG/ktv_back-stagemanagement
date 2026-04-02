<script setup>
import { computed, reactive, watch } from 'vue'
import UiModal from '@/components/UiModal.vue'
import UiInput from '@/components/UiInput.vue'
import UiButton from '@/components/UiButton.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  mode: { type: String, default: 'create' },
  initialValue: { type: Object, default: () => ({}) },
  submitting: { type: Boolean, default: false },
  errorMessage: { type: String, default: '' },
})

const emit = defineEmits(['close', 'submit'])

const title = computed(() => (props.mode === 'edit' ? '编辑商家' : '新增商家'))

const form = reactive({
  name: '',
  contactName: '',
  contactPhone: '',
  adminUsername: '',
  adminPassword: '',
  adminName: '',
  adminPhone: '',
})

const errors = reactive({
  name: '',
  contactName: '',
  contactPhone: '',
  adminUsername: '',
  adminPassword: '',
  adminPhone: '',
})

function resetErrors() {
  Object.keys(errors).forEach((k) => {
    errors[k] = ''
  })
}

function fillFromInitial() {
  const v = props.initialValue || {}
  form.name = v.name || ''
  form.contactName = v.contactName || ''
  form.contactPhone = v.contactPhone || ''

  form.adminUsername = ''
  form.adminPassword = ''
  form.adminName = ''
  form.adminPhone = ''
}

watch(
  () => [props.open, props.initialValue, props.mode],
  () => {
    if (!props.open) return
    resetErrors()
    fillFromInitial()
  },
  { immediate: true },
)

function validate() {
  resetErrors()
  let ok = true

  if (!String(form.name).trim()) {
    errors.name = '请填写商家名称'
    ok = false
  }
  if (!String(form.contactName).trim()) {
    errors.contactName = '请填写联系人姓名'
    ok = false
  }
  if (!String(form.contactPhone).trim()) {
    errors.contactPhone = '请填写联系人手机号'
    ok = false
  }

  if (props.mode === 'create') {
    if (!String(form.adminUsername).trim()) {
      errors.adminUsername = '请填写管理员账号'
      ok = false
    }
    if (!String(form.adminPassword).trim()) {
      errors.adminPassword = '请填写管理员密码'
      ok = false
    }
    if (!String(form.adminPhone).trim()) {
      errors.adminPhone = '请填写管理员手机号'
      ok = false
    }
  }

  return ok
}

function onSubmit() {
  if (!validate()) return

  if (props.mode === 'edit') {
    emit('submit', {
      name: form.name,
      contactName: form.contactName,
      contactPhone: form.contactPhone,
    })
    return
  }

  emit('submit', {
    name: form.name,
    contactName: form.contactName,
    contactPhone: form.contactPhone,
    adminUsername: form.adminUsername,
    adminPassword: form.adminPassword,
    adminName: form.adminName,
    adminPhone: form.adminPhone,
  })
}
</script>

<template>
  <UiModal :open="open" :title="title" @close="emit('close')">
    <div class="space-y-4">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <UiInput v-model="form.name" label="商家名称" :error="errors.name" />
        <UiInput
          v-model="form.contactName"
          label="联系人"
          :error="errors.contactName"
        />
        <UiInput
          v-model="form.contactPhone"
          label="联系人手机号"
          :error="errors.contactPhone"
        />
      </div>

      <div
        v-if="mode === 'create'"
        class="rounded-md border border-zinc-200 bg-zinc-50 p-4"
      >
        <div class="mb-3 text-sm font-semibold text-zinc-900">
          门店管理员账号
        </div>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <UiInput
            v-model="form.adminUsername"
            label="管理员账号"
            :error="errors.adminUsername"
          />
          <UiInput
            v-model="form.adminPassword"
            label="管理员密码"
            type="password"
            :error="errors.adminPassword"
          />
          <UiInput v-model="form.adminName" label="管理员姓名" />
          <UiInput
            v-model="form.adminPhone"
            label="管理员手机号"
            :error="errors.adminPhone"
          />
        </div>
      </div>

      <div v-if="errorMessage" class="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
        {{ errorMessage }}
      </div>

      <div class="flex justify-end gap-3">
        <UiButton variant="secondary" :disabled="submitting" @click="emit('close')">
          取消
        </UiButton>
        <UiButton :loading="submitting" @click="onSubmit">保存</UiButton>
      </div>
    </div>
  </UiModal>
</template>

