import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import ApiService from '@/services/api'
import { useEntities } from '@/composables/useEntities'
import { usePredation } from '@/composables/usePredation'
import { useSchema } from '@/composables/useSchema'
import type { EntityResponse, CreateEntityRequest, SimilarIngredientResponse } from '@/types/api'
import { ENTITY_TYPES } from '@/types/api'

interface NewEntity {
  name: string
  type: string
  description: string
}

interface EntityGroup {
  type: string
  entities: EntityResponse[]
  searchQuery: string
  isCollapsed: boolean
}

export function useEntityCreation(entityType: string) {
  const router = useRouter()
  const { entities, fetchEntities } = useEntities()
  const { getEntityTypeIcon, getEntityTypeColor } = usePredation()
  const { fetchSchema, getValidTargetEntityTypes } = useSchema()

  // New entity being created
  const newEntity = reactive<NewEntity>({
    name: '',
    type: entityType,
    description: ''
  })

  // Attached relationships (entities that will be related to the new entity)
  const attachedEntities = ref<EntityResponse[]>([])

  // Loading states
  const isLoading = ref(false)
  const isSaving = ref(false)
  const error = ref<string | null>(null)

  // Similarity check states
  const showSimilarityModal = ref(false)
  const isCheckingSimilarity = ref(false)
  const similarIngredients = ref<SimilarIngredientResponse[]>([])
  const pendingSaveData = ref<{ entity: CreateEntityRequest; attachedEntities: EntityResponse[] } | null>(null)
  const pendingIngredientName = ref('')
  const isCreatingFromSearch = ref(false)

  // Get valid entity types that can be attached to the current entity type
  const validEntityTypes = computed(() => {
    return getValidTargetEntityTypes(entityType)
  })

  // Entity groups for the sidebar (only for valid entity types)
  const entityGroups = reactive<Record<string, EntityGroup>>({})

  // Initialize entity groups for valid types
  const initializeEntityGroups = () => {
    const validTypes = validEntityTypes.value

    // Clear existing groups
    Object.keys(entityGroups).forEach(key => {
      delete entityGroups[key]
    })

    // Add groups for valid types only (collapsed by default)
    validTypes.forEach(type => {
      entityGroups[type] = {
        type,
        entities: [],
        searchQuery: '',
        isCollapsed: true
      }
    })
  }

  // Computed available entities (excluding already attached ones, only for valid types)
  const availableEntitiesByType = computed(() => {
    const attachedIds = new Set(attachedEntities.value.map(e => e.id))
    const validTypes = validEntityTypes.value

    return validTypes.reduce((acc, type) => {
      const typeEntities = entities.value.filter(entity =>
        entity.type === type && !attachedIds.has(entity.id)
      )

      const searchQuery = entityGroups[type]?.searchQuery?.toLowerCase() || ''
      const filteredEntities = searchQuery
        ? typeEntities.filter(entity =>
            entity.name.toLowerCase().includes(searchQuery) ||
            entity.description?.toLowerCase().includes(searchQuery)
          )
        : typeEntities

      acc[type] = filteredEntities
      return acc
    }, {} as Record<string, EntityResponse[]>)
  })

  // Grouped attached entities (for display, only for valid types)
  const attachedEntitiesByType = computed(() => {
    const validTypes = validEntityTypes.value
    const grouped = validTypes.reduce((acc, type) => {
      acc[type] = attachedEntities.value.filter(entity => entity.type === type)
      return acc
    }, {} as Record<string, EntityResponse[]>)

    // Filter out empty groups
    return Object.fromEntries(
      Object.entries(grouped).filter(([_, entities]) => entities.length > 0)
    )
  })

  // Actions
  const loadEntities = async () => {
    isLoading.value = true
    error.value = null

    try {
      // Fetch schema first to determine valid entity types
      await fetchSchema()
      // Initialize entity groups based on valid types
      initializeEntityGroups()
      // Then fetch entities
      await fetchEntities()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load entities'
    } finally {
      isLoading.value = false
    }
  }

  const setSearchQuery = (entityType: string, query: string) => {
    if (entityGroups[entityType]) {
      entityGroups[entityType].searchQuery = query
    }
  }

  const toggleGroupCollapse = (entityType: string) => {
    if (entityGroups[entityType]) {
      entityGroups[entityType].isCollapsed = !entityGroups[entityType].isCollapsed
    }
  }

  const attachEntity = (entity: EntityResponse) => {
    if (!attachedEntities.value.find(e => e.id === entity.id)) {
      attachedEntities.value.push(entity)
    }
  }

  const detachEntity = (entityId: number) => {
    const index = attachedEntities.value.findIndex(e => e.id === entityId)
    if (index !== -1) {
      attachedEntities.value.splice(index, 1)
    }
  }

  const validateEntity = (): string | null => {
    if (!newEntity.name.trim()) {
      return 'Entity name is required'
    }
    if (newEntity.name.trim().length < 2) {
      return 'Entity name must be at least 2 characters long'
    }
    return null
  }

  const checkSimilarIngredients = async (ingredientName: string): Promise<SimilarIngredientResponse[]> => {
    try {
      const response = await ApiService.findSimilarIngredients({
        ingredientName,
        topK: 5
      })
      return response
    } catch (err) {
      console.error('Error checking similar ingredients:', err)
      return []
    }
  }

  const saveEntity = async () => {
    const validationError = validateEntity()
    if (validationError) {
      error.value = validationError
      return
    }

    // Check for similar ingredients if creating an Ingredient
    if (newEntity.type === 'Ingredient') {
      isCheckingSimilarity.value = true
      showSimilarityModal.value = true
      pendingIngredientName.value = newEntity.name.trim()
      isCreatingFromSearch.value = false

      try {
        const similar = await checkSimilarIngredients(newEntity.name.trim())
        similarIngredients.value = similar

        if (similar.length > 0) {
          // Store the pending save data
          pendingSaveData.value = {
            entity: {
              name: newEntity.name.trim(),
              type: newEntity.type,
              description: newEntity.description.trim() || undefined
            },
            attachedEntities: [...attachedEntities.value]
          }
          return // Wait for user decision
        } else {
          // No similar ingredients found, proceed with save
          showSimilarityModal.value = false
          await performSave()
        }
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Failed to check for similar ingredients'
        showSimilarityModal.value = false
      } finally {
        isCheckingSimilarity.value = false
      }
    } else {
      // Not an ingredient, proceed with normal save
      await performSave()
    }
  }

  const performSave = async () => {
    isSaving.value = true
    error.value = null

    try {
      // Use pending save data if available, otherwise create from current state
      const saveData = pendingSaveData.value || {
        entity: {
          name: newEntity.name.trim(),
          type: newEntity.type,
          description: newEntity.description.trim() || undefined
        },
        attachedEntities: [...attachedEntities.value]
      }

      const createdEntity = await ApiService.createEntity(saveData.entity)

      // Create relationships
      const relationshipPromises = saveData.attachedEntities.map(attachedEntity =>
        ApiService.createRelationship(createdEntity.id, attachedEntity.id)
      )

      await Promise.all(relationshipPromises)

      // Clear pending save data
      pendingSaveData.value = null

      // Navigate back to predation view with the new entity's type selected
      router.push({
        name: 'predation',
        query: { tab: newEntity.type }
      })
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to save entity'
      throw err
    } finally {
      isSaving.value = false
    }
  }

  const cancel = () => {
    router.push({ name: 'predation' })
  }

  const clearError = () => {
    error.value = null
  }

  const handleSimilarityCancel = () => {
    showSimilarityModal.value = false
    pendingSaveData.value = null
    similarIngredients.value = []
  }

  const handleSimilarityContinue = async () => {
    showSimilarityModal.value = false
    if (isCreatingFromSearch.value) {
      // Create ingredient with just the name from search
      await createIngredientFromSearch()
    } else {
      // Normal save flow
      await performSave()
    }
  }

  const handleCreateIngredient = async (ingredientName: string) => {
    isCheckingSimilarity.value = true
    showSimilarityModal.value = true
    pendingIngredientName.value = ingredientName
    isCreatingFromSearch.value = true

    try {
      const similar = await checkSimilarIngredients(ingredientName)
      similarIngredients.value = similar

      if (similar.length === 0) {
        // No similar ingredients found, create directly
        showSimilarityModal.value = false
        await createIngredientFromSearch()
      }
      // If similar ingredients found, modal will stay open for user decision
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to check for similar ingredients'
      showSimilarityModal.value = false
    } finally {
      isCheckingSimilarity.value = false
    }
  }

  const handleUseSelectedIngredient = (selectedIngredient: EntityResponse) => {
    // Close the modal
    showSimilarityModal.value = false

    // Update the search query to the selected ingredient's name
    if (entityGroups['Ingredient']) {
      entityGroups['Ingredient'].searchQuery = selectedIngredient.name
    }

    // Reset state
    pendingIngredientName.value = ''
    isCreatingFromSearch.value = false
    similarIngredients.value = []
  }

  const createIngredientFromSearch = async () => {
    try {
      isSaving.value = true
      error.value = null

      const ingredientData: CreateEntityRequest = {
        name: pendingIngredientName.value,
        type: 'Ingredient'
        // No description or other data
      }

      const createdEntity = await ApiService.createEntity(ingredientData)

      // Refresh entities list
      await fetchEntities()

      // Update search to show the new ingredient
      if (entityGroups['Ingredient']) {
        entityGroups['Ingredient'].searchQuery = createdEntity.name
      }

      // Reset state
      pendingIngredientName.value = ''
      isCreatingFromSearch.value = false
      similarIngredients.value = []

    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create ingredient'
    } finally {
      isSaving.value = false
    }
  }

  return {
    // State
    newEntity,
    attachedEntities,
    entityGroups,
    availableEntitiesByType,
    attachedEntitiesByType,
    isLoading,
    isSaving,
    error,

    // Similarity check state
    showSimilarityModal,
    isCheckingSimilarity,
    similarIngredients,
    pendingIngredientName,
    isCreatingFromSearch,

    // Actions
    loadEntities,
    setSearchQuery,
    toggleGroupCollapse,
    attachEntity,
    detachEntity,
    saveEntity,
    cancel,
    clearError,
    validateEntity,
    handleSimilarityCancel,
    handleSimilarityContinue,
    handleCreateIngredient,
    handleUseSelectedIngredient,

    // Utilities
    getEntityTypeIcon,
    getEntityTypeColor,
    ENTITY_TYPES
  }
}
