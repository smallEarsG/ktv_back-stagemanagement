<script setup>
defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: '' },
})

const emit = defineEmits(['close'])

function onBackdrop(e) {
  if (e.target === e.currentTarget) emit('close')
}
</script>

<template>
  <teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      @click="onBackdrop"
    >
      <div class="w-full max-w-xl rounded-lg bg-white shadow-xl">
        <div class="flex items-center justify-between border-b px-5 py-4">
          <div class="text-base font-semibold text-zinc-900">{{ title }}</div>
          <button
            class="rounded-md px-2 py-1 text-sm text-zinc-600 hover:bg-zinc-100"
            @click="emit('close')"
          >
            关闭
          </button>
        </div>
        <div class="px-5 py-4">
          <slot />
        </div>
      </div>
    </div>
  </teleport>
</template>

