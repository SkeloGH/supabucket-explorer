<template>
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-4">
      <div class="text-sm text-gray-400">
        <span v-if="selectedFiles.length > 0">
          {{ selectedFiles.length }} {{ selectedFiles.length === 1 ? 'item' : 'items' }} selected
        </span>
        <span v-else>No items selected</span>
      </div>
      
      <button
        v-if="availableFiles.length > 0"
        @click="toggleSelectAll"
        class="px-3 py-1 text-xs font-medium text-white rounded-md bg-dark-card border border-dark-border hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-opacity"
      >
        {{ allSelected ? 'Deselect All' : 'Select All' }}
      </button>
    </div>
    
    <div class="flex gap-3">
      <button
        @click="startTransfer"
        :disabled="!canTransfer || transferring"
        :title="!canTransfer ? disabledReason : undefined"
        class="px-6 py-2 text-sm font-medium text-white rounded-md bg-primary hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
      >
        {{ transferring ? `Downloading... (${transferredCount}/${totalFiles})` : 'Download' }}
      </button>
      
      <button
        v-if="transferring"
        @click="cancelDownload"
        class="px-4 py-2 text-sm font-medium text-white rounded-md bg-red-600 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-opacity"
      >
        Cancel
      </button>
    </div>
  </div>
  
  <!-- Progress -->
  <div v-if="transferring" class="mt-2">
    <div class="w-full rounded-full h-2 bg-dark-card">
      <div
        class="h-2 rounded-full transition-all duration-300 bg-primary"
        :style="{ width: `${(transferredCount / totalFiles) * 100}%` }"
      ></div>
    </div>
    <p v-if="currentFile" class="text-xs text-gray-400 mt-1">Downloading: {{ currentFile }}</p>
  </div>
  
  <!-- Summary -->
  <div v-if="transferComplete" class="mt-2 text-sm">
    <p class="text-primary">Transfer complete!</p>
    <p class="text-gray-400">Success: {{ successCount }}, Failed: {{ failedCount }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAuthStore } from '../stores/auth';
import type { SelectedFile } from '../types/supabase';

const props = defineProps<{
  selectedFiles: SelectedFile[];
  downloadPath: string | null;
  availableFiles: SelectedFile[];
}>();

const emit = defineEmits<{
  'transfer-complete': [];
  'update:selectedFiles': [files: SelectedFile[]];
}>();

const authStore = useAuthStore();
const transferring = ref(false);
const transferredCount = ref(0);
const totalFiles = ref(0);
const currentFile = ref('');
const successCount = ref(0);
const failedCount = ref(0);
const transferComplete = ref(false);
const cancelled = ref(false);

const canTransfer = computed(() => {
  return props.selectedFiles.length > 0 && props.downloadPath !== null && !transferring.value;
});

const disabledReason = computed(() => {
  if (props.selectedFiles.length === 0) {
    return 'Select files to download';
  }
  if (props.downloadPath === null) {
    return 'Select a download destination folder';
  }
  return '';
});

const allSelected = computed(() => {
  if (props.availableFiles.length === 0) return false;
  return props.availableFiles.every(file => 
    props.selectedFiles.some(f => f.bucket === file.bucket && f.path === file.path)
  );
});

const toggleSelectAll = () => {
  if (allSelected.value) {
    // Deselect all current files
    const currentFilePaths = props.availableFiles.map(f => `${f.bucket}:${f.path}`);
    emit('update:selectedFiles', props.selectedFiles.filter(f => 
      !currentFilePaths.includes(`${f.bucket}:${f.path}`)
    ));
  } else {
    // Select all current files
    const newFiles = props.availableFiles.filter(file => 
      !props.selectedFiles.some(f => f.bucket === file.bucket && f.path === file.path)
    );
    emit('update:selectedFiles', [...props.selectedFiles, ...newFiles]);
  }
};

const startTransfer = async () => {
  if (!authStore.client || !props.downloadPath) return;
  
  transferring.value = true;
  transferComplete.value = false;
  cancelled.value = false;
  transferredCount.value = 0;
  successCount.value = 0;
  failedCount.value = 0;
  
  // Get all file paths recursively
  const allFiles = await getAllFiles(props.selectedFiles);
  totalFiles.value = allFiles.length;
  
  for (const file of allFiles) {
    // Check if cancelled
    if (cancelled.value) {
      break;
    }
    
    currentFile.value = file.path;
    
    try {
      // Get signed URL
      const { data, error } = await authStore.client.storage
        .from(file.bucket)
        .createSignedUrl(file.path, 3600);
      
      if (error) throw error;
      if (!data) continue;
      
      // Create local path preserving folder structure
      const localPath = `${props.downloadPath}/${file.bucket}/${file.path}`;
      
      // Create directory structure if needed
      const dirPath = localPath.substring(0, localPath.lastIndexOf('/'));
      const { ipcRenderer } = require('electron');
      await ipcRenderer.invoke('create-directory', dirPath);
      
      // Download file
      const result = await ipcRenderer.invoke('download-file', data.signedUrl, localPath);
      
      if (result.success) {
        successCount.value++;
      } else {
        failedCount.value++;
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      failedCount.value++;
    }
    
    transferredCount.value++;
  }
  
  transferring.value = false;
  
  if (cancelled.value) {
    transferComplete.value = false;
    currentFile.value = '';
  } else {
    transferComplete.value = true;
    currentFile.value = '';
    
    setTimeout(() => {
      emit('transfer-complete');
    }, 1000);
  }
};

const cancelDownload = () => {
  cancelled.value = true;
};

const getAllFiles = async (files: SelectedFile[]): Promise<SelectedFile[]> => {
  const result: SelectedFile[] = [];
  
  if (!authStore.client) return result;
  
  for (const file of files) {
    if (file.isFolder) {
      // Fetch all files in folder recursively
      const folderFiles = await fetchFolderContents(file.bucket, file.path);
      result.push(...folderFiles);
    } else {
      result.push(file);
    }
  }
  
  return result;
};

const fetchFolderContents = async (bucket: string, path: string): Promise<SelectedFile[]> => {
  if (!authStore.client) return [];
  
  const result: SelectedFile[] = [];
  
  try {
    const { data, error } = await authStore.client.storage
      .from(bucket)
      .list(path, {
        limit: 100,
        offset: 0,
      });
    
    if (error) return result;
    
    for (const item of data || []) {
      const isFolder = !item.id; // Folders don't have an id
      const itemPath = path ? `${path}/${item.name}` : item.name;
      
      result.push({
        bucket,
        path: itemPath,
        isFolder,
      });
      
      if (isFolder) {
        const nestedFiles = await fetchFolderContents(bucket, itemPath);
        result.push(...nestedFiles);
      }
    }
  } catch (error) {
    console.error('Error fetching folder contents:', error);
  }
  
  return result;
};

</script>

