<template>
  <div
    v-if="isVisible"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    @click.self="$emit('cancel')"
  >
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          Extract Recipe from Text
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
          <label for="recipe-text" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Recipe Text
          </label>
          <textarea
            id="recipe-text"
            ref="textInput"
            v-model="text"
            placeholder="Paste or type the recipe text here..."
            rows="12"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
            :disabled="isLoading"
          ></textarea>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Paste recipe content from websites, cookbooks, or any text source
          </p>
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
            :disabled="isLoading || !text.trim()"
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
  (e: 'submit', text: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const text = ref('')
const textInput = ref<HTMLTextAreaElement | null>(null)

// Clear text and focus input when dialog is opened
watch(() => props.isVisible, async (newValue) => {
  if (newValue) {
    text.value = ''
    // Focus the textarea after the DOM has updated
    await nextTick()
    textInput.value?.focus()
  }
})

const handleSubmit = () => {
  if (text.value.trim() && !props.isLoading) {
    emit('submit', text.value.trim())
  }
}
</script>
