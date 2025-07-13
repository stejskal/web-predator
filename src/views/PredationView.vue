<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="text-center">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">Predation</h1>
      <p class="text-gray-600">
        Explore and navigate through food chain entities and their relationships
      </p>
    </div>

    <!-- Entity Type Tabs -->
    <div class="border-b border-gray-200 dark:border-gray-700">
      <nav class="-mb-px flex space-x-8 overflow-x-auto">
        <button
          v-for="entityType in ENTITY_TYPES"
          :key="entityType"
          @click="setActiveTab(entityType)"
          class="whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors"
          :class="
            activeTab === entityType
              ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
          "
        >
          <span class="mr-2">{{ getEntityTypeIcon(entityType) }}</span>
          {{ entityType }}
          <span
            class="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full dark:bg-gray-700 dark:text-gray-300"
          >
            {{ entitiesByType[entityType]?.length || 0 }}
          </span>
        </button>
      </nav>
    </div>

    <!-- Search Bar and Create Buttons -->
    <div class="flex items-center justify-between">
      <div class="max-w-md">
        <div class="relative">
          <input
            :value="getSearchQuery(activeTab)"
            @input="setSearchQuery(activeTab, ($event.target as HTMLInputElement).value)"
            type="text"
            :placeholder="`Search ${activeTab.toLowerCase()}s...`"
            class="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span class="text-gray-400">🔍</span>
          </div>
        </div>
      </div>

      <!-- Create Buttons -->
      <div class="flex items-center space-x-3">
        <!-- Create Recipe From Text Button (only for Recipe tab) -->
        <button
          v-if="activeTab === 'Recipe'"
          @click="showTextDialog = true"
          class="btn btn-outline flex items-center space-x-2"
        >
          <span>📝</span>
          <span>Create Recipe From Text</span>
        </button>

        <!-- Create Recipe From URL Button (only for Recipe tab) -->
        <button
          v-if="activeTab === 'Recipe'"
          @click="showUrlDialog = true"
          class="btn btn-outline flex items-center space-x-2"
        >
          <span>🌐</span>
          <span>Create Recipe From URL</span>
        </button>

        <!-- Regular Create Button -->
        <router-link
          :to="{ name: 'create-entity', params: { entityType: activeTab } }"
          class="btn btn-primary flex items-center space-x-2"
        >
          <span>+</span>
          <span>Create {{ activeTab }}</span>
        </router-link>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="text-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
      <p class="text-gray-600 mt-4">Loading entities...</p>
    </div>

    <!-- Entity List -->
    <div v-else-if="currentEntities.length > 0" class="space-y-4">
      <UnifiedEntityCard
        v-for="entity in currentEntities"
        :key="entity.id"
        :entity="entity"
        :depth="0"
        :is-expanded="isEntityExpanded(entity.id)"
        :is-loading-relationships="isLoadingRelationships(entity.id)"
        :relationships="getEntityRelationships(entity.id)"
        :expanded-relationships="
          expandedEntities.get(entity.id)?.expandedRelationships || new Set()
        "
        @toggle-expansion="toggleEntityExpansion"
        @toggle-relationship="toggleRelationshipExpansion"
      />
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-12">
      <div class="text-gray-400 text-6xl mb-4">{{ getEntityTypeIcon(activeTab) }}</div>
      <h3 class="text-lg font-semibold text-gray-900 mb-2">
        No {{ activeTab.toLowerCase() }}s found
      </h3>
      <p class="text-gray-600">
        {{
          getSearchQuery(activeTab)
            ? `No ${activeTab.toLowerCase()}s match your search criteria.`
            : `No ${activeTab.toLowerCase()}s have been created yet.`
        }}
      </p>
      <button
        v-if="getSearchQuery(activeTab)"
        @click="setSearchQuery(activeTab, '')"
        class="mt-4 btn btn-outline"
      >
        Clear Search
      </button>
    </div>

    <!-- Clear All Expansions Button -->
    <div v-if="expandedEntities.size > 0" class="text-center pt-8">
      <button @click="clearAllExpansions" class="btn btn-outline">Collapse All</button>
    </div>

    <!-- Text Input Dialog -->
    <TextInputDialog
      :is-visible="showTextDialog"
      :is-loading="isExtractingRecipe"
      :error="extractionError"
      @cancel="handleTextDialogCancel"
      @submit="handleTextSubmit"
    />

    <!-- URL Input Dialog -->
    <URLInputDialog
      :is-visible="showUrlDialog"
      :is-loading="isExtractingRecipe"
      :error="extractionError"
      @cancel="handleUrlDialogCancel"
      @submit="handleUrlSubmit"
    />

    <!-- Recipe Review Dialog -->
    <RecipeReviewDialog
      :is-visible="showReviewDialog"
      :extracted-recipe="extractedRecipe"
      :is-processing="isProcessingRecipe"
      @cancel="handleReviewDialogCancel"
      @accept="handleRecipeAccept"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePredation } from '@/composables/usePredation'
