<script setup lang="ts">
import { computed } from 'vue'
import type { Slot, SlotStatus } from '../services/grade.service'

const props = defineProps<{ item: Slot }>()

const LABELS: Record<SlotStatus, string> = {
  FREE: 'livre',
  HELD: 'em reserva',
  RESERVED: 'reservado',
  BLOCKED: 'bloqueado',
  UNAVAILABLE: 'indisponível',
}

// Em reserva, reservado, bloqueado ou já começado: card esmaecido no tom `desabilitado` (design-tokens).
const DISABLED_STYLE = 'border-desabilitado bg-desabilitado text-texto-suave'

const STYLES: Record<SlotStatus, string> = {
  FREE: 'border-desabilitado bg-superficie text-texto',
  HELD: DISABLED_STYLE,
  RESERVED: DISABLED_STYLE,
  BLOCKED: DISABLED_STYLE,
  UNAVAILABLE: DISABLED_STYLE,
}

// O horário é o da arena, não o do aparelho.
const hourFormat = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'America/Sao_Paulo',
})

const startsAt = computed(() => hourFormat.format(new Date(props.item.startsAt)))
const endsAt = computed(() => hourFormat.format(new Date(props.item.endsAt)))

// No reservado, o primeiro nome vem na segunda linha, como no protótipo.
const label = computed(() =>
  props.item.status === 'RESERVED' && props.item.firstName
    ? `${LABELS.RESERVED} · ${props.item.firstName}`
    : LABELS[props.item.status],
)
</script>

<template>
  <li
    data-test="slot"
    class="flex flex-col gap-xs rounded-lg border p-md"
    :class="STYLES[item.status]"
  >
    <p>
      <span class="text-titulo-card">{{ startsAt }}</span>
      <span class="text-legenda text-texto-suave"> às {{ endsAt }}</span>
    </p>
    <p class="flex items-center gap-xs text-legenda">
      <!-- O selo verde é só preenchimento: a situação é dita pelo texto ao lado. -->
      <span
        v-if="item.status === 'FREE'"
        aria-hidden="true"
        class="size-2 shrink-0 rounded-full bg-sucesso"
      />
      <span data-test="slot-status">{{ label }}</span>
    </p>
  </li>
</template>
