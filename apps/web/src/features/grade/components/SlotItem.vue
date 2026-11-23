<script setup lang="ts">
import { computed } from 'vue'
import type { Slot, SlotStatus } from '../services/grade.service'

// A seleção mora na página: o card só mostra se está marcado e avisa quando é tocado.
const props = withDefaults(defineProps<{ item: Slot; selected?: boolean }>(), { selected: false })

const emit = defineEmits<{ toggle: [] }>()

const LABELS: Record<SlotStatus, string> = {
  FREE: 'livre',
  HELD: 'em reserva',
  RESERVED: 'reservado',
  BLOCKED: 'bloqueado',
  UNAVAILABLE: 'indisponível',
}

const CARD = 'flex flex-col gap-xs rounded-lg border p-md'

// Em reserva, reservado, bloqueado ou já começado: card esmaecido no tom `desabilitado`
// (design-tokens) e sem botão, porque não reage ao toque (CA8).
const DISABLED_STYLE = 'border-desabilitado bg-desabilitado text-texto-suave'

// Livre: claro (`superficie`). Selecionado: escuro, fundo `texto` com letra `superficie`,
// como no protótipo ("Claro: livre · Escuro: selecionado").
const FREE_STYLE = 'border-desabilitado bg-superficie text-texto hover:border-primaria-escura'
const SELECTED_STYLE = 'border-texto bg-texto text-superficie'

const isFree = computed(() => props.item.status === 'FREE')

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
  <li data-test="slot" :class="isFree ? 'flex' : [CARD, DISABLED_STYLE]">
    <button
      v-if="isFree"
      type="button"
      data-test="slot-toggle"
      :aria-pressed="selected"
      class="w-full text-left focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primaria-escura"
      :class="[CARD, selected ? SELECTED_STYLE : FREE_STYLE]"
      @click="emit('toggle')"
    >
      <span class="block">
        <span class="text-titulo-card">{{ startsAt }}</span>
        <span class="text-legenda" :class="selected ? 'text-superficie' : 'text-texto-suave'">
          às {{ endsAt }}</span
        >
      </span>
      <span class="flex items-center gap-xs text-legenda">
        <!-- O selo verde é só preenchimento: a situação é dita pelo texto ao lado. -->
        <span aria-hidden="true" class="size-2 shrink-0 rounded-full bg-sucesso" />
        <span data-test="slot-status">{{ label }}</span>
      </span>
    </button>
    <template v-else>
      <p>
        <span class="text-titulo-card">{{ startsAt }}</span>
        <span class="text-legenda text-texto-suave"> às {{ endsAt }}</span>
      </p>
      <p class="text-legenda">
        <span data-test="slot-status">{{ label }}</span>
      </p>
    </template>
  </li>
</template>
