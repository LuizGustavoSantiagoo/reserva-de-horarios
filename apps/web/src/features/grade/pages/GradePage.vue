<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { LocationQuery, LocationQueryRaw } from 'vue-router'
import CourtPicker from '../components/CourtPicker.vue'
import DayPicker from '../components/DayPicker.vue'
import SlotList from '../components/SlotList.vue'
import { getSlots, listCourts } from '../services/grade.service'
import type { Court, SlotGrid } from '../services/grade.service'
import { GradeRefusal } from '../services/grade-refusal'

// `undefined` enquanto a lista de quadras não chegou; `[]` quando não há quadra ativa.
const courts = ref<Court[]>()
const courtId = ref<string>()
const grid = ref<SlotGrid>()
// Link recusado pela API (CA11): quadra não encontrada ou dia inválido ou passado.
const refusal = ref<GradeRefusal>()

// A quadra e o dia moram na query (`?quadra=<id>&dia=YYYY-MM-DD`): o link abre a mesma grade,
// e trocar de quadra ou de dia só troca a query, sem montar a página de novo.
const route = useRoute()
const router = useRouter()

function queryText(query: LocationQuery, key: string): string | undefined {
  const value = query[key]
  return typeof value === 'string' && value !== '' ? value : undefined
}

function writeQuery(quadra: string, dia?: string): Promise<unknown> {
  const query: LocationQueryRaw = { ...route.query, quadra }
  if (dia) query.dia = dia
  else delete query.dia
  return router.replace({ query })
}

// O dia é uma data de calendário (`YYYY-MM-DD`): formatado em UTC, sem o fuso do aparelho.
const dayFormat = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
})

// O cabeçalho descreve a grade em exibição, não a quadra que ainda está carregando.
const courtName = computed(
  () => courts.value?.find((court) => court.id === grid.value?.courtId)?.name,
)
const dayLabel = computed(() =>
  grid.value ? dayFormat.format(new Date(`${grid.value.date}T00:00:00.000Z`)) : '',
)

// Sem dia escolhido, a grade é pedida sem `date`: o "hoje" é sempre o do servidor.
async function loadGrid(day?: string): Promise<void> {
  if (!courtId.value) return
  try {
    const loaded = await getSlots(courtId.value, day)
    grid.value = loaded
    refusal.value = undefined
    await writeQuery(loaded.courtId, loaded.date)
  } catch (error) {
    // Só a recusa do link é tratada aqui; a falha de rede ou do servidor é da Tarefa 10.
    if (error instanceof GradeRefusal) {
      grid.value = undefined
      refusal.value = error
      return
    }
    throw error
  }
}

// Volta para hoje: pede a grade sem `date` e tira o dia da URL. Se a recusa foi da quadra,
// pedir a mesma quadra de novo daria o mesmo 404; por isso volta para a primeira quadra ativa.
async function backToToday(): Promise<void> {
  if (refusal.value?.reason === 'court') {
    courtId.value = courts.value?.[0]?.id
  }
  if (!courtId.value) return
  await writeQuery(courtId.value)
  await loadGrid()
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
  if (courts.value.length === 0) return
  courtId.value = queryText(route.query, 'quadra') ?? courts.value[0]?.id
  await loadGrid(queryText(route.query, 'dia'))
})
</script>

<template>
  <div class="mx-auto flex max-w-(--container-6xl) flex-col gap-xl p-lg sm:p-2xl">
    <header class="flex flex-col gap-sm">
      <p class="text-legenda text-texto-suave uppercase">Reserve seu jogo</p>
      <h1 class="text-titulo-pagina">Escolha seus horários</h1>
      <p class="text-corpo text-texto-suave">Escolha a quadra e o dia para ver o que está livre.</p>
    </header>
    <p v-if="courts?.length === 0" class="text-legenda text-texto-suave">
      Nenhuma quadra disponível.
    </p>
    <div v-else-if="refusal" role="alert" class="flex flex-col items-start gap-lg">
      <p class="text-corpo text-perigo">{{ refusal.message }}</p>
      <button
        type="button"
        data-test="back-to-today"
        class="min-h-11 rounded-lg bg-primaria px-lg text-corpo font-semibold text-texto hover:bg-primaria-escura hover:text-superficie focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primaria-escura"
        @click="backToToday"
      >
        Voltar para hoje
      </button>
    </div>
    <p v-else-if="!courts || !grid" class="text-legenda text-texto-suave">Carregando a grade…</p>
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
        <DayPicker
          class="min-w-0 lg:flex-1"
          :day="grid.date"
          :today="grid.today"
          @change="selectDay"
        />
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
