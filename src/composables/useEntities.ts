import { ref } from 'vue'
import ApiService from '@/services/api'
import type { EntityResponse } from '@/types/api'

const entities = ref<EntityResponse[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)

export function useEntities() {
  // Actions
  const fetchEntities = async () => {
    isLoading.value = true
    error.value = null

    try {
      entities.value = await ApiService.getAllEntities()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch entities'
      console.error('Error fetching entities:', err)
    } finally {
      isLoading.value = false
    }
  }

  const clearError = () => {
    error.value = null
  }

  return {
    // State
    entities,
    isLoading,
    error,

    // Actions
    fetchEntities,
    clearError,
  }
}
