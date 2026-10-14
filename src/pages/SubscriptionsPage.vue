<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { listTerms } from '@/api/governance'
import { serviceLabels } from '@/utils/governance'
import AppHeader from '@/components/AppHeader.vue'
import UiButton from '@/components/UiButton.vue'
import ServiceTermModal from '@/components/ServiceTermModal.vue'
const status = ref('ALL'), keyword = ref(''), page = ref(1), total = ref(0), rows = ref([]), busy = ref(false), error = ref(''), merchant = ref(null)
let generation = 0
async function load(reset = false) {
  if (reset) page.value = 1
  const version = ++generation; busy.value = true; error.value = ''
  try { const data = await listTerms({ status: status.value, keyword: keyword.value, page: page.value }); if (version === generation) { rows.value = data.list; total.value = data.total } }
  catch (e) { if (version === generation) error.value = e.message }
  finally { if (version === generation) busy.value = false }
}
function move(delta) { page.value += delta; load() }
onMounted(() => load()); onBeforeUnmount(() => { generation++ })
</script>
<template>
  <div class="min-h-screen bg-slate-50"><AppHeader /><main class="mx-auto max-w-7xl p-4 sm:p-6"><h1 class="text-2xl font-semibold">服务期限与续费提醒</h1><p class="my-3 text-sm text-slate-600">提前30天提醒。已有商户默认无期限；设置明确期限后，到期停止新增消费，历史账单仍可处理。</p><form class="my-4 flex flex-wrap gap-3" @submit.prevent="load(true)"><select v-model="status" aria-label="服务状态" class="rounded border p-2" @change="load(true)"><option value="ALL">全部门店</option><option v-for="(label, value) in serviceLabels" :key="value" :value="value">{{ label }}</option></select><input v-model="keyword" aria-label="商户名称" placeholder="搜索商户名称" class="rounded border p-2" maxlength="100"><UiButton type="submit" :loading="busy">查询</UiButton><UiButton variant="secondary" :disabled="busy" @click="load()">刷新</UiButton></form><p v-if="error" role="alert" class="mb-4 text-red-700">{{ error }}</p><div class="overflow-x-auto rounded-xl bg-white"><table class="w-full min-w-[600px] text-left text-sm"><thead><tr><th class="p-4">门店</th><th>营业账号</th><th>服务状态</th><th>到期日</th><th>提醒</th><th>操作</th></tr></thead><tbody><tr v-for="row in rows" :key="row.id" class="border-t"><td class="p-4">{{ row.name }} · #{{ row.id }}</td><td>{{ row.isActive ? '启用' : '停用' }}</td><td :class="row.status === 'EXPIRED' ? 'text-red-700' : row.status === 'EXPIRING' ? 'text-amber-700' : ''">{{ serviceLabels[row.status] }}</td><td>{{ row.expiresOn || '无期限' }}</td><td>{{ row.status === 'EXPIRED' ? '请核对续费' : row.status === 'EXPIRING' ? `剩余 ${row.daysRemaining} 天` : '—' }}</td><td><UiButton variant="secondary" @click="merchant = row">调整／续费</UiButton></td></tr><tr v-if="!rows.length"><td colspan="6" class="p-8 text-center text-slate-500">{{ busy ? '正在加载…' : error ? '列表暂不可用' : '当前筛选暂无门店' }}</td></tr></tbody></table></div><div class="mt-4 flex gap-3 text-sm"><UiButton variant="secondary" :disabled="busy || page <= 1" @click="move(-1)">上一页</UiButton><span class="self-center">第 {{ page }} 页 · 共 {{ total }} 家</span><UiButton variant="secondary" :disabled="busy || page * 20 >= total" @click="move(1)">下一页</UiButton></div></main><ServiceTermModal :merchant="merchant" @close="merchant = null" @saved="load()" /></div>
</template>
