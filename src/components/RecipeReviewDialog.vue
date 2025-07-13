<template>
  <div
    v-if="isVisible"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    @click.self="$emit('cancel')"
  >
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
          Review Extracted Recipe
        </h3>
        <button
          @click="$emit('cancel')"
          class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          ✕
        </button>
      </div>

      <div v-if="extractedRecipe" class="space-y-6">
        <!-- Recipe Name -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Recipe Name
          </label>
          <input
            v-model="recipeName"
            type="text"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter recipe name"
          />
        </div>

        <!-- Source URL -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Source URL
          </label>
          <div class="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-2 rounded border">
            {{ extractedRecipe.url }}
          </div>
        </div>

        <!-- Ingredients -->
        <div>
          <h4 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Ingredients ({{ extractedRecipe.ingredients.length }})
          </h4>
          <div class="space-y-4">
            <div
              v-for="(ingredient, index) in extractedRecipe.ingredients"
              :key="index"
              class="border border-gray-200 dark:border-gray-600 rounded-lg p-4"
            >
              <div class="flex items-center space-x-4">
                <!-- Extracted ingredient name -->
                <div class="flex-1">
                  <label :for="`ingredient-name-${index}`" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Extracted ingredient:
                  </label>
                  <input
                    :id="`ingredient-name-${index}`"
                    v-model="editableIngredientNames[index]"
                    type="text"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter ingredient name"
                  />
                </div>

                <!-- Dropdown for similar ingredients -->
                <div class="flex-1">
                  <label :for="`ingredient-${index}`" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Use existing ingredient or create new:
                  </label>
                  <select
                    :id="`ingredient-${index}`"
                    v-model="selectedIngredients[index]"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <!-- Option to create new ingredient -->
                    <option :value="null">
                      Create new ingredient
                    </option>

                    <!-- Options for existing similar ingredients (sorted by similarity) -->
                    <option
                      v-for="similar in getSortedSimilarIngredients(ingredient.similarIngredients)"
                      :key="similar.id"
                      :value="similar.id"
                    >
                      {{ similar.name }} ({{ Math.round(similar.similarity * 100) }}% match)
                    </option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-600">
          <button
            @click="$emit('cancel')"
            class="btn btn-outline"
            :disabled="isProcessing"
          >
            Cancel
          </button>
          <button
            @click="handleAccept"
            class="btn btn-primary"
            :disabled="isProcessing || !recipeName.trim()"
          >
            <span v-if="isProcessing" class="flex items-center space-x-2">
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Processing...</span>
            </span>
            <span v-else>Accept Recipe</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { ExtractedRecipeResponse, SimilarIngredientMatch } from '@/types/api'

interface Props {
  isVisible: boolean
  extractedRecipe: ExtractedRecipeResponse | null
  isProcessing: boolean
}

interface Emits {
  (e: 'cancel'): void
  (e: 'accept', data: { recipeName: string; ingredientSelections: (number | null)[]; ingredientNames: string[] }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const recipeName = ref('')
const selectedIngredients = ref<(number | null)[]>([])
const editableIngredientNames = ref<string[]>([])

// Initialize selections when recipe changes
watch(() => props.extractedRecipe, (newRecipe) => {
  if (newRecipe) {
    recipeName.value = newRecipe.simplifiedName || ''

    // Initialize editable ingredient names
    editableIngredientNames.value = newRecipe.ingredients.map(ingredient => ingredient.name)

    // Initialize selections based on similarity threshold
    selectedIngredients.value = newRecipe.ingredients.map(ingredient => {
      const sortedSimilar = getSortedSimilarIngredients(ingredient.similarIngredients)
      const mostSimilar = sortedSimilar[0]

      // If the most similar ingredient has >80% similarity, select it by default
      if (mostSimilar && mostSimilar.similarity > 0.8) {
        return mostSimilar.id
      }

      // Otherwise, default to "create new" (null)
      return null
    })
  }
})

// Clear data when dialog is closed
watch(() => props.isVisible, (newValue) => {
  if (!newValue) {
    recipeName.value = ''
    selectedIngredients.value = []
    editableIngredientNames.value = []
  }
})

const getSortedSimilarIngredients = (similarIngredients: SimilarIngredientMatch[]) => {
  return [...similarIngredients].sort((a, b) => b.similarity - a.similarity)
}

const handleAccept = () => {
  if (recipeName.value.trim() && props.extractedRecipe) {
    emit('accept', {
      recipeName: recipeName.value.trim(),
      ingredientSelections: [...selectedIngredients.value],
      ingredientNames: [...editableIngredientNames.value]
    })
  }
}
</script>
