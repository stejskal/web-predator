<template>
  <div
    class="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-grab active:cursor-grabbing"
    :class="{ 'dragging': isDragging }"
    draggable="true"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
  >
    <!-- Drag Handle -->
    <div class="text-gray-400 dark:text-gray-500 text-xs">
      ⋮⋮
    </div>

    <!-- Entity Icon -->
    <div
      :class="[
        'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0',
        getEntityTypeColor(entity.type)
      ]"
    >
      <span class="text-sm">{{ getEntityTypeIcon(entity.type) }}</span>
    </div>

    <!-- Entity Info -->
    <div class="flex-1 min-w-0">
      <div class="text-sm font-medium text-gray-900 dark:text-white truncate">
        {{ entity.name }}
      </div>
      <div
        v-if="entity.description"
        class="text-xs text-gray-500 dark:text-gray-400 truncate"
      >
        {{ entity.description }}
      </div>
    </div>

    <!-- Remove Button -->
    <button
      @click="$emit('detach')"
      class="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-800 transition-colors flex items-center justify-center text-xs"
      title="Remove from entity"
    >
      ✕
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { EntityResponse } from '@/types/api'
import { usePredation } from '@/composables/usePredation'

interface Props {
  entity: EntityResponse
}

const props = defineProps<Props>()

defineEmits<{
  'detach': []
}>()

const { getEntityTypeIcon, getEntityTypeColor } = usePredation()

const isDragging = ref(false)

const handleDragStart = (event: DragEvent) => {
  isDragging.value = true
  if (event.dataTransfer) {
    event.dataTransfer.setData('application/json', JSON.stringify(props.entity))
    event.dataTransfer.effectAllowed = 'move'
  }
}

const handleDragEnd = () => {
  isDragging.value = false
}
</script>
