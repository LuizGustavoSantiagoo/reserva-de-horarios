<script setup lang="ts">
import { computed } from 'vue'

// O dia chega da API como `YYYY-MM-DD`. As contas são feitas em UTC sobre a data de
// calendário, sem passar pelo relógio nem pelo fuso do aparelho.
const props = defineProps<{ day: string }>()

const emit = defineEmits<{ change: [day: string] }>()

const dayFormat = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: '2-digit',
  month: '2-digit',
  timeZone: 'UTC',
})

function toUtcMs(day: string, offsetDays = 0): number {
  const [year = 0, month = 1, date = 1] = day.split('-').map(Number)
  return Date.UTC(year, month - 1, date + offsetDays)
}

function shift(offsetDays: number): string {
  return new Date(toUtcMs(props.day, offsetDays)).toISOString().slice(0, 10)
}

const label = computed(() => dayFormat.format(toUtcMs(props.day)))
</script>

<template>
  <div class="flex items-center justify-between gap-sm">
    <button
      type="button"
      aria-label="Dia anterior"
      class="rounded-lg px-md py-sm text-primaria-escura focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primaria-escura"
      @click="emit('change', shift(-1))"
    >
      ‹
    </button>
    <p class="text-titulo-card">{{ label }}</p>
    <button
      type="button"
      aria-label="Próximo dia"
      class="rounded-lg px-md py-sm text-primaria-escura focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primaria-escura"
      @click="emit('change', shift(1))"
    >
      ›
    </button>
  </div>
</template>
