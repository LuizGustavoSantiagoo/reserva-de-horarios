<script setup lang="ts">
import type { Slot } from '../services/grade.service'
import SlotItem from './SlotItem.vue'

defineProps<{ slots: Slot[] }>()
</script>

<template>
  <ul class="flex flex-col gap-lg">
    <SlotItem v-for="slot in slots" :key="slot.startsAt" :item="slot" />
  </ul>
</template>
