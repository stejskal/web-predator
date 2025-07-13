<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4">
    <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
      Available Entities
    </h2>
    
    <div class="space-y-3">
      <EntityGroupSection
        v-for="entityType in availableEntityTypes"
        :key="entityType"
        :entity-type="entityType"
        :entities="availableEntities[entityType] || []"
        :search-query="entityGroups[entityType]?.searchQuery || ''"
        :is-collapsed="entityGroups[entityType]?.isCollapsed || false"
        @attach-entity="$emit('attach-entity', $event)"
        @search="(query) => $emit('search', entityType, query)"
        @toggle-collapse="$emit('toggle-collapse', entityType)"
        @create-ingredient="$emit('create-ingredient', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { EntityResponse } from '@/types/api'
import EntityGroupSection from '@/components/EntityGroupSection.vue'

interface EntityGroup {
  type: string
  entities: EntityResponse[]
  searchQuery: string
  isCollapsed: boolean
}

interface Props {
  availableEntities: Record<string, EntityResponse[]>
  entityGroups: Record<string, EntityGroup>
}

const props = defineProps<Props>()

defineEmits<{
  'attach-entity': [entity: EntityResponse]
  'search': [entityType: string, query: string]
  'toggle-collapse': [entityType: string]
  'create-ingredient': [ingredientName: string]
}>()

// Get only the entity types that have available entities or are in entityGroups
const availableEntityTypes = computed(() => {
  return Object.keys(props.entityGroups).filter(entityType => {
    const hasEntities = (props.availableEntities[entityType] || []).length > 0
    const hasGroup = props.entityGroups[entityType] !== undefined
    return hasGroup // Show group if it exists in entityGroups (which are filtered by schema)
  })
})
</script>
