<template>
  <div class="flex items-center gap-4">
    <label class="text-sm font-medium text-white">Download Destination:</label>
    <input
      v-model="path"
      type="text"
      readonly
      class="flex-1 px-3 py-2 border rounded-md text-sm text-white placeholder-gray-400 bg-dark-card border-dark-border"
      placeholder="No folder selected"
    />
    <button
      @click="selectFolder"
      class="px-4 py-2 text-sm font-medium text-white rounded-md bg-primary hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-opacity"
    >
      Browse
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{
  modelValue: string | null;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string | null];
}>();

const path = ref<string | null>(props.modelValue);

watch(() => props.modelValue, (newValue) => {
  path.value = newValue;
});

watch(path, (newValue) => {
  emit('update:modelValue', newValue);
});

const selectFolder = async () => {
  const { ipcRenderer } = require('electron');
  const result = await ipcRenderer.invoke('select-folder');
  if (result) {
    path.value = result;
  }
};
</script>

