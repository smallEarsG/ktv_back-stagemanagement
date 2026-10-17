<script setup>
import { computed, onMounted, onBeforeUnmount, reactive, ref } from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import UiButton from '@/components/UiButton.vue'
import UiModal from '@/components/UiModal.vue'
import { getOperationsSummary, listIncidents, acknowledgeIncident } from '@/api/operations'

const summary = ref(null), rows = ref([]), total = ref(0), loading = ref(false), error = ref(''), detail = ref(null)
const filters = reactive({ storeId: '', severity: '', kind: '', hours: 24, unresolved: false, page: 1 })
const autoRefresh = ref(true), processing = ref('')
let revision = 0, stopped = false, timer
const states = { OK: '正常', FAILED: '失败', STALE: '记录已过期', MISSING: '尚无记录', INVALID: '记录不可读', NOT_CONFIGURED: '尚未配置' }
const sources = { MALL: '商城', SERVER: '服务端', MERCHANT: '商户后台', PLATFORM: '超级管理平台', MINI: '小程序', BACKGROUND: '后台任务', CHANNEL: '支付／团购渠道' }
const kinds = { BIRTHDAY_JOB: '商城生日活动异常', ALERT_JOB: '告警任务异常', HTTP_SERVER: '接口异常', BUSINESS_FAILURE: '接口返回失败', SLOW_API: '接口响应慢', CLIENT_NETWORK: '网络请求失败', CLIENT_RUNTIME: '页面运行异常', CLIENT_UNHANDLED: '未处理的页面异常', BACKGROUND_ERROR: '后台任务异常', CHANNEL_UNCERTAIN: '渠道结果待确认', PAYMENT_QUERY_FAILED: '收款查询失败', REFUND_QUERY_FAILED: '退款查询失败', RECHARGE_QUERY_FAILED: '充值查询失败' }
const notices = computed(() => {
  const s = summary.value
  if (!s) return []
  const text = []
  if (!s.databaseReady) text.push('数据库或监控表不可用，请立即检查服务器。')
  if (!s.storageReady || s.dropped) text.push(`异常采集积压或丢弃：等待 ${s.queued || 0} 条，丢弃 ${s.dropped || 0} 条。`)
  if (s.heartbeat?.state !== 'OK') text.push(`服务器巡检：${states[s.heartbeat?.state] || '未知'}。`)
  if (s.backup?.state !== 'OK') text.push(`自动备份：${states[s.backup?.state] || '未知'}。`)
  return text
})
const pages = computed(() => Math.max(1, Math.ceil(total.value / 20)))
const time = value => value ? new Date(value).toLocaleString('zh-CN', { hour12: false }) : '暂无记录'
const size = value => Number.isFinite(Number(value)) ? `${(Number(value) / 1024 / 1024 / 1024).toFixed(1)} GB` : '—'
async function load() {
  const current = ++revision
  loading.value = true; error.value = ''
  const params = { ...filters, storeId: filters.storeId === '' ? undefined : Number(filters.storeId) }
  const [health, list] = await Promise.allSettled([getOperationsSummary(), listIncidents(params)])
  if (stopped || current !== revision) return
  if (health.status === 'fulfilled') summary.value = health.value
  if (list.status === 'fulfilled') { rows.value = list.value?.list || []; total.value = list.value?.total || 0 }
  const failures = [health, list].filter(r => r.status === 'rejected')
  if (failures.length) error.value = failures.map(r => r.reason?.message || '加载失败，请重试').join('；')
  loading.value = false
}
function search() { filters.page = 1; load() }
function turn(page) { filters.page = page; load() }
async function acknowledge(row) {
  if (processing.value) return
  processing.value = row.id
  try { await acknowledgeIncident(row); detail.value = null; await load() }
  catch (e) { error.value = e?.message || '处理失败，请刷新后重试' }
  finally { processing.value = '' }
}
onMounted(() => { load(); timer = setInterval(() => { if (autoRefresh.value && !loading.value && !processing.value && !document.hidden) load() }, 30000) })
onBeforeUnmount(() => { stopped = true; revision++; clearInterval(timer) })
</script>

