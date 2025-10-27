<template>
  <div class="min-h-screen bg-dark-bg">
    <LoginForm v-if="!authStore.isAuthenticated" />
    <div v-else class="flex flex-col h-screen">
      <header class="px-6 py-4 flex items-center justify-between bg-dark-bg border-b border-dark-border">
        <h1 class="text-2xl font-semibold text-white">SupaBucket Explorer</h1>
        <button
          @click="handleLogout"
          class="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-opacity"
        >
          Logout
        </button>
      </header>

      <div class="flex-1 flex flex-col overflow-hidden">
        <!-- Download Destination -->
        <div class="px-6 py-3 bg-dark-bg border-b border-dark-border">
          <DownloadDestination v-model="downloadPath" />
        </div>

        <!-- Main Explorer -->
        <div class="flex-1 overflow-auto p-6">
          <BucketExplorer 
            v-model="selectedFiles"
            v-model:availableFiles="availableFiles"
          />
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 bg-dark-bg border-t border-dark-border">
          <TransferButton 
            :selected-files="selectedFiles"
            :download-path="downloadPath"
            :available-files="availableFiles"
            @update:selectedFiles="selectedFiles = $event"
            @transfer-complete="handleTransferComplete"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from './stores/auth';
import LoginForm from './components/LoginForm.vue';
import DownloadDestination from './components/DownloadDestination.vue';
import BucketExplorer from './components/BucketExplorer.vue';
import TransferButton from './components/TransferButton.vue';
import type { SelectedFile } from './types/supabase';

const authStore = useAuthStore();
const downloadPath = ref<string | null>(null);
const selectedFiles = ref<SelectedFile[]>([]);
const availableFiles = ref<SelectedFile[]>([]);

onMounted(async () => {
  await authStore.restoreSession();
});

const handleTransferComplete = () => {
  // Reset selections after transfer
  selectedFiles.value = [];
};

const handleLogout = () => {
  authStore.logout();
  downloadPath.value = null;
  selectedFiles.value = [];
};

</script>

