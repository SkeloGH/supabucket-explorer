<template>
  <div class="rounded-lg shadow h-full flex flex-col bg-dark-card border border-dark-border">
    <!-- Header with breadcrumb navigation -->
    <div class="px-4 py-3 border-b border-dark-border">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2 flex-1">
          <button
            v-if="currentBucket"
            @click="navigateUp"
            class="p-1 rounded hover:opacity-80 text-primary"
            title="Go back"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          
          <!-- Breadcrumb -->
          <div class="flex items-center gap-1 text-sm overflow-hidden text-primary">
            <span v-if="currentBucket" class="font-medium">{{ currentBucketOriginal }}</span>
            <span v-if="pathParts.length > 0" class="text-gray-400">/</span>
            <span v-for="(part, index) in pathParts" :key="index">
              <button @click="navigateToPath(part, index)" class="hover:opacity-80 text-primary">
                {{ part }}
              </button>
              <span v-if="index < pathParts.length - 1" class="text-gray-400 mx-1">/</span>
            </span>
          </div>
        </div>
        
        <button
          v-if="currentBucket"
          @click="navigateToBucket(null)"
          class="px-3 py-1 text-xs font-medium rounded bg-primary hover:opacity-90 text-white transition-opacity"
          title="Return to bucket list"
        >
          Buckets
        </button>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-auto">
      <!-- Loading state -->
      <div v-if="loading" class="p-8 text-center text-gray-400">
        Loading...
      </div>
      
      <!-- Error state -->
      <div v-else-if="errorMessage" class="p-8 text-center text-red-500">
        {{ errorMessage }}
      </div>
      
      <!-- Bucket list -->
      <div v-else-if="!currentBucket" class="p-2">
        <div v-if="buckets.length === 0" class="text-center text-gray-400 py-8">
          No buckets found
        </div>
        <div
          v-for="bucket in buckets"
          :key="bucket.id"
          class="border-b border-dark-border"
        >
          <button
            @click="openBucket(bucket.id, bucket.name)"
            class="w-full px-4 py-3 flex items-center justify-between hover:opacity-80 focus:outline-none"
          >
            <div class="flex items-center gap-3">
              <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <span class="font-medium text-white">{{ bucket.name }}</span>
              <span class="text-sm text-gray-400">({{ bucket.public ? 'public' : 'private' }})</span>
            </div>
            <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
      
      <!-- File/folder list -->
      <div v-else class="p-2">
        <div v-if="loadingFiles[currentBucket] && fileOffset === 0" class="text-center text-gray-400 py-8">
          Loading files...
        </div>
        <div v-else-if="currentFiles.length === 0" class="text-center text-gray-400 py-8">
          This folder is empty
        </div>
        <div v-else class="space-y-1">
          <div
            v-for="file in currentFiles"
            :key="file.name"
            class="flex items-center gap-3 px-3 py-2 hover:opacity-80 rounded"
            :class="{ 'cursor-pointer': !file.id }"
            @click="file.id ? null : openFolder(file.name)"
          >
            <!-- Only show checkbox for files, not folders -->
            <input
              v-if="file.id"
              type="checkbox"
              :checked="isFileSelected(file.name, currentBucket)"
              @change.stop="(e) => handleCheckboxChange({ bucket: currentBucket, path: getFullPath(file.name), isFolder: false }, (e.target as HTMLInputElement).checked)"
              class="w-4 h-4 rounded accent-primary"
            />
            <div v-else class="w-4 h-4"></div>
            
            <svg v-if="!file.id" class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <svg v-else class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            
            <span class="flex-1 text-white">{{ file.name }}</span>
          </div>
          
          <!-- Load More Button -->
          <div v-if="hasMoreFiles && currentFiles.length > 0" class="pt-2 pb-1">
            <button
              @click="loadMoreFiles"
              :disabled="loadingFiles[currentBucket]"
              class="w-full px-4 py-2 text-sm font-medium text-white rounded-md bg-primary hover:opacity-90 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              {{ loadingFiles[currentBucket] ? 'Loading more...' : 'Load More' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive, nextTick } from 'vue';
