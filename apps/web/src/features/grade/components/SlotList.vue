<script setup lang="ts">
import type { Slot } from '../services/grade.service'
import SlotItem from './SlotItem.vue'

// `selected` traz o início (`startsAt`) dos horários marcados desta grade; a seleção mora na página.
withDefaults(defineProps<{ slots: Slot[]; selected?: ReadonlySet<string> }>(), {
  selected: () => new Set<string>(),
})

const emit = defineEmits<{ toggle: [startsAt: string] }>()
</script>

<template>
  <!-- Mobile first: 2 colunas no celular, 3 a partir de `sm`, 5 em tela larga. -->
  <p v-if="slots.length === 0" class="text-legenda text-texto-suave">Não há horários neste dia.</p>
  <ul v-else class="grid grid-cols-2 gap-lg sm:grid-cols-3 lg:grid-cols-5">
    <SlotItem
      v-for="slot in slots"
      :key="slot.startsAt"
      :item="slot"
      :selected="selected.has(slot.startsAt)"
      @toggle="emit('toggle', slot.startsAt)"
    />
  </ul>
</template>
