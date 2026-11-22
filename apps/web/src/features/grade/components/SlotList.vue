<script setup lang="ts">
import type { Slot } from '../services/grade.service'
import SlotItem from './SlotItem.vue'

defineProps<{ slots: Slot[] }>()
</script>

<template>
  <!-- Mobile first: 2 colunas no celular, 3 a partir de `sm`, 5 em tela larga. -->
  <p v-if="slots.length === 0" class="text-legenda text-texto-suave">
    Não há horários neste dia.
  </p>
  <ul v-else class="grid grid-cols-2 gap-lg sm:grid-cols-3 lg:grid-cols-5">
    <SlotItem v-for="slot in slots" :key="slot.startsAt" :item="slot" />
  </ul>
</template>
