<script setup>
import { onBeforeUnmount, reactive, ref, watch } from 'vue'
import { getTerm, saveTerm } from '@/api/governance'
import { extendTerm, serviceLabels } from '@/utils/governance'
import UiModal from './UiModal.vue'
import UiInput from './UiInput.vue'
import UiButton from './UiButton.vue'
const props = defineProps({ merchant: { type: Object, default: null } }), emit = defineEmits(['close', 'saved'])
const loading = ref(false), saving = ref(false), loaded = ref(false), error = ref(''), current = ref(null)
const form = reactive({ version: 0, unlimited: true, expiresOn: '', reason: '', confirmExpired: false })
let generation = 0
async function load() {
  const id = props.merchant?.id
  const version = ++generation; error.value = ''; loaded.value = false; current.value = null; Object.assign(form, { version: 0, unlimited: true, expiresOn: '', reason: '', confirmExpired: false })
  if (!id) return
  loading.value = true
  try { const data = await getTerm(id); if (version === generation) { current.value = data; Object.assign(form, { version: data.version, unlimited: !data.expiresOn, expiresOn: data.expiresOn || '' }); loaded.value = true } }
  catch (e) { if (version === generation) error.value = e.message }
  finally { if (version === generation) loading.value = false }
}
watch(() => props.merchant?.id, load, { immediate: true })
function extend(months) { form.unlimited = false; form.expiresOn = extendTerm(form.expiresOn, months) }
async function submit() {
  if (saving.value || !loaded.value) return
  if (!form.reason.trim() || (!form.unlimited && !form.expiresOn)) { error.value = '请选择到期日期并填写调整原因'; return }
  saving.value = true; error.value = ''; const version = generation
  try { await saveTerm(props.merchant.id, { ...form }); if (version === generation) { emit('saved'); emit('close') } }
  catch (e) { if (version === generation) error.value = e.message || '结果未确认，请重新加载核对服务期限' }
  finally { if (version === generation) saving.value = false }
}
function close() { if (!saving.value) { generation++; emit('close') } }
onBeforeUnmount(() => { generation++ })
</script>
<template>
  <UiModal :open="!!merchant" :title="`${merchant?.name || '商户'} · 点餐服务期限（兼容入口）`" @close="close"><form class="space-y-4" @submit.prevent="submit"><p class="text-sm text-slate-600">此兼容入口仅调整点餐服务期限，不会续费或开通商城。商城及双业务门店请到门店列表的“产品与应用”选择对应业务。到期日按北京时间计算，包含当天；历史账单仍可结账、退款。</p><p v-if="current" class="text-sm">当前：{{ serviceLabels[current.status] }}{{ current.expiresOn ? ' · ' + current.expiresOn : '' }}</p><p v-if="loading" role="status">正在读取服务期限…</p><UiButton variant="secondary" :disabled="loading || saving" @click="load">重新加载</UiButton><fieldset :disabled="loading || saving || !loaded" class="space-y-4"><label class="flex gap-2 text-sm"><input v-model="form.unlimited" type="checkbox">点餐服务不设到期日</label><template v-if="!form.unlimited"><label class="block text-sm">到期日期<input v-model="form.expiresOn" type="date" class="mt-1 w-full rounded border p-2" /></label><div class="flex flex-wrap gap-2"><UiButton variant="secondary" @click="extend(3)">延长3个月</UiButton><UiButton variant="secondary" @click="extend(12)">延长1年</UiButton></div><label class="flex gap-2 text-sm"><input v-model="form.confirmExpired" type="checkbox">若日期已过期，确认停止新增消费</label></template><UiInput v-model="form.reason" label="开通／续费／调整原因" maxlength="255" /></fieldset><p v-if="error" role="alert" class="text-sm text-red-700">{{ error }}</p><UiButton type="submit" :loading="saving" :disabled="loading || !loaded">保存服务期限</UiButton></form></UiModal>
</template>
