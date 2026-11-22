<script setup lang="ts">
import { useId } from 'vue'
import type { Court } from '../services/grade.service'

defineProps<{ courts: Court[]; selectedId: string | undefined }>()

const emit = defineEmits<{ select: [courtId: string] }>()

const selectId = useId()

function onChange(event: Event): void {
  emit('select', (event.target as HTMLSelectElement).value)
}
</script>

<template>
  <div class="flex flex-col gap-sm">
    <label :for="selectId" class="text-corpo">Quadra</label>
    <select
      :id="selectId"
      :value="selectedId"
      class="h-11 w-full rounded-lg border border-desabilitado bg-superficie px-md text-corpo text-texto focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primaria-escura"
      @change="onChange"
    >
      <option v-for="court in courts" :key="court.id" :value="court.id">
        {{ court.name }}
      </option>
    </select>
  </div>
</template>
