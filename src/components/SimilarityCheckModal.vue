<template>
  <div
    v-if="isVisible"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    @click.self="$emit('cancel')"
  >
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
            Similar Ingredients Found
          </h2>
          <button
            @click="$emit('cancel')"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">
          We found {{ similarIngredients.length }} ingredients with similar names to "{{ ingredientName }}".
          Please review them before creating a new ingredient.
        </p>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="px-6 py-8 text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p class="text-gray-600 dark:text-gray-400">Checking for similar ingredients...</p>
      </div>

      <!-- Similar Ingredients List -->
      <div v-else-if="similarIngredients.length > 0" class="px-6 py-4 max-h-96 overflow-y-auto">
        <div class="space-y-3">
          <div
            v-for="similar in similarIngredients"
            :key="similar.ingredient.id"
            :class="[
              'flex items-center justify-between p-4 border rounded-lg transition-colors cursor-pointer',
              selectedIngredient?.id === similar.ingredient.id
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
            ]"
            @click="selectIngredient(similar.ingredient)"
          >
            <div class="flex-1">
              <div class="flex items-center space-x-3">
                <div class="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <span class="text-lg">🥬</span>
                </div>
                <div>
                  <h3 class="font-medium text-gray-900 dark:text-white">
                    {{ similar.ingredient.name }}
                  </h3>
                  <p v-if="similar.ingredient.description" class="text-sm text-gray-600 dark:text-gray-400">
                    {{ similar.ingredient.description }}
                  </p>
                </div>
              </div>
            </div>
            <div class="text-right">
              <div class="text-sm font-medium text-gray-900 dark:text-white">
                {{ Math.round(similar.similarity * 100) }}% similar
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400">
                ID: {{ similar.ingredient.id }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- No Similar Ingredients -->
      <div v-else class="px-6 py-8 text-center">
        <div class="text-gray-400 dark:text-gray-500 mb-2">
          🔍
        </div>
        <p class="text-gray-600 dark:text-gray-400">
          No similar ingredients found. You can proceed with creating the new ingredient.
        </p>
      </div>

      <!-- Footer Actions -->
      <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
        <button
          @click="$emit('cancel')"
          class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          :disabled="isLoading"
        >
          Cancel
        </button>

        <!-- Use Selected Ingredient Button (only show when creating from search and ingredient is selected) -->
        <button
          v-if="isFromSearch && selectedIngredient"
          @click="$emit('use-selected', selectedIngredient)"
          class="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          :disabled="isLoading"
        >
          Use Selected Ingredient Instead
        </button>

        <button
          @click="$emit('continue')"
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          :disabled="isLoading"
        >
          Continue Saving New Ingredient
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { SimilarIngredientResponse, EntityResponse } from '@/types/api'

interface Props {
  isVisible: boolean
  isLoading: boolean
  ingredientName: string
  similarIngredients: SimilarIngredientResponse[]
  isFromSearch?: boolean
}

const props = defineProps<Props>()

defineEmits<{
  'cancel': []
  'continue': []
  'use-selected': [ingredient: EntityResponse]
}>()

const selectedIngredient = ref<EntityResponse | null>(null)

const selectIngredient = (ingredient: EntityResponse) => {
  selectedIngredient.value = ingredient
}

// Reset selected ingredient when modal is closed or similar ingredients change
watch([() => props.isVisible, () => props.similarIngredients], () => {
  selectedIngredient.value = null
})
</script>
