<template>
  <div class="flex items-center justify-center min-h-screen bg-dark-bg">
    <div class="max-w-md w-full space-y-8 p-8 rounded-lg shadow-lg bg-dark-card border border-dark-border">
      <div>
        <h2 class="text-center text-3xl font-extrabold text-white">
          SupaBucket Explorer
        </h2>
        <p class="mt-2 text-center text-sm text-gray-400">
          Sign in to explore your storage buckets
        </p>
      </div>
      
      <form @submit.prevent="handleLogin" class="mt-8 space-y-6">
        <div class="space-y-4">
          <div>
            <label for="project-id" class="block text-sm font-medium text-white">
              Project ID
            </label>
            <input
              id="project-id"
              v-model="projectId"
              type="text"
              required
              class="mt-1 appearance-none relative block w-full px-3 py-2 border text-white placeholder-gray-400 rounded-md focus:outline-none focus:z-10 sm:text-sm bg-dark-card border-dark-border"
              placeholder="your-project-id"
            />
          </div>
          
          <div>
            <label for="email" class="block text-sm font-medium text-white">
              Email
            </label>
            <input
              id="email"
              v-model="email"
              type="email"
              required
              class="mt-1 appearance-none relative block w-full px-3 py-2 border text-white placeholder-gray-400 rounded-md focus:outline-none focus:z-10 sm:text-sm bg-dark-card border-dark-border"
              placeholder="your-email@example.com"
            />
          </div>
          
          <div>
            <label for="password" class="block text-sm font-medium text-white">
              Password
            </label>
            <input
              id="password"
              v-model="password"
              type="password"
              required
              class="mt-1 appearance-none relative block w-full px-3 py-2 border text-white placeholder-gray-400 rounded-md focus:outline-none focus:z-10 sm:text-sm bg-dark-card border-dark-border"
              placeholder="Password"
            />
          </div>
          
          <div>
            <label for="anon-key" class="block text-sm font-medium text-white">
              Supabase Anon Key
            </label>
            <input
              id="anon-key"
              v-model="anonKey"
              type="text"
              required
              class="mt-1 appearance-none relative block w-full px-3 py-2 border text-white placeholder-gray-400 rounded-md focus:outline-none focus:z-10 sm:text-sm bg-dark-card border-dark-border"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            />
          </div>
        </div>

        <div v-if="error" class="text-red-500 text-sm text-center">
          {{ error }}
        </div>

        <div>
          <button
            type="submit"
            :disabled="loading"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          >
            {{ loading ? 'Signing in...' : 'Sign in' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '../stores/auth';

const authStore = useAuthStore();
const projectId = ref('');
const email = ref('');
const password = ref('');
const anonKey = ref('');
const loading = ref(false);
const error = ref('');

const handleLogin = async () => {
  loading.value = true;
  error.value = '';
  
  const result = await authStore.login(projectId.value, email.value, password.value, anonKey.value);
  
  if (!result.success) {
    error.value = result.error || 'Login failed. Please check your credentials.';
    loading.value = false;
  }
  // Success is handled by the store updating isAuthenticated
};
</script>

