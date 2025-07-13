<template>
  <div
    class="flex items-center space-x-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-grab active:cursor-grabbing transition-colors border-b border-gray-100 dark:border-gray-600 last:border-b-0"
    :class="{ 'dragging': isDragging }"
    draggable="true"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
    @click="$emit('attach')"
  >
    <!-- Drag Handle -->
    <div class="text-gray-400 dark:text-gray-500 text-xs">
      ⋮⋮
    </div>

    <!-- Entity Icon -->
    <div
      :class="[
        'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0',
        getEntityTypeColor(entity.type)
      ]"
    >
      <span class="text-xs">{{ getEntityTypeIcon(entity.type) }}</span>
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

    <!-- Add Button -->
    <button
      @click.stop="$emit('attach')"
      class="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors flex items-center justify-center text-xs"
      title="Add to entity"
    >
      +
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
  'attach': []
}>()

const { getEntityTypeIcon, getEntityTypeColor } = usePredation()

const isDragging = ref(false)

const handleDragStart = (event: DragEvent) => {
  isDragging.value = true
  if (event.dataTransfer) {
    event.dataTransfer.setData('application/json', JSON.stringify(props.entity))
    event.dataTransfer.effectAllowed = 'copy'
  }
}

const handleDragEnd = () => {
  isDragging.value = false
}
</script>
