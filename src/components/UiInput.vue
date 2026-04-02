<script setup>
const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  label: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  type: { type: String, default: 'text' },
  name: { type: String, default: '' },
  error: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <label class="block">
    <div v-if="label" class="mb-1 text-sm font-medium text-zinc-800">
      {{ label }}
    </div>
    <input
      :name="name"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      class="w-full rounded-md border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-blue-600/30 disabled:bg-zinc-50"
      :class="
        error
          ? 'border-red-500 focus:border-red-500 focus:ring-red-600/20'
          : 'border-zinc-200 focus:border-blue-600'
      "
      @input="emit('update:modelValue', $event.target.value)"
    />
    <div v-if="error" class="mt-1 text-xs text-red-600">{{ error }}</div>
  </label>
</template>

