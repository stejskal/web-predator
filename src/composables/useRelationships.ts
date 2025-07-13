import { ref } from 'vue'
import ApiService from '@/services/api'
import type { EntityResponse } from '@/types/api'

const relatedEntities = ref<EntityResponse[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)

export function useRelationships() {
  const fetchRelatedEntities = async (entityId: number) => {
    isLoading.value = true
    error.value = null

    try {
      relatedEntities.value = await ApiService.getRelatedEntities(entityId)
      return relatedEntities.value
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch related entities'
      console.error('Error fetching related entities:', err)
      return []
    } finally {
      isLoading.value = false
    }
  }

  const createRelationship = async (fromId: number, toId: number) => {
    isLoading.value = true
    error.value = null

    try {
      await ApiService.createRelationship(fromId, toId)
      // Refresh related entities after creating relationship
      await fetchRelatedEntities(fromId)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create relationship'
      console.error('Error creating relationship:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const deleteRelationship = async (fromId: number, toId: number) => {
    isLoading.value = true
    error.value = null

    try {
      await ApiService.deleteRelationship(fromId, toId)
      // Remove from local state
      relatedEntities.value = relatedEntities.value.filter(entity => entity.id !== toId)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete relationship'
      console.error('Error deleting relationship:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const clearError = () => {
    error.value = null
  }

  const clearRelatedEntities = () => {
    relatedEntities.value = []
  }

  return {
    // State
    relatedEntities,
    isLoading,
    error,

    // Actions
    fetchRelatedEntities,
    createRelationship,
    deleteRelationship,
    clearError,
    clearRelatedEntities,
  }
}
