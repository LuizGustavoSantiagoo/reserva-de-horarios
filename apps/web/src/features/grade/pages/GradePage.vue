<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import CourtPicker from '../components/CourtPicker.vue'
import DayPicker from '../components/DayPicker.vue'
import SlotList from '../components/SlotList.vue'
import { getSlots, listCourts } from '../services/grade.service'
import type { Court, SlotGrid } from '../services/grade.service'

const courts = ref<Court[]>([])
const courtId = ref<string>()
const grid = ref<SlotGrid>()

// O dia é uma data de calendário (`YYYY-MM-DD`): formatado em UTC, sem o fuso do aparelho.
const dayFormat = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
})

// O cabeçalho descreve a grade em exibição, não a quadra que ainda está carregando.
const courtName = computed(
  () => courts.value.find((court) => court.id === grid.value?.courtId)?.name,
)
const dayLabel = computed(() =>
  grid.value ? dayFormat.format(new Date(`${grid.value.date}T00:00:00.000Z`)) : '',
)

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
  <div class="mx-auto flex max-w-(--container-6xl) flex-col gap-xl p-lg sm:p-2xl">
    <header class="flex flex-col gap-sm">
      <p class="text-legenda text-texto-suave uppercase">Reserve seu jogo</p>
      <h1 class="text-titulo-pagina">Escolha seus horários</h1>
      <p class="text-corpo text-texto-suave">Escolha a quadra e o dia para ver o que está livre.</p>
    </header>
    <p v-if="!grid" class="text-legenda text-texto-suave">Carregando a grade…</p>
    <section
      v-else
      aria-label="Grade de horários"
      class="flex flex-col gap-xl rounded-xl border border-desabilitado bg-superficie p-lg sm:p-xl"
    >
      <div class="flex flex-col gap-lg lg:flex-row lg:gap-xl">
        <CourtPicker
          class="lg:w-(--container-3xs) lg:shrink-0"
          :courts="courts"
          :selected-id="courtId"
          @select="selectCourt"
        />
        <DayPicker class="min-w-0 lg:flex-1" :day="grid.date" @change="selectDay" />
      </div>
      <hr class="border-desabilitado" />
      <div data-test="grid-heading" class="flex flex-col gap-xs">
        <h2 class="text-titulo-card">{{ courtName }}</h2>
        <p class="text-corpo text-texto-suave first-letter:uppercase">{{ dayLabel }}</p>
      </div>
      <SlotList :slots="grid.slots" />
    </section>
  </div>
</template>
