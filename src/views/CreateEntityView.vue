<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <div class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 mb-6">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <button
              @click="cancel"
              class="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700"
            >
              ←
            </button>
            <div class="flex items-center space-x-2">
              <div
                :class="[
                  'w-8 h-8 rounded-full flex items-center justify-center',
                  getEntityTypeColor(entityType)
                ]"
              >
                <span class="text-lg">{{ getEntityTypeIcon(entityType) }}</span>
              </div>
              <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                Create New {{ entityType }}
              </h1>
            </div>
          </div>
          
          <div class="flex items-center space-x-3">
            <button
              @click="cancel"
              class="btn btn-outline"
              :disabled="isSaving"
            >
              Cancel
            </button>
            <button
              @click="saveEntity"
              class="btn btn-primary"
              :disabled="isSaving || !newEntity.name.trim()"
            >
              <span v-if="isSaving" class="flex items-center space-x-2">
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving...</span>
              </span>
              <span v-else>Save {{ entityType }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
      <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div class="flex items-center">
          <span class="text-red-600 dark:text-red-400 mr-2">⚠️</span>
          <p class="text-red-700 dark:text-red-300">{{ error }}</p>
          <button
            @click="clearError"
            class="ml-auto text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
          >
            ✕
          </button>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <!-- Available Entities Sidebar -->
        <div class="lg:col-span-1">
          <AvailableEntitiesSidebar
            :available-entities="availableEntitiesByType"
            :entity-groups="entityGroups"
            @attach-entity="attachEntity"
            @search="setSearchQuery"
            @toggle-collapse="toggleGroupCollapse"
            @create-ingredient="handleCreateIngredient"
          />
        </div>

        <!-- Entity Creation Form -->
        <div class="lg:col-span-3">
          <EntityCreationForm
            v-model:entity="newEntity"
            :attached-entities="attachedEntitiesByType"
            @detach-entity="detachEntity"
            @attach-entity="attachEntity"
          />
        </div>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div
      v-if="isLoading"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 flex items-center space-x-3">
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        <span class="text-gray-700 dark:text-gray-300">Loading entities...</span>
      </div>
    </div>

    <!-- Similarity Check Modal -->
    <SimilarityCheckModal
      :is-visible="showSimilarityModal"
      :is-loading="isCheckingSimilarity"
      :ingredient-name="pendingIngredientName"
      :similar-ingredients="similarIngredients"
      :is-from-search="isCreatingFromSearch"
      @cancel="handleSimilarityCancel"
      @continue="handleSimilarityContinue"
      @use-selected="handleUseSelectedIngredient"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useEntityCreation } from '@/composables/useEntityCreation'
import AvailableEntitiesSidebar from '@/components/AvailableEntitiesSidebar.vue'
import EntityCreationForm from '@/components/EntityCreationForm.vue'
import SimilarityCheckModal from '@/components/SimilarityCheckModal.vue'
import ApiService from '@/services/api'

interface Props {
  entityType: string
}

const props = defineProps<Props>()
const route = useRoute()

const {
  newEntity,
  attachedEntitiesByType,
  availableEntitiesByType,
  entityGroups,
  isLoading,
  isSaving,
  error,
  showSimilarityModal,
  isCheckingSimilarity,
  similarIngredients,
  pendingIngredientName,
  isCreatingFromSearch,
  loadEntities,
  setSearchQuery,
  toggleGroupCollapse,
  attachEntity,
  detachEntity,
  saveEntity,
  cancel,
  clearError,
  handleSimilarityCancel,
  handleSimilarityContinue,
  handleCreateIngredient,
  handleUseSelectedIngredient,
  getEntityTypeIcon,
  getEntityTypeColor
} = useEntityCreation(props.entityType)

onMounted(async () => {
  await loadEntities()

  // Handle pre-populated data from query parameters (e.g., from URL extraction)
  if (route.query.name && typeof route.query.name === 'string') {
    newEntity.name = route.query.name
  }

  // Handle pre-attached ingredients
  if (route.query.ingredients && typeof route.query.ingredients === 'string') {
    const ingredientIds = route.query.ingredients.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))

    // Fetch and attach the ingredients
    for (const ingredientId of ingredientIds) {
      try {
        const ingredient = await ApiService.getEntityById(ingredientId)
        if (ingredient && ingredient.type === 'Ingredient') {
          attachEntity(ingredient)
        }
      } catch (error) {
        console.error('Error fetching ingredient:', error)
      }
    }
  }

  // Handle pre-attached source
  if (route.query.sourceId && typeof route.query.sourceId === 'string') {
    const sourceId = parseInt(route.query.sourceId.trim())
    if (!isNaN(sourceId)) {
      try {
        const source = await ApiService.getEntityById(sourceId)
        if (source && source.type === 'Source') {
          attachEntity(source)
        }
      } catch (error) {
        console.error('Error fetching source:', error)
      }
    }
  }
})
</script>