import UnifiedEntityCard from '@/components/UnifiedEntityCard.vue'
import TextInputDialog from '@/components/TextInputDialog.vue'
import URLInputDialog from '@/components/URLInputDialog.vue'
import RecipeReviewDialog from '@/components/RecipeReviewDialog.vue'
import { ApiService } from '@/services/api'
import type { ExtractedRecipeResponse } from '@/types/api'

const {
  activeTab,
  entitiesByType,
  currentEntities,
  expandedEntities,
  toggleEntityExpansion,
  toggleRelationshipExpansion,
  isEntityExpanded,
  isLoadingRelationships,
  getEntityRelationships,
  setActiveTab,
  setSearchQuery,
  getSearchQuery,
  clearAllExpansions,
  getEntityTypeIcon,
  fetchEntities,
  fetchSchema,
  initializeSearchQueries,
  isLoading,
  ENTITY_TYPES,
} = usePredation()

const route = useRoute()
const router = useRouter()

// Recipe extraction state
const showTextDialog = ref(false)
const showUrlDialog = ref(false)
const showReviewDialog = ref(false)
const isExtractingRecipe = ref(false)
const isProcessingRecipe = ref(false)
const extractionError = ref<string>('')
const extractedRecipe = ref<ExtractedRecipeResponse | null>(null)

onMounted(async () => {
  // Fetch schema first to get dynamic entity types
  await fetchSchema()
  // Initialize search queries for all entity types
  initializeSearchQueries()
  // Then fetch entities
  await fetchEntities()

  // Set active tab from query parameter if provided
  if (route.query.tab && typeof route.query.tab === 'string') {
    const tabType = route.query.tab
    if (ENTITY_TYPES.value.includes(tabType as any)) {
      setActiveTab(tabType)
    }
  }
})

// Watch for query parameter changes
watch(() => route.query.tab, (newTab) => {
  if (newTab && typeof newTab === 'string' && ENTITY_TYPES.value.includes(newTab as any)) {
    setActiveTab(newTab)
  }
})

// Text extraction handlers
const handleTextDialogCancel = () => {
  showTextDialog.value = false
  extractionError.value = ''
}

const handleTextSubmit = async (text: string) => {
  isExtractingRecipe.value = true
  extractionError.value = ''

  try {
    const result = await ApiService.extractRecipeFromText({ text })

    if (result.success) {
      extractedRecipe.value = result
      showTextDialog.value = false
      showReviewDialog.value = true
    } else {
      extractionError.value = result.errorMessage || 'Failed to extract recipe from text'
    }
  } catch (error: any) {
    console.error('Error extracting recipe from text:', error)

    // Provide specific error messages based on the error type
    if (error.response?.status === 400) {
      const errorData = error.response.data
      extractionError.value = errorData?.message || 'Unable to extract recipe content from the provided text.'
    } else if (error.response?.status === 500) {
      extractionError.value = 'Server error occurred while processing the recipe text. Please try again later.'
    } else if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
      extractionError.value = 'Network error: Unable to connect to the recipe extraction service. Please check your internet connection.'
    } else if (error.code === 'TIMEOUT' || error.message?.includes('timeout')) {
      extractionError.value = 'Request timeout: The text processing took too long. Please try again with shorter text.'
    } else {
      extractionError.value = 'Failed to extract recipe from text. Please ensure the text contains recipe information and try again.'
    }
  } finally {
    isExtractingRecipe.value = false
  }
}