<template>
  <div class="min-h-screen bg-[#F5F7FA]">
    <AppHeader />
    <main class="mx-auto max-w-[1440px] px-4 py-6 sm:px-6">
      <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div><h1 class="text-2xl font-semibold text-slate-900">运行保障</h1><p class="mt-2 text-sm text-slate-500">集中查看各门店异常、服务器巡检、自动备份和验收记录。</p></div>
        <div class="flex items-center gap-3"><label class="text-sm"><input v-model="autoRefresh" type="checkbox" class="mr-1" />自动刷新</label><UiButton :disabled="loading" @click="load">{{ loading ? '刷新中' : '刷新' }}</UiButton></div>
      </div>
      <p v-if="error" role="alert" class="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>
      <div v-if="notices.length" role="alert" class="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><p v-for="notice in notices" :key="notice">{{ notice }}</p></div>
      <div class="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <section v-for="card in [{ label: '近24小时异常次数', value: summary?.errorCount }, { label: '待处理异常组', value: summary?.unresolvedCount }, { label: '接口响应慢次数', value: summary?.slowCount }, { label: '数据库', value: summary ? summary.databaseReady ? '正常' : '异常' : undefined }]" :key="card.label" class="rounded-lg bg-white p-4 shadow-sm"><p class="text-sm text-slate-500">{{ card.label }}</p><strong class="mt-2 block text-2xl">{{ card.value ?? '—' }}</strong></section>
      </div>
      <div class="mb-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <section class="rounded-lg bg-white p-4 shadow-sm"><h2 class="font-semibold">服务器巡检</h2><p class="my-2">{{ states[summary?.heartbeat?.state] || '加载中' }}</p><p class="text-sm text-slate-500">{{ time(summary?.heartbeat?.checkedAt) }}</p><p class="mt-2 text-sm">磁盘可用 {{ size(summary?.heartbeat?.diskFreeBytes) }}</p></section>
        <section class="rounded-lg bg-white p-4 shadow-sm"><h2 class="font-semibold">每日自动备份</h2><p class="my-2">{{ states[summary?.backup?.state] || '加载中' }}</p><p class="text-sm text-slate-500">{{ time(summary?.backup?.checkedAt) }}</p><p class="mt-2 text-sm">{{ summary?.backup?.encrypted ? '已加密' : '待验证加密' }} · 保留 {{ summary?.backup?.backupCount ?? '—' }} 份</p><p class="mt-1 text-xs text-slate-500">图片归档：{{ summary?.backup?.mediaIncluded ? `已包含 ${summary.backup.mediaFiles || 0} 张` : '待验收' }}</p><p v-if="!summary?.backup?.offsiteVerified" class="mt-1 text-xs text-amber-700">异地备份尚未验收</p></section>
        <section class="rounded-lg bg-white p-4 shadow-sm"><h2 class="font-semibold">恢复演练</h2><p class="my-2">{{ states[summary?.restore?.state] || '加载中' }}</p><p class="text-sm text-slate-500">{{ time(summary?.restore?.checkedAt) }}</p><p class="mt-2 text-sm">{{ summary?.restore?.restoredTables ?? '—' }} 张表 · {{ summary?.restore?.rowsVerified ?? '—' }} 行已核对</p><p class="mt-1 text-xs text-slate-500">在隔离临时库恢复，不覆盖营业库</p><p class="mt-1 text-xs text-slate-500">图片校验：{{ summary?.restore?.mediaVerified ? `已通过 ${summary.restore.mediaFiles || 0} 张` : '待验收' }}</p></section>
        <section class="rounded-lg bg-white p-4 shadow-sm"><h2 class="font-semibold">多店压力验收</h2><p class="my-2">{{ states[summary?.loadTest?.state] || '加载中' }}</p><p class="text-sm text-slate-500">{{ time(summary?.loadTest?.checkedAt) }}</p><p class="mt-2 text-sm">{{ summary?.loadTest?.concurrency ?? '—' }} 并发 · {{ summary?.loadTest?.requests ?? '—' }} 次请求</p><p class="mt-1 text-xs text-slate-500">测试库只读结果，不能代表生产营业峰值</p></section>
      </div>
      <section class="rounded-lg bg-white p-4 shadow-sm sm:p-5">
        <h2 class="mb-4 text-lg font-semibold">异常与慢接口</h2>
        <form class="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6" @submit.prevent="search">
          <label class="text-sm">门店编号<input v-model="filters.storeId" type="number" min="-1" placeholder="全部门店" class="mt-1 block w-full rounded border px-3 py-2" /></label>
          <label class="text-sm">等级<select v-model="filters.severity" class="mt-1 block w-full rounded border px-3 py-2"><option value="">全部</option><option value="ERROR">异常</option><option value="WARN">提醒</option><option value="INFO">登录与权限</option></select></label>
          <label class="text-sm">类型<select v-model="filters.kind" class="mt-1 block w-full rounded border px-3 py-2"><option value="">全部</option><option v-for="(label, kind) in kinds" :key="kind" :value="kind">{{ label }}</option></select></label>
          <label class="text-sm">时间<select v-model="filters.hours" class="mt-1 block w-full rounded border px-3 py-2"><option :value="24">近24小时</option><option :value="72">近3天</option><option :value="336">近14天</option></select></label>
          <label class="flex items-center gap-2 text-sm"><input v-model="filters.unresolved" type="checkbox" />只看待处理</label>
          <UiButton class="self-end" type="submit" :disabled="loading">查询</UiButton>
        </form>
        <p class="mb-3 text-xs text-slate-500">相同接口异常按小时归组。标记已处理后再次发生会重新提醒；监控记录保留14天。登录、参数与权限失败不会被当成服务器故障。</p>
        <div class="overflow-x-auto"><table class="w-full min-w-[750px] text-left text-sm"><thead class="bg-slate-50 text-slate-500"><tr><th class="p-3">时间 / 次数</th><th class="p-3">门店</th><th class="p-3">来源 / 类型</th><th class="p-3">接口</th><th class="p-3">结果</th><th class="p-3">处理</th></tr></thead><tbody><tr v-for="row in rows" :key="row.id" class="border-b"><td class="p-3">{{ time(row.lastSeen) }}<small class="block text-slate-500">{{ row.occurrences }} 次</small></td><td class="p-3">{{ row.storeName || (row.storeId === 0 ? '平台' : row.storeId < 0 ? '未确认门店' : `门店 ${row.storeId}`) }}</td><td class="p-3">{{ sources[row.source] || row.source }}<small class="block">{{ kinds[row.kind] || row.kind }}</small></td><td class="max-w-xs break-all p-3">{{ row.method }} {{ row.route }}</td><td class="p-3">{{ row.httpStatus || '—' }} / {{ row.businessCode || '—' }}<small class="block">{{ row.durationMs }} ms</small></td><td class="p-3"><button class="text-blue-600" @click="detail = row">查看详情</button><span v-if="row.acknowledgedAt" class="ml-2 text-slate-500">已处理</span><button v-else class="ml-2 text-blue-600" :disabled="!!processing" @click="acknowledge(row)">标记已处理</button></td></tr></tbody></table></div>
        <p v-if="!rows.length" class="p-8 text-center text-slate-500">{{ loading ? '加载中…' : error ? '暂时无法确认异常记录，请刷新重试' : '所选范围暂无异常记录' }}</p>
        <div class="mt-4 flex items-center justify-between gap-2 text-sm"><span>共 {{ total }} 组 · 第 {{ filters.page }} / {{ pages }} 页</span><div class="flex gap-2"><UiButton variant="secondary" :disabled="loading || filters.page <= 1" @click="turn(filters.page - 1)">上一页</UiButton><UiButton variant="secondary" :disabled="loading || filters.page >= pages" @click="turn(filters.page + 1)">下一页</UiButton></div></div>
      </section>
      <p class="mt-4 text-xs text-slate-500">当前异常在本平台展示；站外告警、异地备份和发布预演请到“接入与发布”配置。真实外部发送和异地上传尚未启用。</p>
    </main>
    <UiModal :open="!!detail" title="异常详情" @close="detail = null">
      <div v-if="detail" class="space-y-3 break-all text-sm"><p>{{ sources[detail.source] }} · {{ kinds[detail.kind] }}</p><p>{{ detail.method }} {{ detail.route }}</p><p>首次：{{ time(detail.firstSeen) }}<br />最近：{{ time(detail.lastSeen) }}<br />累计：{{ detail.occurrences }} 次</p><p>最近追踪号：{{ detail.requestId || '此类错误无服务端追踪号' }}</p><p v-if="detail.errorType">异常类型：{{ detail.errorType }}</p><pre v-if="detail.frames" class="max-h-60 overflow-auto whitespace-pre-wrap rounded bg-slate-50 p-3">{{ detail.frames }}</pre><p class="text-slate-500">采集记录不包含密码、密钥、请求正文或原始异常消息。网络失败可能发生在请求送达服务器之前。</p><UiButton v-if="!detail.acknowledgedAt" :disabled="!!processing" @click="acknowledge(detail)">标记已处理</UiButton></div>
    </UiModal>
  </div>
</template>
