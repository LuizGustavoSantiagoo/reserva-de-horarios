<script setup lang="ts">
import { computed, onMounted, ref, useId } from 'vue'
import { useSession } from '@/shared/composables/useSession'
import {
  ArenaError,
  CreateCourtError,
  createCourt,
  getArena,
  type AdminCourt,
  type Arena,
  type CourtField,
} from '../services/courts.service'

const nameId = useId()
const session = useSession()

// Esconder o formulário é conforto: quem barra o Operador é a API (CA6, CA10).
const isAdmin = computed(() => session.profile.value?.role === 'ADMIN')

// `undefined` enquanto a arena não chegou.
const arena = ref<Arena>()
const loadError = ref<string>()

const name = ref('')
const submitting = ref(false)
const createdName = ref<string>()
const fieldErrors = ref<Partial<Record<CourtField, string>>>({})
const submitError = ref<string>()

const nameError = computed(() => fieldErrors.value.name)

// Falha de rede ou do servidor: a tela mostra o erro com Tentar de novo (CA9). O `401` o
// client já tratou, limpando a sessão e levando ao login.
async function loadArena(): Promise<void> {
  loadError.value = undefined
  try {
    arena.value = await getArena()
  } catch (error) {
    if (!(error instanceof ArenaError)) throw error
    loadError.value = error.message
  }
}

// A API devolve as quadras por nome (CA1); a recém-cadastrada entra no mesmo lugar em que
// a API a poria, sem reler a arena.
function byName(a: AdminCourt, b: AdminCourt): number {
  return a.name.localeCompare(b.name, 'pt-BR')
}

async function submit(): Promise<void> {
  if (submitting.value || !arena.value) return
  submitting.value = true
  createdName.value = undefined
  fieldErrors.value = {}
  submitError.value = undefined
  try {
    const { id, name: courtName, isActive } = await createCourt(name.value)
    arena.value.courts = [...arena.value.courts, { id, name: courtName, isActive }].sort(byName)
    createdName.value = courtName
    name.value = ''
  } catch (error) {
    if (!(error instanceof CreateCourtError)) throw error
    fieldErrors.value = error.fields
    // Sem campo apontado (rede, servidor), a mensagem vai acima do botão e o nome fica.
    if (!error.fields.name) submitError.value = error.message
  } finally {
    submitting.value = false
  }
}

onMounted(loadArena)
</script>

<template>
  <section aria-labelledby="quadras-titulo" class="flex flex-col gap-xl">
    <h1 id="quadras-titulo" class="text-titulo-pagina">Quadras</h1>
    <div
      v-if="loadError"
      role="alert"
      class="flex flex-col items-start gap-md rounded-xl border border-desabilitado bg-superficie p-lg sm:p-xl"
    >
      <p class="text-corpo text-perigo">{{ loadError }}</p>
      <button
        type="button"
        class="flex h-11 items-center justify-center rounded-lg bg-primaria px-lg text-corpo font-semibold text-texto hover:bg-primaria-escura hover:text-superficie focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primaria-escura"
        @click="loadArena"
      >
        Tentar de novo
      </button>
    </div>
    <p v-else-if="!arena" class="text-legenda text-texto-suave">Carregando as quadras…</p>
    <template v-else>
      <div
        data-test="arena"
        class="flex flex-col gap-xs rounded-xl border border-desabilitado bg-superficie p-lg sm:p-xl"
      >
        <p class="text-titulo-card">{{ arena.name }}</p>
        <p class="text-legenda text-texto-suave">{{ arena.address }}</p>
      </div>
      <p v-if="arena.courts.length === 0" class="text-legenda text-texto-suave">
        Nenhuma quadra cadastrada.
      </p>
      <ul
        v-else
        aria-label="Quadras da arena"
        class="flex flex-col divide-y divide-desabilitado rounded-xl border border-desabilitado bg-superficie"
      >
        <li
          v-for="court in arena.courts"
          :key="court.id"
          data-test="court"
          class="flex items-center justify-between gap-md p-lg"
        >
          <span class="text-corpo">{{ court.name }}</span>
          <span
            class="flex items-center gap-xs text-legenda"
            :class="court.isActive ? 'text-texto' : 'text-texto-suave'"
          >
            <span
              aria-hidden="true"
              class="size-2 shrink-0 rounded-full"
              :class="court.isActive ? 'bg-sucesso' : 'bg-desabilitado'"
            />
            {{ court.isActive ? 'Ativa' : 'Inativa' }}
          </span>
        </li>
      </ul>
      <!-- A validação é a da API (CA3): o navegador não barra o envio com a mensagem dele. -->
      <form
        v-if="isAdmin"
        novalidate
        aria-labelledby="nova-quadra-titulo"
        class="flex max-w-(--container-sm) flex-col gap-lg rounded-xl border border-desabilitado bg-superficie p-lg sm:p-xl"
        @submit.prevent="submit"
      >
        <h2 id="nova-quadra-titulo" class="text-titulo-card">Nova quadra</h2>
        <p
          v-if="createdName"
          role="status"
          class="rounded-lg border border-desabilitado p-md text-legenda text-texto"
        >
          Quadra {{ createdName }} cadastrada.
        </p>
        <div class="flex flex-col gap-sm">
          <label :for="nameId" class="text-corpo">Nome</label>
          <input
            :id="nameId"
            v-model="name"
            type="text"
            autocomplete="off"
            :aria-invalid="nameError ? true : undefined"
            :aria-describedby="nameError ? `${nameId}-erro` : undefined"
            class="h-11 w-full rounded-lg border border-desabilitado bg-superficie px-md text-corpo text-texto focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primaria-escura"
          />
          <p v-if="nameError" :id="`${nameId}-erro`" class="text-legenda text-perigo">
            {{ nameError }}
          </p>
        </div>
        <p v-if="submitError" role="alert" class="text-legenda text-perigo">
          {{ submitError }}
        </p>
        <!-- Estado "carregando" dos tokens: fundo normal, indicador, rótulo da ação, inerte. -->
        <button
          type="submit"
          :disabled="submitting"
          :aria-busy="submitting"
          class="flex h-11 items-center justify-center gap-sm rounded-lg bg-primaria px-lg text-corpo font-semibold text-texto focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primaria-escura enabled:hover:bg-primaria-escura enabled:hover:text-superficie disabled:cursor-progress"
        >
          <span
            v-if="submitting"
            aria-hidden="true"
            class="size-4 animate-spin rounded-full border-2 border-texto border-t-transparent"
          />
          {{ submitting ? 'Cadastrando…' : 'Cadastrar' }}
        </button>
      </form>
    </template>
  </section>
</template>
