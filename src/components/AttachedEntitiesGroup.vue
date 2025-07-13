<template>
  <div class="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
    <!-- Group Header -->
    <div class="flex items-center space-x-2 mb-3">
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

    <!-- Entities List -->
    <div class="space-y-2">
      <AttachedEntityItem
        v-for="entity in entities"
        :key="entity.id"
        :entity="entity"
        @detach="$emit('detach-entity', entity.id)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { EntityResponse } from '@/types/api'
import { usePredation } from '@/composables/usePredation'
import AttachedEntityItem from '@/components/AttachedEntityItem.vue'

interface Props {
  entityType: string
  entities: EntityResponse[]
}

defineProps<Props>()

defineEmits<{
  'detach-entity': [entityId: number]
}>()

const { getEntityTypeIcon, getEntityTypeColor } = usePredation()
</script>
