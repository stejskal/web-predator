import { ref, computed } from 'vue'
import ApiService from '@/services/api'
import type { SchemaResponse, RelationshipMatrix } from '@/types/api'

const schema = ref<SchemaResponse | null>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)

export function useSchema() {
  // Fetch schema data
  const fetchSchema = async () => {
    isLoading.value = true
    error.value = null

    try {
      schema.value = await ApiService.getSchema()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch schema'
      console.error('Error fetching schema:', err)
    } finally {
      isLoading.value = false
    }
  }

  // Get valid target entity types for a given source entity type
  const getValidTargetEntityTypes = (fromEntityType: string): string[] => {
    if (!schema.value) {
      return []
    }

    const validTargets = schema.value.relationshipMatrix
      .filter(relationship => relationship.fromEntityType === fromEntityType)
      .map(relationship => relationship.toEntityType)

    // Remove duplicates
    return [...new Set(validTargets)]
  }

  // Get all valid relationships from a source entity type to a target entity type
  const getValidRelationships = (fromEntityType: string, toEntityType: string): RelationshipMatrix[] => {
    if (!schema.value) return []

    return schema.value.relationshipMatrix.filter(
      relationship => 
        relationship.fromEntityType === fromEntityType && 
        relationship.toEntityType === toEntityType
    )
  }

  // Check if a relationship is valid between two entity types
  const isValidRelationship = (fromEntityType: string, toEntityType: string): boolean => {
    return getValidRelationships(fromEntityType, toEntityType).length > 0
  }

  // Get all entity types that can be created (have at least one outgoing relationship)
  const getCreatableEntityTypes = computed(() => {
    if (!schema.value) return []

    const creatableTypes = new Set<string>()
    schema.value.relationshipMatrix.forEach(relationship => {
      creatableTypes.add(relationship.fromEntityType)
    })

    return Array.from(creatableTypes)
  })

  const clearError = () => {
    error.value = null
  }

  return {
    // State
    schema,
    isLoading,
    error,

    // Computed
    getCreatableEntityTypes,

    // Actions
    fetchSchema,
    getValidTargetEntityTypes,
    getValidRelationships,
    isValidRelationship,
    clearError,
  }
}
