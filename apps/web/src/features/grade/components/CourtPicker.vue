<script setup lang="ts">
import type { Court } from '../services/grade.service'

defineProps<{ courts: Court[]; selectedId: string | undefined }>()

const emit = defineEmits<{ select: [courtId: string] }>()
</script>

<template>
  <nav aria-label="Quadras" class="flex flex-wrap gap-sm">
    <button
      v-for="court in courts"
      :key="court.id"
      type="button"
      data-test="court"
      :aria-pressed="court.id === selectedId"
      class="rounded-lg px-lg py-sm font-semibold focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primaria-escura"
      :class="
        court.id === selectedId
          ? 'bg-primaria text-texto'
          : 'bg-superficie text-texto-suave ring-1 ring-desabilitado'
      "
      @click="emit('select', court.id)"
    >
      {{ court.name }}
    </button>
  </nav>
</template>
