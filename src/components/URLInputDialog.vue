<template>
  <div
    v-if="isVisible"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    @click.self="$emit('cancel')"
  >
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          Extract Recipe from URL
        </h3>
        <button
          @click="$emit('cancel')"
          class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          ✕
        </button>
      </div>

      <div class="space-y-4">
        <div>
          <label for="recipe-url" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Recipe URL
          </label>
          <input
            id="recipe-url"
            ref="urlInput"
            v-model="url"
            type="url"
            placeholder="https://example.com/recipe"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            :disabled="isLoading"
            @keyup.enter="handleSubmit"
          />
        </div>

        <div v-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <div class="flex items-center">
            <span class="text-red-600 dark:text-red-400 mr-2">⚠️</span>
            <p class="text-red-700 dark:text-red-300 text-sm">{{ error }}</p>
          </div>
        </div>

        <div class="flex justify-end space-x-3">
          <button
            @click="$emit('cancel')"
            class="btn btn-outline"
            :disabled="isLoading"
          >
            Cancel
          </button>
          <button
            @click="handleSubmit"
            class="btn btn-primary"
            :disabled="isLoading || !url.trim()"
          >
            <span v-if="isLoading" class="flex items-center space-x-2">
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Extracting...</span>
            </span>
            <span v-else>Extract Recipe</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'

interface Props {
  isVisible: boolean
  isLoading: boolean
  error?: string
}

interface Emits {
  (e: 'cancel'): void
  (e: 'submit', url: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const url = ref('')
const urlInput = ref<HTMLInputElement | null>(null)

// Clear URL and focus input when dialog is opened
watch(() => props.isVisible, async (newValue) => {
  if (newValue) {
    url.value = ''
    // Focus the input after the DOM has updated
    await nextTick()
    urlInput.value?.focus()
  }
})

const handleSubmit = () => {
  if (url.value.trim() && !props.isLoading) {
    emit('submit', url.value.trim())
  }
}
</script>
