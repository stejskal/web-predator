<template>
  <div class="border border-gray-200 dark:border-gray-600 rounded-lg">
    <!-- Group Header -->
    <div
      class="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      @click="$emit('toggle-collapse')"
    >
      <div class="flex items-center space-x-2">
        <div
          :class="[
            'w-6 h-6 rounded-full flex items-center justify-center',
            getEntityTypeColor(entityType)
          ]"
        >
          <span class="text-sm">{{ getEntityTypeIcon(entityType) }}</span>
        </div>
        <h3 class="font-medium text-gray-900 dark:text-white">
          {{ entityType }}
        </h3>
        <span class="text-sm text-gray-500 dark:text-gray-400">
          ({{ entities.length }})
        </span>
      </div>
      
      <div class="flex items-center space-x-2">
        <span
          class="text-gray-400 dark:text-gray-500 transition-transform"
          :class="{ 'rotate-180': !isCollapsed }"
        >
          ▼
        </span>
      </div>
    </div>

    <!-- Group Content -->
    <div v-if="!isCollapsed" class="border-t border-gray-200 dark:border-gray-600">
      <!-- Search Box -->
      <div class="p-3 border-b border-gray-200 dark:border-gray-600">
        <div class="space-y-2">
          <input
            :value="searchQuery"
            @input="$emit('search', ($event.target as HTMLInputElement).value)"
            type="text"
            :placeholder="`Search ${entityType.toLowerCase()}...`"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          <!-- Create Ingredient Button (only for Ingredient type) -->
          <button
            v-if="entityType === 'Ingredient' && searchQuery.trim().length > 0"
            @click="$emit('create-ingredient', searchQuery.trim())"
            class="w-full px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Create Ingredient
          </button>
        </div>
      </div>

      <!-- Entity List -->
      <div class="max-h-64 overflow-y-auto">
        <div v-if="entities.length === 0" class="p-3 text-center text-gray-500 dark:text-gray-400 text-sm">
          {{ searchQuery ? 'No matching entities found' : 'No entities available' }}
        </div>
        
        <DraggableEntityItem
          v-for="entity in entities"
          :key="entity.id"
          :entity="entity"
          @attach="$emit('attach-entity', entity)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { EntityResponse } from '@/types/api'
import { usePredation } from '@/composables/usePredation'
import DraggableEntityItem from '@/components/DraggableEntityItem.vue'

interface Props {
  entityType: string
  entities: EntityResponse[]
  searchQuery: string
  isCollapsed: boolean
}

defineProps<Props>()

defineEmits<{
  'attach-entity': [entity: EntityResponse]
  'search': [query: string]
  'toggle-collapse': []
  'create-ingredient': [ingredientName: string]
}>()

const { getEntityTypeIcon, getEntityTypeColor } = usePredation()
</script>
