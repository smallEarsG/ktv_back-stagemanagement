<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { listAudit } from '@/api/governance'
import { actionLabels, auditSnapshot } from '@/utils/governance'
import AppHeader from '@/components/AppHeader.vue'
import UiButton from '@/components/UiButton.vue'
const storeId = ref(''), action = ref(''), from = ref(''), to = ref(''), page = ref(1), rows = ref([]), total = ref(0), busy = ref(false), error = ref('')
let generation = 0
async function load(reset = false) {
  if (reset) page.value = 1
  const version = ++generation; busy.value = true; error.value = ''
  try { const result = await listAudit({ storeId: storeId.value === '' ? undefined : storeId.value, action: action.value || undefined, page: page.value, from: from.value || undefined, to: to.value || undefined }); if (version === generation) { rows.value = result.list; total.value = result.total } }
  catch (e) { if (version === generation) error.value = e.message }
  finally { if (version === generation) busy.value = false }
}
function move(delta) { page.value += delta; load() }
onMounted(() => load()); onBeforeUnmount(() => { generation++ })
</script>
<template>
  <div class="min-h-screen bg-slate-50"><AppHeader /><main class="mx-auto max-w-7xl p-4 sm:p-6"><h1 class="text-2xl font-semibold">操作记录</h1><p class="my-3 text-sm text-slate-600">记录商户停启、员工权限、改密重置和服务期限调整。默认显示近30天，可查询最多366天；记录不包含密码或秘钥。</p><form class="my-4 flex flex-wrap gap-3" @submit.prevent="load(true)"><input v-model="storeId" type="number" min="0" aria-label="门店编号" placeholder="全部门店" class="w-32 rounded border p-2"><select v-model="action" aria-label="操作类型" class="rounded border p-2"><option value="">全部操作</option><option v-for="(label, value) in actionLabels" :key="value" :value="value">{{ label }}</option></select><label class="text-sm">开始日期<input v-model="from" type="date" class="ml-2 rounded border p-2"></label><label class="text-sm">结束日期<input v-model="to" type="date" class="ml-2 rounded border p-2"></label><UiButton type="submit" :loading="busy">查询</UiButton><UiButton variant="secondary" :disabled="busy" @click="load()">刷新</UiButton></form><p v-if="error" role="alert" class="mb-4 text-red-700">{{ error }}</p><div class="overflow-x-auto rounded-xl bg-white"><table class="w-full min-w-[780px] text-left text-sm"><thead><tr><th class="p-4">时间／操作人</th><th>门店／目标</th><th>操作</th><th>变更内容</th><th>原因</th></tr></thead><tbody><tr v-for="row in rows" :key="row.id" class="border-t align-top"><td class="p-4">{{ row.createdAt?.replace('T', ' ') }}<p>{{ row.actorName }} · #{{ row.actorId }}</p></td><td class="p-4">{{ row.storeName || '门店' }} #{{ row.storeId }}<p>{{ row.targetType }} #{{ row.targetId }}</p></td><td class="p-4">{{ actionLabels[row.action] || row.action }}</td><td class="max-w-sm break-all p-4"><details><summary class="cursor-pointer text-blue-700">查看变更前后</summary><p class="mt-2">变更前：{{ auditSnapshot(row.before) }}</p><p class="mt-2">变更后：{{ auditSnapshot(row.after) }}</p></details></td><td class="max-w-xs break-all p-4">{{ row.reason }}</td></tr><tr v-if="!rows.length"><td colspan="5" class="p-8 text-center text-slate-500">{{ busy ? '正在加载…' : error ? '记录暂不可用' : '所选范围暂无操作记录' }}</td></tr></tbody></table></div><div class="mt-4 flex gap-3 text-sm"><UiButton variant="secondary" :disabled="busy || page <= 1" @click="move(-1)">上一页</UiButton><span class="self-center">第 {{ page }} 页 · 共 {{ total }} 条</span><UiButton variant="secondary" :disabled="busy || page * 20 >= total" @click="move(1)">下一页</UiButton></div></main></div>
</template>
