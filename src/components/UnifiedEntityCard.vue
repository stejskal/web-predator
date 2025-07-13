<template>
  <div 
    :class="[
      depth === 0 ? 'card border-l-4' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded overflow-hidden',
      depth === 0 ? getBorderColor(entity.type) : ''
    ]"
  >
    <!-- Entity Header -->
    <div
      :class="[
        'flex items-center transition-colors',
        depth === 0 ? 'justify-between -m-6 p-6 rounded-xl' : 'space-x-2 p-2',
        isExpandable ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700' : 'cursor-default'
      ]"
      @click="isExpandable ? handleEntityClick() : undefined"
    >
      <div :class="['flex items-center flex-1', depth === 0 ? 'space-x-4' : 'space-x-2']">
        <!-- Entity Icon -->
        <div class="flex-shrink-0">
          <div
            :class="[
              'rounded-full flex items-center justify-center',
              getIconSize(),
              getEntityTypeColor(entity.type)
            ]"
          >
            <span :class="getIconTextSize()">{{ getEntityTypeIcon(entity.type) }}</span>
          </div>
        </div>

        <!-- Entity Info -->
        <div class="flex-1 min-w-0">
          <div :class="['flex items-center', depth === 0 ? 'space-x-2' : 'space-x-1']">
            <h3 
              :class="[
                'font-semibold text-gray-900 dark:text-white truncate',
                getNameTextSize()
              ]"
            >
              {{ entity.name }}
            </h3>
            <span
              v-if="depth === 0"
              :class="[
                'inline-flex px-2 py-1 text-xs font-medium rounded-full',
                getEntityTypeColor(entity.type)
              ]"
            >
              {{ entity.type }}
            </span>
          </div>
          <p
            v-if="entity.description"
            :class="[
              'text-gray-600 dark:text-gray-300 mt-1',
              getDescriptionTextSize(),
              depth === 0 ? 'line-clamp-2' : 'truncate'
            ]"
          >
            {{ entity.description }}
          </p>
        </div>

        <!-- Expansion Indicator -->
        <div v-if="isExpandable" class="flex-shrink-0">
          <div :class="['flex items-center justify-center', getExpandIconSize()]">
            <span
              :class="[
                'transform transition-transform duration-200',
                getExpandIconTextSize(),
                isExpanded ? 'rotate-90' : ''
              ]"
            >
              ▶
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Properties Section (only at depth 0 when expanded) -->
    <div
      v-if="depth === 0 && isExpanded && Object.keys(entity.properties).length > 0"
      class="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700"
    >
      <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Properties</h4>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div
          v-for="[key, value] in Object.entries(entity.properties)"
          :key="key"
          class="flex justify-between text-sm"
        >
          <span class="text-gray-500 dark:text-gray-400 capitalize">{{ key }}:</span>
          <span class="text-gray-700 dark:text-gray-300 font-medium">{{
            formatPropertyValue(value)
          }}</span>
        </div>
      </div>
    </div>

    <!-- Relationships Section (when expanded) -->
    <div v-if="isExpanded && (depth > 0 || relationships.length > 0)" :class="getRelationshipsContainerClass()">
      <!-- Loading State -->
      <div
        v-if="isLoadingRelationships"
        class="flex items-center justify-center py-4"
      >
        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
        <span :class="['text-gray-500 dark:text-gray-400 ml-2', getLoadingTextSize()]">
          Loading relationships...
        </span>
      </div>

      <!-- Relationships Content -->
      <div v-else-if="groupedRelationships.length > 0" :class="getRelationshipsContentClass()">
        <div
          v-if="depth > 0"
          :class="['text-gray-500 dark:text-gray-400 mb-2', getRelationshipHeaderTextSize()]"
        >
          Relationships of {{ entity.name }}:
        </div>
        
        <div
          v-for="group in groupedRelationships"
          :key="group.type"
          :class="getGroupSpacing()"
        >
          <!-- Group Header -->
          <div :class="['flex items-center space-x-2 mb-2', getGroupHeaderClass()]">
            <div
              :class="[
                'rounded-full flex items-center justify-center',
                getGroupIconSize(),
                getEntityTypeColor(group.type)
              ]"
            >
              <span :class="getGroupIconTextSize()">{{ getEntityTypeIcon(group.type) }}</span>
            </div>
            <span :class="['font-medium text-gray-700 dark:text-gray-300', getGroupHeaderTextSize()]">
              {{ group.type }}s ({{ group.relationships.length }})
            </span>
          </div>

          <!-- Relationships in this group -->
          <div :class="['space-y-1', getGroupContentMargin()]">
            <div
              v-for="relationshipEntity in group.relationships"
              :key="relationshipEntity.id"
            >
              <!-- Nested Entity Card -->
              <UnifiedEntityCard
                :entity="relationshipEntity"
                :depth="depth + 1"
                :parent-entity-id="depth === 0 ? entity.id : parentEntityId"
                :is-expanded="isEntityExpanded(relationshipEntity.id)"
                :is-loading-relationships="globalIsLoadingRelationships(relationshipEntity.id)"
                :relationships="getEntityRelationships(relationshipEntity.id)"
                :expanded-relationships="getExpandedRelationships(relationshipEntity.id)"
                @toggle-expansion="entity => emit('toggle-expansion', entity)"
                @toggle-relationship="(parentId, entity) => emit('toggle-relationship', parentId, entity)"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- No Relationships -->
      <div v-else :class="getNoRelationshipsClass()">
        <span :class="['text-gray-400 dark:text-gray-500', getNoRelationshipsIconSize()]">🔗</span>
        <p :class="['text-gray-500 dark:text-gray-400 mt-1', getNoRelationshipsTextSize()]">
          {{ depth === 0 ? 'No relationships found' : 'No relationships' }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { EntityResponse } from '@/types/api'
import { ENTITY_TYPES } from '@/types/api'
import { usePredation } from '@/composables/usePredation'

interface Props {
  entity: EntityResponse
  depth?: number
  parentEntityId?: number
  isExpanded: boolean
  isLoadingRelationships: boolean
  relationships: EntityResponse[]
  expandedRelationships: Set<number>
}

const props = withDefaults(defineProps<Props>(), {
  depth: 0,
  parentEntityId: undefined
})

const {
  getEntityTypeIcon,
  getEntityTypeColor,
  getEntityRelationships,
  isLoadingRelationships: globalIsLoadingRelationships,
  isEntityExpanded,
  isRelationshipExpanded: globalIsRelationshipExpanded,
  expandedEntities
} = usePredation()

// Check if entity should be expandable based on relationship count
const isExpandable = computed(() => {
  return props.entity.relatedEntitiesCount > 0
})

// Handle entity click based on depth
const emit = defineEmits<{
  'toggle-expansion': [entity: EntityResponse]
  'toggle-relationship': [parentEntityId: number, entity: EntityResponse]
}>()

const handleEntityClick = () => {
  if (props.depth === 0) {
    emit('toggle-expansion', props.entity)
  } else {
    emit('toggle-relationship', props.parentEntityId!, props.entity)
  }
}

// Get relationships based on depth and props
const currentRelationships = computed(() => {
  if (props.depth === 0) {
    return props.relationships
  } else {
    return getEntityRelationships(props.entity.id)
  }
})

// Check if relationship is expanded
const isRelationshipExpanded = (relationshipId: number): boolean => {
  if (props.depth === 0) {
    return props.expandedRelationships.has(relationshipId)
  } else {
    return globalIsRelationshipExpanded(props.entity.id, relationshipId)
  }
}

// Get expanded relationships for an entity
const getExpandedRelationships = (entityId: number): Set<number> => {
  return expandedEntities.get(entityId)?.expandedRelationships || new Set()
}

// Group relationships by type in the specified order
const groupedRelationships = computed(() => {
  const groups: Array<{ type: string; relationships: EntityResponse[] }> = []
  const relationships = currentRelationships.value

  // Group relationships by type according to ENTITY_TYPES order
  ENTITY_TYPES.forEach(entityType => {
    const relationshipsOfType = relationships.filter(rel => rel.type === entityType)
    if (relationshipsOfType.length > 0) {
      groups.push({
        type: entityType,
        relationships: relationshipsOfType,
      })
    }
  })

  return groups
})

// Depth-based styling functions
const getIconSize = () => {
  switch (props.depth) {
    case 0: return 'w-10 h-10'
    case 1: return 'w-6 h-6'
    default: return 'w-5 h-5'
  }
}

const getIconTextSize = () => {
  switch (props.depth) {
    case 0: return 'text-lg'
    case 1: return 'text-xs'
    default: return 'text-xs'
  }
}

const getNameTextSize = () => {
  switch (props.depth) {
    case 0: return 'text-lg'
    case 1: return 'text-sm'
    default: return 'text-sm'
  }
}

const getDescriptionTextSize = () => {
  switch (props.depth) {
    case 0: return 'text-sm'
    case 1: return 'text-xs'
    default: return 'text-xs'
  }
}

const getExpandIconSize = () => {
  return 'w-6 h-6'
}

const getExpandIconTextSize = () => {
  switch (props.depth) {
    case 0: return ''
    default: return 'text-xs'
  }
}

const getLoadingTextSize = () => {
  switch (props.depth) {
    case 0: return 'text-sm'
    default: return 'text-xs'
  }
}

const getRelationshipHeaderTextSize = () => {
  return 'text-xs'
}

const getGroupHeaderTextSize = () => {
  switch (props.depth) {
    case 0: return 'text-sm'
    default: return 'text-xs'
  }
}

const getGroupIconSize = () => {
  switch (props.depth) {
    case 0: return 'w-5 h-5'
    default: return 'w-4 h-4'
  }
}

const getGroupIconTextSize = () => {
  return 'text-xs'
}

const getNoRelationshipsIconSize = () => {
  switch (props.depth) {
    case 0: return 'text-2xl'
    default: return 'text-lg'
  }
}

const getNoRelationshipsTextSize = () => {
  switch (props.depth) {
    case 0: return 'text-sm'
    default: return 'text-xs'
  }
}

// Container and layout styling functions
const getRelationshipsContainerClass = () => {
  if (props.depth === 0) {
    return 'mt-6 pt-6 border-t border-gray-100 dark:border-gray-700'
  } else {
    return 'p-3'
  }
}

const getRelationshipsContentClass = () => {
  switch (props.depth) {
    case 0: return 'space-y-4'
    default: return 'space-y-2'
  }
}

const getGroupSpacing = () => {
  switch (props.depth) {
    case 0: return 'space-y-2'
    default: return 'space-y-1'
  }
}

const getGroupHeaderClass = () => {
  return ''
}

const getGroupContentMargin = () => {
  return 'ml-1'
}

const getNestedContentClass = () => {
  const baseClasses = 'border-t border-gray-200 dark:border-gray-600'
  switch (props.depth) {
    case 0: return `bg-gray-50 dark:bg-gray-700 ${baseClasses}`
    case 1: return `bg-gray-100 dark:bg-gray-800 ${baseClasses}`
    default: return `bg-gray-200 dark:bg-gray-900 ${baseClasses}`
  }
}

const getNoRelationshipsClass = () => {
  switch (props.depth) {
    case 0: return 'text-center py-4'
    default: return 'text-center py-2'
  }
}

// Utility functions
const getBorderColor = (type: string): string => {
  const colors: Record<string, string> = {
    Ingredient: 'border-green-500',
    Recipe: 'border-blue-500',
    Meal: 'border-purple-500',
    ShoppingList: 'border-yellow-500',
    MealPlan: 'border-indigo-500',
    Cuisine: 'border-pink-500',
    StoreLocation: 'border-orange-500',
  }
  return colors[type] || 'border-gray-500'
}

const formatPropertyValue = (value: any): string => {
  if (typeof value === 'string') return value
  if (typeof value === 'number') return value.toString()
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (Array.isArray(value)) return `[${value.length} items]`
  if (typeof value === 'object') return '[Object]'
  return String(value)
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
