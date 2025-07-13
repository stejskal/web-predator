<template>
  <div class="space-y-6">
    <!-- Entity Details Card -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">
        Entity Details
      </h2>
      
      <div class="space-y-4">
        <!-- Name Field -->
        <div>
          <label for="entity-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Name *
          </label>
          <input
            id="entity-name"
            v-model="entity.name"
            type="text"
            required
            placeholder="Enter entity name..."
            class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <!-- Description Field -->
        <div>
          <label for="entity-description" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description
          </label>
          <textarea
            id="entity-description"
            v-model="entity.description"
            rows="3"
            placeholder="Enter entity description..."
            class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          ></textarea>
        </div>

        <!-- Entity Type Display -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Type
          </label>
          <div class="flex items-center space-x-2">
            <div
              :class="[
                'w-8 h-8 rounded-full flex items-center justify-center',
                getEntityTypeColor(entity.type)
              ]"
            >
              <span class="text-lg">{{ getEntityTypeIcon(entity.type) }}</span>
            </div>
            <span class="text-lg font-medium text-gray-900 dark:text-white">
              {{ entity.type }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Attached Entities Card -->
    <div
      ref="dropZone"
      class="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors"
      :class="{ 'drag-over': isDragOver }"
      @dragover.prevent="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
    >
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
          Related Entities
        </h2>
        <span class="text-sm text-gray-500 dark:text-gray-400">
          {{ totalAttachedCount }} attached
        </span>
      </div>

      <!-- Drop Zone -->
      <div
        v-if="totalAttachedCount === 0"
        class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center"
      >
        <div class="text-gray-400 dark:text-gray-500 mb-2">
          📦
        </div>
        <p class="text-gray-500 dark:text-gray-400 text-sm">
          Drag entities from the sidebar or click the + button to add relationships
        </p>
      </div>

      <!-- Attached Entities List -->
      <div v-else class="space-y-4">
        <AttachedEntitiesGroup
          v-for="(entities, entityType) in attachedEntities"
          :key="entityType"
          :entity-type="entityType"
          :entities="entities"
          @detach-entity="$emit('detach-entity', $event)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { EntityResponse } from '@/types/api'
import { usePredation } from '@/composables/usePredation'
import AttachedEntitiesGroup from '@/components/AttachedEntitiesGroup.vue'

interface NewEntity {
  name: string
  type: string
  description: string
}

interface Props {
  entity: NewEntity
  attachedEntities: Record<string, EntityResponse[]>
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:entity': [entity: NewEntity]
  'detach-entity': [entityId: number]
  'attach-entity': [entity: EntityResponse]
}>()

const { getEntityTypeIcon, getEntityTypeColor } = usePredation()

// Refs
const dropZone = ref<HTMLElement>()
const isDragOver = ref(false)

// Computed properties
const totalAttachedCount = computed(() => {
  return Object.values(props.attachedEntities).reduce((total, entities) => total + entities.length, 0)
})

// Drag and drop handlers
const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = true
}

const handleDragLeave = (event: DragEvent) => {
  // Only set to false if we're leaving the drop zone entirely
  if (dropZone.value && !dropZone.value.contains(event.relatedTarget as Node)) {
    isDragOver.value = false
  }
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = false

  if (event.dataTransfer) {
    try {
      const entityData = event.dataTransfer.getData('application/json')
      const entity: EntityResponse = JSON.parse(entityData)

      // Emit attach event to parent
      emit('attach-entity', entity)
    } catch (error) {
      console.error('Error parsing dropped entity data:', error)
    }
  }
}
</script>
