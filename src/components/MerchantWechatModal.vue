<script setup>
import { onBeforeUnmount, reactive, ref, watch } from 'vue'
import { getMerchantWechat, saveMerchantWechat } from '@/api/merchant'
import { editableWechatConfig, emptyWechatForm, secretFields, wechatPayload } from '@/utils/wechat-config'
import UiModal from '@/components/UiModal.vue'
import UiInput from '@/components/UiInput.vue'
import UiButton from '@/components/UiButton.vue'

const props = defineProps({ open: Boolean, storeId: { type: [String, Number], default: '' }, storeName: { type: String, default: '' } })
const emit = defineEmits(['close', 'saved'])
const form = reactive(emptyWechatForm())
const metadata = ref(null), loading = ref(false), saving = ref(false), error = ref(''), message = ref('')
let generation = 0, disposed = false

function wipe() { Object.assign(form, emptyWechatForm()); metadata.value = null; message.value = ''; error.value = '' }
async function load() {
  const version = ++generation, store = props.storeId
  wipe(); loading.value = true; saving.value = false
  try {
    const value = await getMerchantWechat(store)
    if (disposed || version !== generation || !props.open) return
    metadata.value = value; Object.assign(form, editableWechatConfig(value))
  } catch (e) { if (!disposed && version === generation) error.value = e?.message || '读取门店微信配置失败，请重新加载' }
  finally { if (!disposed && version === generation) loading.value = false }
}
async function save() {
  if (loading.value || saving.value || !metadata.value || !metadata.value.dataKeyReady) return
  const version = generation, store = props.storeId, body = wechatPayload(form, metadata.value.version)
  saving.value = true; error.value = ''; message.value = ''
  try {
    const value = await saveMerchantWechat(store, body)
    if (disposed || version !== generation || !props.open) return
    metadata.value = value; Object.assign(form, editableWechatConfig(value))
    message.value = '此门店配置已保存，秘钥输入已清空。请完成微信授权和真实支付验收。'
    emit('saved', store)
  } catch (e) { if (!disposed && version === generation) error.value = e?.message || '保存结果尚未确认，请重新加载核对后再提交' }
  finally {
    for (const field of secretFields) body[field] = ''
    if (!disposed && version === generation) saving.value = false
  }
}
function close() { if (!saving.value) { generation++; wipe(); emit('close') } }
watch(() => [props.open, props.storeId], () => {
  if (props.open && props.storeId) load()
  else { generation++; wipe(); loading.value = false; saving.value = false }
}, { immediate: true })
onBeforeUnmount(() => { disposed = true; generation++; wipe() })
</script>

<template>
  <UiModal :open="open" :title="`${storeName || '门店'} · 微信配置`" @close="close">
    <div class="max-h-[72vh] space-y-4 overflow-y-auto pr-1">
      <p class="text-sm text-slate-600">门店 #{{ storeId }} 独立使用以下小程序和收款账号。秘钥只接受新值，留空保留已保存的值。</p>
      <p v-if="loading" role="status">正在读取此门店配置…</p>
      <p v-if="error" role="alert" class="rounded bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>
      <p v-if="message" role="status" class="rounded bg-green-50 p-3 text-sm text-green-700">{{ message }}</p>
      <template v-if="metadata && !loading">
        <p v-if="!metadata.dataKeyReady" class="rounded bg-amber-50 p-3 text-sm text-amber-800">服务器尚未配置凭据加密密钥，请完成服务器配置后保存。</p>
        <div class="rounded bg-slate-50 p-3 text-sm text-slate-700">
          小程序：{{ metadata.loginReady ? '本地配置完整' : '配置待补齐或未启用' }} · 收款：{{ metadata.paymentReady ? '本地配置完整' : '配置待补齐或未启用' }}
          <p v-if="!metadata.paymentRuntimeEnabled" class="mt-1">服务器当前未启用真实支付。</p>
          <p class="mt-1">以上状态不代表微信授权、接口权限或真实交易已经验收。</p>
        </div>
        <fieldset :disabled="saving" class="space-y-4">
          <label class="flex items-center gap-2 text-sm"><input v-model="form.enabled" type="checkbox" name="enabled">启用此门店小程序</label>
          <UiInput v-model="form.appId" name="appId" label="小程序 AppID" placeholder="wx…" :disabled="saving" />
          <UiInput v-model="form.appSecret" name="appSecret" label="小程序 AppSecret" type="password" autocomplete="new-password" :placeholder="metadata.hasAppSecret ? '已保存，留空保留' : '填写此小程序的秘钥'" :disabled="saving" />
          <label class="flex items-center gap-2 text-sm"><input v-model="form.paymentEnabled" type="checkbox" name="paymentEnabled">启用此门店微信收款</label>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <UiInput v-model="form.merchantId" name="merchantId" label="微信支付商户号" :disabled="saving" />
            <UiInput v-model="form.merchantSerialNumber" name="merchantSerialNumber" label="商户 API 证书序列号" :disabled="saving" />
          </div>
          <UiInput v-model="form.apiV3Key" name="apiV3Key" label="API v3 密钥" type="password" autocomplete="new-password" :placeholder="metadata.hasApiV3Key ? '已保存，留空保留' : '填写 API v3 密钥'" :disabled="saving" />
          <label class="block text-sm font-medium text-zinc-800">商户私钥（PEM）<textarea v-model="form.privateKeyPem" name="privateKeyPem" rows="3" spellcheck="false" autocomplete="off" class="mt-1 w-full rounded border border-zinc-200 p-2 font-mono text-xs" :placeholder="metadata.hasPrivateKey ? '已保存，留空保留' : '粘贴商户私钥 PEM'" /></label>
          <UiInput v-model="form.publicKeyId" name="publicKeyId" label="微信支付公钥 ID" :disabled="saving" />
          <label class="block text-sm font-medium text-zinc-800">微信支付公钥（PEM）<textarea v-model="form.publicKeyPem" name="publicKeyPem" rows="3" spellcheck="false" autocomplete="off" class="mt-1 w-full rounded border border-zinc-200 p-2 font-mono text-xs" :placeholder="metadata.hasPublicKey ? '已保存，留空保留' : '粘贴微信支付公钥 PEM'" /></label>
          <UiInput v-model="form.notifyBaseUrl" name="notifyBaseUrl" label="支付回调服务器地址" placeholder="https://你的服务域名" :disabled="saving" />
          <p class="text-xs text-slate-500">更换 AppID 或商户号时，须填写对应的新秘钥。历史交易保留原配置版本，继续使用原收款账号查询和退款。</p>
        </fieldset>
      </template>
      <div class="flex flex-wrap justify-end gap-3 border-t pt-4">
        <UiButton variant="secondary" :disabled="saving || loading" @click="load">重新加载</UiButton>
        <UiButton variant="secondary" :disabled="saving" @click="close">关闭</UiButton>
        <UiButton :loading="saving" :disabled="loading || !metadata || !metadata.dataKeyReady" @click="save">保存此门店配置</UiButton>
      </div>
    </div>
  </UiModal>
</template>
