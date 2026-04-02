<script setup>
import UiButton from '@/components/UiButton.vue'
import { formatDateTime } from '@/utils/format'

defineProps({
  loading: { type: Boolean, default: false },
  rows: { type: Array, default: () => [] },
})

const emit = defineEmits(['edit', 'toggle'])
</script>

<template>
  <div class="overflow-x-auto rounded-md border border-zinc-200">
    <table class="min-w-full text-left text-sm">
      <thead class="bg-zinc-50 text-xs text-zinc-600">
        <tr>
          <th class="px-4 py-3">ID</th>
          <th class="px-4 py-3">商家名称</th>
          <th class="px-4 py-3">联系人</th>
          <th class="px-4 py-3">联系人手机号</th>
          <th class="px-4 py-3">状态</th>
          <th class="px-4 py-3">创建时间</th>
          <th class="px-4 py-3">更新时间</th>
          <th class="px-4 py-3">操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading">
          <td class="px-4 py-4" colspan="8">
            <div class="h-4 w-full animate-pulse rounded bg-zinc-100" />
          </td>
        </tr>
        <tr v-else-if="rows.length === 0">
          <td class="px-4 py-10 text-center text-sm text-zinc-500" colspan="8">
            暂无数据
          </td>
        </tr>
        <tr
          v-else
          v-for="row in rows"
          :key="row.id"
          class="border-t border-zinc-200"
        >
          <td class="px-4 py-3 text-zinc-700">{{ row.id }}</td>
          <td class="px-4 py-3 font-medium text-zinc-900">{{ row.name }}</td>
          <td class="px-4 py-3 text-zinc-700">{{ row.contactName }}</td>
          <td class="px-4 py-3 text-zinc-700">{{ row.contactPhone }}</td>
          <td class="px-4 py-3">
            <span
              class="inline-flex items-center rounded-full px-2 py-0.5 text-xs"
              :class="
                row.isActive
                  ? 'bg-green-50 text-green-700'
                  : 'bg-zinc-100 text-zinc-600'
              "
            >
              {{ row.isActive ? '启用' : '停用' }}
            </span>
          </td>
          <td class="px-4 py-3 text-zinc-700">{{ formatDateTime(row.createdAt) }}</td>
          <td class="px-4 py-3 text-zinc-700">{{ formatDateTime(row.updatedAt) }}</td>
          <td class="px-4 py-3">
            <div class="flex items-center gap-2">
              <UiButton
                variant="secondary"
                class="px-3 py-1"
                @click="emit('edit', row.id)"
              >
                编辑
              </UiButton>
              <UiButton
                :variant="row.isActive ? 'danger' : 'primary'"
                class="px-3 py-1"
                @click="emit('toggle', row)"
              >
                {{ row.isActive ? '停用' : '启用' }}
              </UiButton>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

