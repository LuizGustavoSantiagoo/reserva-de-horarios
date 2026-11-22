<script setup lang="ts">
import { onMounted, ref } from 'vue'
import CourtPicker from '../components/CourtPicker.vue'
import DayPicker from '../components/DayPicker.vue'
import SlotList from '../components/SlotList.vue'
import { getSlots, listCourts } from '../services/grade.service'
import type { Court, SlotGrid } from '../services/grade.service'

const courts = ref<Court[]>([])
const courtId = ref<string>()
const grid = ref<SlotGrid>()

// Sem dia escolhido, a grade é pedida sem `date`: o "hoje" é sempre o do servidor.
async function loadGrid(day?: string): Promise<void> {
  if (!courtId.value) return
  grid.value = await getSlots(courtId.value, day)
}

function selectCourt(id: string): void {
  courtId.value = id
  void loadGrid(grid.value?.date)
}

function selectDay(day: string): void {
  void loadGrid(day)
}

onMounted(async () => {
  courts.value = await listCourts()
  courtId.value = courts.value[0]?.id
  await loadGrid()
})
</script>

<template>
  <section class="mx-auto flex max-w-prose flex-col gap-lg p-lg sm:p-2xl">
    <h1 class="text-titulo-pagina">Horários</h1>
    <p v-if="!grid" class="text-legenda text-texto-suave">Carregando a grade…</p>
    <template v-else>
      <CourtPicker :courts="courts" :selected-id="courtId" @select="selectCourt" />
      <DayPicker :day="grid.date" @change="selectDay" />
      <SlotList :slots="grid.slots" />
    </template>
  </section>
</template>