// URL extraction handlers
const handleUrlDialogCancel = () => {
  showUrlDialog.value = false
  extractionError.value = ''
}

const handleUrlSubmit = async (url: string) => {
  isExtractingRecipe.value = true
  extractionError.value = ''

  try {
    const result = await ApiService.extractRecipeFromUrl({ url })

    if (result.success) {
      extractedRecipe.value = result
      showUrlDialog.value = false
      showReviewDialog.value = true
    } else {
      extractionError.value = result.errorMessage || 'Failed to extract recipe from URL'
    }
  } catch (error: any) {
    console.error('Error extracting recipe:', error)

    // Provide more specific error messages based on the error type
    if (error.response?.status === 400) {
      // Bad request - likely an issue with the URL or extraction process
      const errorData = error.response.data
      extractionError.value = errorData?.message || 'Invalid URL or unable to extract recipe content from this page.'
    } else if (error.response?.status === 500) {
      // Server error
      extractionError.value = 'Server error occurred while processing the recipe. Please try again later.'
    } else if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
      // Network connectivity issues
      extractionError.value = 'Network error: Unable to connect to the recipe extraction service. Please check your internet connection.'
    } else if (error.code === 'ENOTFOUND' || error.message?.includes('ENOTFOUND')) {
      // DNS resolution failed
      extractionError.value = 'Invalid URL: The website could not be found. Please check the URL and try again.'
    } else if (error.code === 'TIMEOUT' || error.message?.includes('timeout')) {
      // Request timeout
      extractionError.value = 'Request timeout: The website took too long to respond. Please try again or use a different URL.'
    } else {
      // Generic fallback with more helpful guidance
      extractionError.value = 'Failed to extract recipe. Please ensure the URL is valid and contains a recipe, then try again.'
    }
  } finally {
    isExtractingRecipe.value = false
  }
}

const handleReviewDialogCancel = () => {
  showReviewDialog.value = false
  extractedRecipe.value = null
}

const handleRecipeAccept = async (data: { recipeName: string; ingredientSelections: (number | null)[]; ingredientNames: string[] }) => {
  if (!extractedRecipe.value) return

  isProcessingRecipe.value = true

  try {
    // Create new ingredients for selections that are null
    const ingredientIds: number[] = []

    for (let i = 0; i < data.ingredientSelections.length; i++) {
      const selection = data.ingredientSelections[i]

      if (selection === null) {
        // Create new ingredient using the edited name
        const ingredientName = data.ingredientNames[i]
        const newIngredient = await ApiService.createEntity({
          name: ingredientName,
          type: 'Ingredient'
        })
        ingredientIds.push(newIngredient.id)
      } else {
        // Use existing ingredient
        ingredientIds.push(selection)
      }
    }

    // Create a Source entity only if the recipe came from a URL (not from text)
    const queryParams: any = {
      name: data.recipeName,
      ingredients: ingredientIds.join(',')
    }

    // Only create source entity for URL-based extractions
    if (extractedRecipe.value.url && extractedRecipe.value.url.trim() !== '') {
      const sourceEntity = await ApiService.createEntity({
        name: extractedRecipe.value.url,
        type: 'Source'
      })
      queryParams.sourceId = sourceEntity.id.toString()
    }

    router.push({
      name: 'create-entity',
      params: { entityType: 'Recipe' },
      query: queryParams
    })

    // Close dialogs
    showReviewDialog.value = false
    extractedRecipe.value = null

  } catch (error) {
    console.error('Error processing recipe:', error)
    // You might want to show an error message here
  } finally {
    isProcessingRecipe.value = false
  }
}
</script>