import { useAuthStore } from '../stores/auth';
import type { FileItem, SelectedFile } from '../types/supabase';

interface Bucket {
  id: string;
  name: string;
  public: boolean;
}

const props = withDefaults(defineProps<{
  modelValue?: SelectedFile[];
  availableFiles?: SelectedFile[];
}>(), {
  modelValue: () => [],
  availableFiles: () => [],
});

const emit = defineEmits<{
  'update:modelValue': [value: SelectedFile[]];
  'update:availableFiles': [files: SelectedFile[]];
}>();

const authStore = useAuthStore();
const buckets = ref<Bucket[]>([]);
const currentBucket = ref<string>('');
const currentBucketOriginal = ref<string>('');
const currentPath = ref<string>('');
const currentFiles = ref<FileItem[]>([]);
const loading = ref(false);
const loadingFiles = reactive<Record<string, boolean>>({});
const hasMoreFiles = ref(false);
const fileOffset = ref(0);
const errorMessage = ref<string>('');

const pathParts = computed(() => {
  if (!currentPath.value) return [];
  return currentPath.value.split('/').filter(p => p);
});

const getFullPath = (fileName: string) => {
  // Use the actual file/folder name from Supabase
  if (!currentPath.value) return fileName;
  return `${currentPath.value}/${fileName}`;
};

const fetchBuckets = async () => {
  if (!authStore.client) {
    console.error('No Supabase client available');
    return;
  }
  
  loading.value = true;
  errorMessage.value = '';
  
  try {
    const { data: { session } } = await authStore.client.auth.getSession();
    
    if (!session) {
      errorMessage.value = 'No active session. Please log in again.';
      return;
    }
    
    const { data, error } = await authStore.client.storage.listBuckets();
    
    if (error) {
      console.error('Error from listBuckets:', error);
      errorMessage.value = error.message || 'Failed to fetch buckets. Check console for details.';
      throw error;
    }

    buckets.value = data || [];
    
    if (buckets.value.length === 0) {
      errorMessage.value = 'No buckets found. Ensure buckets exist and RLS policies allow access.';
    }
  } catch (error: any) {
    console.error('Error fetching buckets:', error);
    errorMessage.value = error.message || 'Error fetching buckets. Check console for details.';
  } finally {
    loading.value = false;
  }
};

const openBucket = async (bucketId: string, displayName: string) => {
  currentBucket.value = bucketId; // Use bucket id (slug) for API calls
  currentBucketOriginal.value = displayName;
  currentPath.value = '';
  currentFiles.value = [];
  fileOffset.value = 0;
  hasMoreFiles.value = false;
  emit('update:availableFiles', []);
  emit('update:modelValue', []); // Clear selections
  await fetchFiles(bucketId, '', 0, true);
};

const openFolder = async (folderName: string) => {
  // Don't normalize - use the actual folder name from Supabase
  const newPath = currentPath.value ? `${currentPath.value}/${folderName}` : folderName;
  currentPath.value = newPath;
  currentFiles.value = [];
  fileOffset.value = 0;
  hasMoreFiles.value = false;
  emit('update:availableFiles', []);
  emit('update:modelValue', []); // Clear selections
  await fetchFiles(currentBucket.value, newPath, 0, true);
};

const navigateUp = () => {
  if (!currentPath.value) {
    // Go back to bucket list
    currentBucket.value = '';
    currentBucketOriginal.value = '';
    currentPath.value = '';
    currentFiles.value = [];
    fileOffset.value = 0;
    hasMoreFiles.value = false;
    emit('update:availableFiles', []);
    emit('update:modelValue', []); // Clear selections
    return;
  }
  
  // Navigate up one level
  const parts = currentPath.value.split('/').filter(p => p);
  parts.pop();
  currentPath.value = parts.join('/');
  
  if (parts.length === 0) {
    currentPath.value = '';
  }
  
  currentFiles.value = [];
  fileOffset.value = 0;
  hasMoreFiles.value = false;
  emit('update:availableFiles', []);
  emit('update:modelValue', []); // Clear selections
  fetchFiles(currentBucket.value, currentPath.value, 0, true);
};

