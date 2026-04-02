<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import {
  createMerchant,
  disableMerchant,
  enableMerchant,
  getMerchantDetail,
  listMerchants,
  updateMerchant,
} from '@/api/merchant'
import AppHeader from '@/components/AppHeader.vue'
import MerchantFormModal from '@/components/MerchantFormModal.vue'
import MerchantTable from '@/components/MerchantTable.vue'
import PaginationBar from '@/components/PaginationBar.vue'
import UiButton from '@/components/UiButton.vue'
import UiInput from '@/components/UiInput.vue'

const filters = reactive({
  keyword: '',
  contactPhone: '',
})

const page = ref(1)
const pageSize = ref(20)

const loading = ref(false)
const loadError = ref('')
const total = ref(0)
const rows = ref([])

const modalOpen = ref(false)
const modalMode = ref('create')
const modalSubmitting = ref(false)
const modalError = ref('')
const editingId = ref(null)
const modalInitial = ref({})
const modalLoadingDetail = ref(false)

const totalPages = computed(() => {
  const t = Number(total.value) || 0
  const ps = Number(pageSize.value) || 1
  return Math.max(1, Math.ceil(t / ps))
})

async function fetchList() {
  loading.value = true
  loadError.value = ''
  try {
    const data = await listMerchants({
      keyword: filters.keyword || undefined,
      contactPhone: filters.contactPhone || undefined,
      page: page.value,
      pageSize: pageSize.value,
    })
    total.value = data?.total || 0
    rows.value = Array.isArray(data?.list) ? data.list : []
  } catch (e) {
    loadError.value = e?.message || '加载失败'
  } finally {
    loading.value = false
  }
}

function onSearch() {
  page.value = 1
  fetchList()
}

function onReset() {
  filters.keyword = ''
  filters.contactPhone = ''
  page.value = 1
  fetchList()
}

function openCreate() {
  modalMode.value = 'create'
  editingId.value = null
  modalInitial.value = {}
  modalError.value = ''
  modalOpen.value = true
}

async function openEdit(id) {
  modalMode.value = 'edit'
  editingId.value = id
  modalInitial.value = {}
  modalError.value = ''
  modalOpen.value = true

  modalLoadingDetail.value = true
  try {
    const detail = await getMerchantDetail(id)
    modalInitial.value = detail || {}
  } catch (e) {
    modalError.value = e?.message || '加载详情失败'
  } finally {
    modalLoadingDetail.value = false
  }
}

function closeModal() {
  if (modalSubmitting.value) return
  modalOpen.value = false
}

async function submitModal(payload) {
  modalSubmitting.value = true
  modalError.value = ''
  try {
    if (modalMode.value === 'edit') {
      await updateMerchant(editingId.value, payload)
    } else {
      await createMerchant(payload)
    }
    modalOpen.value = false
    await fetchList()
  } catch (e) {
    modalError.value = e?.message || '保存失败'
  } finally {
    modalSubmitting.value = false
  }
}

async function toggleActive(row) {
  const id = row?.id
  if (!id) return

  if (row.isActive) {
    const ok = window.confirm('确认要停用该商家吗？')
    if (!ok) return
    try {
      await disableMerchant(id)
      await fetchList()
    } catch (e) {
      window.alert(e?.message || '操作失败')
    }
    return
  }

  const ok = window.confirm('确认要启用该商家吗？')
  if (!ok) return
  try {
    await enableMerchant(id)
    await fetchList()
  } catch (e) {
    window.alert(e?.message || '操作失败')
  }
}

function goPrev() {
  if (page.value <= 1) return
  page.value -= 1
  fetchList()
}

function goNext() {
  if (page.value >= totalPages.value) return
  page.value += 1
  fetchList()
}

onMounted(() => {
  fetchList()
})
</script>

<template>
  <div class="min-h-screen bg-[#F5F7FA]">
    <AppHeader />
    <main class="mx-auto max-w-[1440px] px-6 py-6">
      <div class="mb-4 rounded-lg bg-white p-5 shadow">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
          <UiInput v-model="filters.keyword" label="关键词" placeholder="商家名称" />
          <UiInput
            v-model="filters.contactPhone"
            label="联系人手机号"
            placeholder="手机号"
          />
          <div class="flex items-end gap-3">
            <UiButton @click="onSearch">查询</UiButton>
            <UiButton variant="secondary" @click="onReset">重置</UiButton>
          </div>
        </div>
      </div>

      <div class="rounded-lg bg-white p-5 shadow">
        <div class="mb-4 flex items-center justify-between">
          <div class="text-sm font-semibold text-zinc-900">商家列表</div>
          <div class="flex items-center gap-3">
            <UiButton variant="secondary" :disabled="loading" @click="fetchList">
              刷新
            </UiButton>
            <UiButton @click="openCreate">新增商家</UiButton>
          </div>
        </div>

        <div v-if="loadError" class="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {{ loadError }}
        </div>

        <MerchantTable :loading="loading" :rows="rows" @edit="openEdit" @toggle="toggleActive" />

        <PaginationBar
          :page="page"
          :total-pages="totalPages"
          :total="total"
          :loading="loading"
          @prev="goPrev"
          @next="goNext"
        />
      </div>
    </main>

    <MerchantFormModal
      :open="modalOpen"
      :mode="modalMode"
      :initial-value="modalInitial"
      :submitting="modalSubmitting"
      :error-message="modalLoadingDetail ? '加载中...' : modalError"
      @close="closeModal"
      @submit="submitModal"
    />
  </div>
</template>

