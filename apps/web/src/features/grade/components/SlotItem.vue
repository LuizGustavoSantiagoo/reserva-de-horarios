<script setup lang="ts">
import { computed } from 'vue'
import type { Slot, SlotStatus } from '../services/grade.service'

const props = defineProps<{ item: Slot }>()

const LABELS: Record<SlotStatus, string> = {
  FREE: 'livre',
  BLOCKED: 'bloqueado',
}

const STYLES: Record<SlotStatus, string> = {
  FREE: 'border-sucesso',
  BLOCKED: 'border-desabilitado bg-desabilitado text-texto-suave',
}

// O horário é o da arena, não o do aparelho.
const hourFormat = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'America/Sao_Paulo',
})

const range = computed(
  () =>
    `${hourFormat.format(new Date(props.item.startsAt))} – ${hourFormat.format(new Date(props.item.endsAt))}`,
)
</script>

<template>
  <li
    data-test="slot"
    class="flex items-center justify-between rounded-lg border-l-4 p-md shadow-sm"
    :class="STYLES[item.status]"
  >
    <span class="text-titulo-card">{{ range }}</span>
    <span class="text-legenda">{{ LABELS[item.status] }}</span>
  </li>
</template>
