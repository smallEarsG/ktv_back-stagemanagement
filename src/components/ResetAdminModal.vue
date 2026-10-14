<script setup>
import { onBeforeUnmount, reactive, ref, watch } from 'vue'
import { listAdmins, resetAdmin } from '@/api/governance'
import { validatePasswordForm } from '@/utils/governance'
import UiModal from './UiModal.vue'
import UiInput from './UiInput.vue'
import UiButton from './UiButton.vue'
const props = defineProps({ merchant: { type: Object, default: null } }), emit = defineEmits(['close'])
const rows = ref([]), selected = ref(''), busy = ref(false), loading = ref(false), error = ref(''), message = ref('')
const form = reactive({ operatorPassword: '', newPassword: '', confirmPassword: '', reason: '', confirmed: false })
let generation = 0
function wipe() { Object.assign(form, { operatorPassword: '', newPassword: '', confirmPassword: '', reason: '', confirmed: false }); message.value = ''; error.value = ''; rows.value = []; selected.value = '' }
watch(() => props.merchant?.id, async id => {
  const version = ++generation; wipe(); loading.value = false
  if (!id) return
  loading.value = true
  try { const data = await listAdmins(id); if (version === generation) { rows.value = data; selected.value = data.length === 1 ? data[0].id : '' } }
  catch (e) { if (version === generation) error.value = e.message }
  finally { if (version === generation) loading.value = false }
}, { immediate: true })
async function submit() {
  if (busy.value || loading.value) return
  error.value = validatePasswordForm(form, true); if (error.value) return
  if (!selected.value) { error.value = '请选择需要重置的店长账号'; return }
  busy.value = true; const version = generation, store = props.merchant.id
  try { await resetAdmin(store, selected.value, { ...form }); if (version === generation) message.value = '已重置，旧登录全部失效。请将临时密码交给店长，店长下次登录须先改密。' }
  catch (e) { if (version === generation) error.value = e.message || '结果未确认，请核对操作记录' }
  finally { form.operatorPassword = ''; form.newPassword = ''; form.confirmPassword = ''; if (version === generation) busy.value = false }
}
function close() { if (!busy.value) { generation++; wipe(); emit('close') } }
onBeforeUnmount(() => { generation++; wipe() })
</script>
<template>
  <UiModal :open="!!merchant" :title="`${merchant?.name || '商户'} · 重置店长密码`" @close="close"><form class="space-y-4" @submit.prevent="submit"><p class="text-sm text-slate-600">仅重置所选门店的店长账号。操作会永久记录，重置后所有旧登录立即失效。</p><p v-if="loading" role="status">正在核对本店账号…</p><label class="block text-sm">店长账号<select v-model="selected" class="mt-1 w-full rounded border p-2" :disabled="busy || loading"><option value="">请选择</option><option v-for="row in rows" :key="row.id" :value="row.id">{{ row.name }} · {{ row.username }} · #{{ row.id }}</option></select></label><UiInput v-model="form.operatorPassword" label="当前平台操作人的密码" type="password" autocomplete="current-password" :disabled="busy" /><UiInput v-model="form.newPassword" label="临时新密码（至少8位）" type="password" autocomplete="new-password" :disabled="busy" /><UiInput v-model="form.confirmPassword" label="确认临时密码" type="password" autocomplete="new-password" :disabled="busy" /><UiInput v-model="form.reason" label="重置原因" maxlength="255" :disabled="busy" /><label class="flex gap-2 text-sm"><input v-model="form.confirmed" type="checkbox" :disabled="busy">已核对账号，确认使旧登录失效</label><p v-if="error" role="alert" class="text-sm text-red-700">{{ error }}</p><p v-if="message" role="status" class="text-sm text-green-700">{{ message }}</p><UiButton type="submit" :loading="busy" :disabled="loading || !!message">确认重置此账号</UiButton></form></UiModal>
</template>
