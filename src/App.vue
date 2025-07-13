<template>
  <div id="app" class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
    <!-- Navigation Header -->
    <nav class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <h1 class="text-xl font-bold text-gray-900 dark:text-white">Predator</h1>
            <span class="ml-2 text-sm text-gray-500 dark:text-gray-400"
              >Food Chain Entity Management</span
            >
          </div>

          <div class="flex items-center space-x-4">
            <div class="flex items-center space-x-2">
              <div
                class="w-2 h-2 rounded-full"
                :class="apiStatus ? 'bg-green-500' : 'bg-red-500'"
              ></div>
              <span class="text-sm text-gray-600 dark:text-gray-400">
                {{ apiStatus ? 'Connected' : 'Disconnected' }}
              </span>
            </div>

            <button
              @click="toggleDarkMode"
              class="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700"
            >
              {{ isDarkMode ? '☀️' : '🌙' }}
            </button>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <router-view />
    </main>

    <!-- Notifications -->
    <div class="fixed top-4 right-4 z-50 space-y-2">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        class="px-4 py-3 rounded-lg shadow-lg animate-slide-up relative"
        :class="{
          'bg-green-500 text-white': notification.type === 'success',
          'bg-red-500 text-white': notification.type === 'error',
          'bg-blue-500 text-white': notification.type === 'info',
          'bg-yellow-500 text-white': notification.type === 'warning',
        }"
      >
        <div class="flex items-center justify-between">
          <span>{{ notification.message }}</span>
          <button
            @click="dismissNotification(notification.id)"
            class="ml-2 text-white hover:text-gray-200"
          >
            ×
          </button>
        </div>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div
      v-if="isLoading"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40"
    >
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 flex items-center space-x-3">
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
        <span class="text-gray-700 dark:text-gray-300">Loading...</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUI } from '@/composables/useUI'
import ApiService from '@/services/api'

const {
  isDarkMode,
  isLoading,
  notifications,
  initializeDarkMode,
  toggleDarkMode,
  dismissNotification,
} = useUI()

const apiStatus = ref(false)

// Check API connection status
const checkApiStatus = async () => {
  try {
    apiStatus.value = await ApiService.healthCheck()
  } catch {
    apiStatus.value = false
  }
}

onMounted(() => {
  initializeDarkMode()
  checkApiStatus()
  // Check API status every 30 seconds
  setInterval(checkApiStatus, 30000)
})
</script>
