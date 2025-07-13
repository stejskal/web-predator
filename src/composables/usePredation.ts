import { ref, reactive, computed } from 'vue'
import { useEntities } from '@/composables/useEntities'
import { useSchema } from '@/composables/useSchema'
import ApiService from '@/services/api'
import type { EntityResponse } from '@/types/api'
import { ENTITY_TYPES } from '@/types/api'

interface ExpandedEntity {
  entity: EntityResponse
  isExpanded: boolean
  isLoadingRelationships: boolean
  relationships: EntityResponse[]
  expandedRelationships: Set<number>
}

const activeTab = ref<string>('Ingredient')
const searchQueries = reactive<Record<string, string>>({})
const expandedEntities = reactive<Map<number, ExpandedEntity>>(new Map())

export function usePredation() {
  const { entities, fetchEntities, isLoading } = useEntities()
  const { schema, fetchSchema } = useSchema()

  // Get dynamic entity types from schema, fallback to hardcoded list
  const dynamicEntityTypes = computed(() => {
    if (schema.value?.entities) {
      // Use the user's preferred ordering, but include all entities from schema
      const schemaTypes = schema.value.entities.map(entity => entity.type)
      const orderedTypes = ENTITY_TYPES.filter(type => schemaTypes.includes(type))
      const additionalTypes = schemaTypes.filter(type => !ENTITY_TYPES.includes(type))
      return [...orderedTypes, ...additionalTypes]
    }
    return ENTITY_TYPES
  })

  // Initialize search queries for all entity types
  const initializeSearchQueries = () => {
    dynamicEntityTypes.value.forEach(type => {
      if (!(type in searchQueries)) {
        searchQueries[type] = ''
      }
    })
  }

  // Computed properties for filtered entities by type
  const entitiesByType = computed(() => {
    const grouped: Record<string, EntityResponse[]> = {}

    dynamicEntityTypes.value.forEach(type => {
      const typeEntities = entities.value.filter(entity => entity.type === type)
      const searchQuery = searchQueries[type]?.toLowerCase() || ''

      grouped[type] = searchQuery
        ? typeEntities.filter(
            entity =>
              entity.name.toLowerCase().includes(searchQuery) ||
              entity.description?.toLowerCase().includes(searchQuery)
          )
        : typeEntities
    })

    return grouped
  })

  const currentEntities = computed(() => {
    return entitiesByType.value[activeTab.value] || []
  })

  // Entity expansion management
  const toggleEntityExpansion = async (entity: EntityResponse) => {
    const entityId = entity.id

    if (!expandedEntities.has(entityId)) {
      // First time expanding - create the expanded entity record
      expandedEntities.set(entityId, {
        entity,
        isExpanded: true,
        isLoadingRelationships: true,
        relationships: [],
        expandedRelationships: new Set(),
      })

      // Load relationships
      try {
        const relationships = await ApiService.getRelatedEntities(entityId)
        const expandedEntity = expandedEntities.get(entityId)
        if (expandedEntity) {
          // Update the entity with new data
          expandedEntities.set(entityId, {
            ...expandedEntity,
            relationships,
            isLoadingRelationships: false,
          })
        }
      } catch (error) {
        console.error('Failed to load relationships:', error)
        const expandedEntity = expandedEntities.get(entityId)
        if (expandedEntity) {
          // Update the entity to clear loading state
          expandedEntities.set(entityId, {
            ...expandedEntity,
            isLoadingRelationships: false,
          })
        }
      }
    } else {
      // Toggle expansion state
      const expandedEntity = expandedEntities.get(entityId)!
      expandedEntity.isExpanded = !expandedEntity.isExpanded
    }
  }

  const toggleRelationshipExpansion = async (
    parentEntityId: number,
    relationshipEntity: EntityResponse
  ) => {
    const relationshipId = relationshipEntity.id
    const parentExpanded = expandedEntities.get(parentEntityId)

    if (!parentExpanded) return

    if (parentExpanded.expandedRelationships.has(relationshipId)) {
      // Collapse relationship
      parentExpanded.expandedRelationships.delete(relationshipId)
      // Also remove the expanded entity data to save memory
      expandedEntities.delete(relationshipId)
    } else {
      // Expand relationship
      parentExpanded.expandedRelationships.add(relationshipId)

      // Always load relationships for this entity when expanding
      expandedEntities.set(relationshipId, {
        entity: relationshipEntity,
        isExpanded: true,
        isLoadingRelationships: true,
        relationships: [],
        expandedRelationships: new Set(),
      })

      try {
        const relationships = await ApiService.getRelatedEntities(relationshipId)
        const expandedEntity = expandedEntities.get(relationshipId)
        if (expandedEntity) {
          // Update the entity with new data
          expandedEntities.set(relationshipId, {
            ...expandedEntity,
            relationships,
            isLoadingRelationships: false,
          })
        }
      } catch (error) {
        console.error('Failed to load relationships for entity', relationshipId, ':', error)
        const expandedEntity = expandedEntities.get(relationshipId)
        if (expandedEntity) {
          // Update the entity to clear loading state
          expandedEntities.set(relationshipId, {
            ...expandedEntity,
            isLoadingRelationships: false,
          })
        }
      }
    }
  }

  const isEntityExpanded = (entityId: number): boolean => {
    return expandedEntities.get(entityId)?.isExpanded || false
  }

  const isRelationshipExpanded = (parentEntityId: number, relationshipId: number): boolean => {
    const parentExpanded = expandedEntities.get(parentEntityId)
    return parentExpanded?.expandedRelationships.has(relationshipId) || false
  }

  const getEntityRelationships = (entityId: number): EntityResponse[] => {
    return expandedEntities.get(entityId)?.relationships || []
  }

  const isLoadingRelationships = (entityId: number): boolean => {
    return expandedEntities.get(entityId)?.isLoadingRelationships || false
  }

  const setActiveTab = (tab: string) => {
    activeTab.value = tab
  }

  const setSearchQuery = (entityType: string, query: string) => {
    searchQueries[entityType] = query
  }

  const getSearchQuery = (entityType: string): string => {
    return searchQueries[entityType] || ''
  }

  const clearAllExpansions = () => {
    expandedEntities.clear()
  }

  // Entity type specific icons and colors
  const getEntityTypeIcon = (type: string): string => {
    const icons: Record<string, string> = {
      Ingredient: '🥬',
      Recipe: '📝',
      Meal: '🍽️',
      ShoppingList: '🛒',
      MealPlan: '📅',
      Cuisine: '🌍',
      StoreLocation: '🏪',
      Source: '📚',
    }
    return icons[type] || '📦'
  }

  const getEntityTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      Ingredient: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900',
      Recipe: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900',
      Meal: 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900',
      ShoppingList: 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900',
      MealPlan: 'text-indigo-600 bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-900',
      Cuisine: 'text-pink-600 bg-pink-100 dark:text-pink-400 dark:bg-pink-900',
      StoreLocation: 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900',
      Source: 'text-teal-600 bg-teal-100 dark:text-teal-400 dark:bg-teal-900',
    }
    return colors[type] || 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-800'
  }

  return {
    // State
    activeTab,
    searchQueries,
    expandedEntities,

    // Computed
    entitiesByType,
    currentEntities,

    // Actions
    toggleEntityExpansion,
    toggleRelationshipExpansion,
    isEntityExpanded,
    isRelationshipExpanded,
    getEntityRelationships,
    isLoadingRelationships,
    setActiveTab,
    setSearchQuery,
    getSearchQuery,
    clearAllExpansions,
    getEntityTypeIcon,
    getEntityTypeColor,

    // From useEntities
    fetchEntities,
    isLoading,

    // From useSchema
    fetchSchema,
    initializeSearchQueries,

    // Constants
    ENTITY_TYPES: dynamicEntityTypes,
  }
}
