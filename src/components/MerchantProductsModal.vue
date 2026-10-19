<script setup>
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { getMerchantProducts, saveMerchantProduct, saveMerchantApplication } from '@/api/merchant'
import UiModal from './UiModal.vue'
import UiButton from './UiButton.vue'
import UiInput from './UiInput.vue'
import MerchantWechatModal from './MerchantWechatModal.vue'

const props = defineProps({ merchant: { type: Object, default: null }, initialProduct: { type: String, default: '' } })
const emit = defineEmits(['close', 'saved'])
const products = ref([]), loading = ref(false), saving = ref(false), error = ref(''), message = ref(''), selected = ref(''), wechat = ref(null), uncertain = ref(false)
const form = reactive({ granted: false, enabled: false, unlimited: true, expiresOn: '', reason: '', confirmExpired: false })
const applicationReason = ref('')
const current = computed(() => products.value.find(item => item.productType === selected.value))
const labels = { NOT_OPEN: '未开通', ACTIVE: '服务中', EXPIRING: '即将到期', EXPIRED: '已到期', PAUSED: '已暂停', UNLIMITED: '长期有效' }
let generation = 0
watch(() => form.granted, granted => { if (!granted) form.enabled = false }, { flush: 'sync' })
function select(product) {
  if (saving.value || uncertain.value) return
  selected.value = product.productType
  Object.assign(form, { granted: !!product.granted, enabled: !!product.enabled, unlimited: !product.expiresOn, expiresOn: product.expiresOn || '', reason: '', confirmExpired: false })
  applicationReason.value = ''
}
async function load() {
  if (saving.value) return
  const store = props.merchant?.id, version = ++generation
  products.value = []; selected.value = ''; error.value = ''; message.value = ''; uncertain.value = false; loading.value = false
  if (store == null) return
  loading.value = true
  try {
    const data = await getMerchantProducts(store)
    if (version !== generation) return
    products.value = Array.isArray(data?.products) ? data.products : []
    if (!products.value.length) throw new Error('服务端未返回产品授权，请重新加载')
    select(products.value.find(p => p.productType === props.initialProduct) || products.value.find(p => p.granted) || products.value.find(p => p.historyAccessible) || products.value[0])
  } catch (e) { if (version === generation) error.value = e.message || '产品授权读取失败，请重试' }
  finally { if (version === generation) loading.value = false }
}
async function save() {
  if (!current.value || saving.value || uncertain.value || loading.value) return
  if (!form.reason.trim() || (form.granted && !form.unlimited && !form.expiresOn)) { error.value = '请填写调整原因，并设置服务期限'; return }
  const version = generation, product = current.value
  saving.value = true; error.value = ''; message.value = ''
  try {
    await saveMerchantProduct(props.merchant.id, product.productType, { ...form, expectedVersion: product.version, expiresOn: form.unlimited ? null : form.expiresOn })
    if (version !== generation) return
    message.value = '产品授权已保存，请重新加载查看最新状态。'; uncertain.value = true; emit('saved')
  } catch (e) { if (version === generation) { error.value = `${e.message || '保存结果未确认'}。请重新加载核对后再调整。`; uncertain.value = true } }
  finally { if (version === generation) saving.value = false }
}
async function toggleApplication() {
  const application = current.value?.application
  if (!application || saving.value || uncertain.value) return
  if (!applicationReason.value.trim()) { error.value = '请填写应用状态调整原因'; return }
  const version = generation
  saving.value = true; error.value = ''; message.value = ''
  try {
    await saveMerchantApplication(props.merchant.id, application.id, { expectedVersion: application.version, status: application.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE', reason: applicationReason.value.trim() })
    if (version !== generation) return
    uncertain.value = true; message.value = '应用状态已保存，请重新加载核对。'; emit('saved')
  } catch (e) { if (version === generation) { error.value = `${e.message || '应用状态未确认'}。请重新加载核对。`; uncertain.value = true } }
  finally { if (version === generation) saving.value = false }
}
function close() { if (!saving.value && !wechat.value) { generation++; emit('close') } }
watch(() => [props.merchant?.id, props.initialProduct], load, { immediate: true })
onBeforeUnmount(() => { generation++ })
</script>

<template>
  <UiModal :open="!!merchant" :title="`${merchant?.name || '商户'} · 产品与应用`" @close="close">
    <div class="space-y-4">
      <p class="text-sm leading-6 text-slate-600">点餐与商城分别授权、续费和配置小程序。暂停或到期后停止新增交易，已有订单仍按规则履约和售后。</p>
      <div class="flex items-center justify-between gap-3"><span class="text-xs text-slate-500">门店 #{{ merchant?.id }}</span><UiButton variant="secondary" :disabled="loading || saving" @click="load">重新加载</UiButton></div>
      <p v-if="loading" role="status" class="text-sm text-slate-500">正在读取产品授权…</p>
      <p v-if="error" role="alert" class="rounded bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>
      <p v-if="message" role="status" class="rounded bg-green-50 p-3 text-sm text-green-700">{{ message }}</p>
      <div class="grid grid-cols-2 gap-3">
        <button v-for="product in products" :key="product.productType" type="button" :disabled="saving || uncertain" :aria-pressed="selected === product.productType" class="rounded-lg border p-3 text-left disabled:opacity-60" :class="selected === product.productType ? 'border-blue-500 bg-blue-50' : 'border-slate-200'" @click="select(product)"><span class="block font-semibold text-slate-900">{{ product.name || (product.productType === 'MALL' ? '商城' : '点餐') }}</span><span class="mt-1 block text-xs text-slate-600">{{ labels[product.status] || product.status }}{{ product.expiresOn ? ` · ${product.expiresOn}` : '' }}</span></button>
      </div>
      <form v-if="current" class="space-y-4" @submit.prevent="save">
        <fieldset :disabled="saving || uncertain" class="space-y-4 rounded-lg border border-slate-200 p-4">
          <legend class="px-1 text-sm font-semibold">产品授权与期限</legend>
          <label class="flex gap-2 text-sm"><input v-model="form.granted" type="checkbox" name="granted">开通此产品</label>
          <label class="flex gap-2 text-sm"><input v-model="form.enabled" type="checkbox" name="enabled" :disabled="!form.granted">允许新增交易</label>
          <label class="flex gap-2 text-sm"><input v-model="form.unlimited" type="checkbox" name="unlimited">不设置到期日</label>
          <template v-if="!form.unlimited"><UiInput v-model="form.expiresOn" name="expiresOn" label="到期日期（北京时间，含当天）" type="date" /><label class="flex gap-2 text-sm"><input v-model="form.confirmExpired" type="checkbox">若日期已经过去，确认停止新增交易</label></template>
          <UiInput v-model="form.reason" name="productReason" label="开通／续费／调整原因" maxlength="255" />
          <UiButton type="submit" :loading="saving">保存产品授权</UiButton>
        </fieldset>
      </form>
      <div v-if="current?.application" class="space-y-3 rounded-lg border border-slate-200 p-4">
        <h3 class="text-sm font-semibold">独立小程序应用</h3>
        <p class="break-all text-xs leading-6 text-slate-600">应用 #{{ current.application.id }} · {{ current.application.applicationKey }}<br>状态：{{ current.application.status === 'ACTIVE' ? '启用' : '暂停' }}</p>
        <UiButton variant="secondary" :disabled="saving || uncertain" @click="wechat = { ...current.application, productName: current.name || (current.productType === 'MALL' ? '商城' : '点餐') }">配置此应用微信账号</UiButton>
        <UiInput v-model="applicationReason" name="applicationReason" label="应用停启原因" :disabled="saving || uncertain" maxlength="255" />
        <UiButton variant="secondary" :disabled="saving || uncertain" @click="toggleApplication">{{ current.application.status === 'ACTIVE' ? '暂停应用' : '启用应用' }}</UiButton>
        <p class="text-xs leading-5 text-slate-500">保存配置不代表已通过微信审核、真实收款或退款验收。每个应用单独完成发布与交付。</p>
      </div>
      <p v-else-if="current" class="rounded bg-slate-50 p-3 text-sm text-slate-600">此产品尚无应用，开通后重新加载查看。</p>
    </div>
  </UiModal>
  <MerchantWechatModal :open="!!wechat" :store-id="merchant?.id ?? ''" :store-name="merchant?.name || ''" :application-id="wechat?.id || ''" :product-name="wechat?.productName || ''" @close="wechat = null" />
</template>
