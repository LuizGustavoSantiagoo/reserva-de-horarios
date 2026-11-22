<script setup lang="ts">
import { computed, useId } from 'vue'

// O dia chega da API como `YYYY-MM-DD`. As contas são feitas em UTC sobre a data de
// calendário, sem passar pelo relógio nem pelo fuso do aparelho.
const props = defineProps<{ day: string }>()

const emit = defineEmits<{ change: [day: string] }>()

/** Quantos dias a faixa mostra, a partir do escolhido (os dois últimos só a partir de `sm`). */
const STRIP_SIZE = 5
const MOBILE_STRIP_SIZE = 3

const labelId = useId()

const longFormat = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
})
const weekdayFormat = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', timeZone: 'UTC' })
const monthFormat = new Intl.DateTimeFormat('pt-BR', { month: 'short', timeZone: 'UTC' })

function toUtcMs(day: string, offsetDays = 0): number {
  const [year = 0, month = 1, date = 1] = day.split('-').map(Number)
  return Date.UTC(year, month - 1, date + offsetDays)
}

function shift(offsetDays: number): string {
  return new Date(toUtcMs(props.day, offsetDays)).toISOString().slice(0, 10)
}

// "dom." → "dom": o ponto da abreviação não acrescenta nada no card.
function short(format: Intl.DateTimeFormat, ms: number): string {
  return format.format(ms).replace('.', '')
}

const strip = computed(() =>
  Array.from({ length: STRIP_SIZE }, (_, offset) => {
    const ms = toUtcMs(props.day, offset)
    return {
      day: shift(offset),
      label: longFormat.format(ms),
      weekday: short(weekdayFormat, ms),
      date: new Date(ms).getUTCDate(),
      month: short(monthFormat, ms),
      isChosen: offset === 0,
      onlyWide: offset >= MOBILE_STRIP_SIZE,
    }
  }),
)

const arrowClass =
  'flex size-11 shrink-0 items-center justify-center rounded-lg border border-desabilitado bg-superficie text-titulo-card text-texto hover:border-primaria-escura focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primaria-escura'
</script>

<template>
  <div class="flex flex-col gap-sm">
    <span :id="labelId" class="text-corpo">Dia</span>
    <div role="group" :aria-labelledby="labelId" class="flex items-center gap-sm">
      <button
        type="button"
        aria-label="Dia anterior"
        :class="arrowClass"
        @click="emit('change', shift(-1))"
      >
        ‹
      </button>
      <button
        v-for="item in strip"
        :key="item.day"
        type="button"
        data-test="day"
        :aria-label="item.label"
        :aria-pressed="item.isChosen"
        :aria-current="item.isChosen ? 'date' : undefined"
        class="min-w-0 flex-1 flex-col items-center rounded-lg border px-xs py-sm text-texto focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primaria-escura"
        :class="[
          item.onlyWide ? 'hidden sm:flex' : 'flex',
          item.isChosen
            ? 'border-primaria bg-primaria'
            : 'border-desabilitado bg-superficie hover:border-primaria-escura',
        ]"
        @click="emit('change', item.day)"
      >
        <span class="text-legenda capitalize">{{ item.weekday }}</span>
        <span class="flex items-baseline gap-xs">
          <span class="text-titulo-card">{{ item.date }}</span>
          <span class="text-legenda">{{ item.month }}</span>
        </span>
      </button>
      <button
        type="button"
        aria-label="Próximo dia"
        :class="arrowClass"
        @click="emit('change', shift(1))"
      >
        ›
      </button>
    </div>
  </div>
</template>