const navigateToBucket = (bucketName: string | null) => {
  if (bucketName === null) {
    currentBucket.value = '';
    currentBucketOriginal.value = '';
    currentPath.value = '';
    currentFiles.value = [];
    fileOffset.value = 0;
    hasMoreFiles.value = false;
    emit('update:availableFiles', []);
    emit('update:modelValue', []); // Clear selections
  } else {
    openBucket(bucketName);
  }
};

const navigateToPath = (pathPart: string, index: number) => {
  const parts = pathParts.value.slice(0, index + 1);
  currentPath.value = parts.join('/');
  currentFiles.value = [];
  fileOffset.value = 0;
  hasMoreFiles.value = false;
  emit('update:availableFiles', []);
  emit('update:modelValue', []); // Clear selections
  fetchFiles(currentBucket.value, currentPath.value, 0, true);
};

const fetchFiles = async (bucketName: string, path: string, offset: number = 0, replace: boolean = false) => {
  if (!authStore.client) return;
  
  loadingFiles[bucketName] = true;
  
  const limit = 50;
  
  try {
    const { data, error } = await authStore.client.storage
      .from(bucketName)
      .list(path, {
        limit,
        offset,
        sortBy: { column: 'name', order: 'asc' }
      });
    
    if (error) {
      console.error(`Error fetching files from ${bucketName}:`, error);
      throw error;
    }

    const loadedFiles = data || [];
    
    // Check if there are more files (if we got a full page)
    hasMoreFiles.value = loadedFiles.length === limit;
    
    if (replace) {
      currentFiles.value = loadedFiles;
      fileOffset.value = 0;
    } else {
      currentFiles.value = [...currentFiles.value, ...loadedFiles];
    }
    
    // Update offset to the total number of files loaded
    fileOffset.value = currentFiles.value.length;
    
    // Emit available files for select all functionality - only files, not folders
    // We need to wait for the next tick to ensure currentFiles is updated
    await nextTick();
    const available: SelectedFile[] = currentFiles.value
      .filter(file => file.id) // Only files have an id
      .map(file => ({
        bucket: bucketName,
        path: getFullPath(file.name),
        isFolder: false,
      }));
    emit('update:availableFiles', available);
    
    if (currentFiles.value.length === 0) {
      console.warn(`No objects found in ${bucketName}. This could be due to RLS policies on storage.objects table.`);
    }
  } catch (error) {
    console.error('Error fetching files:', error);
    errorMessage.value = 'Failed to load folder contents';
  } finally {
    loadingFiles[bucketName] = false;
  }
};

const loadMoreFiles = async () => {
  const offset = fileOffset.value;
  await fetchFiles(currentBucket.value, currentPath.value, offset, false);
};

const isFileSelected = (fileName: string, bucket: string) => {
  if (!props.modelValue || !Array.isArray(props.modelValue)) {
    return false;
  }
  const fullPath = getFullPath(fileName);
  return props.modelValue.some(f => f.bucket === bucket && f.path === fullPath);
};

const handleCheckboxChange = (file: SelectedFile, checked: boolean) => {
  const current = props.modelValue || [];
  
  if (checked) {
    emit('update:modelValue', [...current, file]);
  } else {
    emit('update:modelValue', current.filter(f => !(f.bucket === file.bucket && f.path === file.path)));
  }
};

watch(() => authStore.isAuthenticated, (authenticated) => {
  if (authenticated) {
    fetchBuckets();
  }
}, { immediate: true });

</script>
