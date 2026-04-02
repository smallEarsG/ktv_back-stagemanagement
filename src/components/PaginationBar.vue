<script setup>
import UiButton from '@/components/UiButton.vue'

defineProps({
  page: { type: Number, default: 1 },
  totalPages: { type: Number, default: 1 },
  total: { type: Number, default: 0 },
  loading: { type: Boolean, default: false },
})

const emit = defineEmits(['prev', 'next'])
</script>

<template>
  <div class="mt-4 flex items-center justify-between">
    <div class="text-sm text-zinc-600">共 {{ total }} 条</div>
    <div class="flex items-center gap-3">
      <UiButton
        variant="secondary"
        class="px-3 py-1"
        :disabled="page <= 1 || loading"
        @click="emit('prev')"
      >
        上一页
      </UiButton>
      <div class="text-sm text-zinc-700">{{ page }} / {{ totalPages }}</div>
      <UiButton
        variant="secondary"
        class="px-3 py-1"
        :disabled="page >= totalPages || loading"
        @click="emit('next')"
      >
        下一页
      </UiButton>
    </div>
  </div>
</template>

