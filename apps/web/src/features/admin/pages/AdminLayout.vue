<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { useSession } from '@/shared/composables/useSession'
import { ProfileError, getMe, type Role } from '../services/users.service'

const router = useRouter()
const session = useSession()
// O perfil mora na sessão, a mesma que o guard de papel usa: quem buscar primeiro grava.
const user = session.profile

// Rótulos dos papéis na tela (CA15): a API devolve o código, o português é só do front.
const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Administrador',
  OPERATOR: 'Operador',
}

const errorMessage = ref<string>()

// Falha de rede ou do servidor não é sessão vencida: mostra o erro e mantém o token (CA15).
// O `401` o client já tratou, limpando a sessão e levando ao login (CA14).
async function loadProfile(): Promise<void> {
  if (session.profile.value) return
  errorMessage.value = undefined
  try {
    session.setProfile(await getMe())
  } catch (error) {
    if (!(error instanceof ProfileError)) throw error
    errorMessage.value = error.message
  }
}

// `replace`, e não `push`: voltar pelo navegador não reabre o painel (CA15).
async function signOut(): Promise<void> {
  session.clearSession()
  await router.replace({ name: 'admin-login' })
}

onMounted(loadProfile)
</script>

<template>
  <div class="mx-auto flex max-w-(--container-6xl) flex-col gap-xl p-lg sm:p-2xl">
    <header
      class="flex flex-col gap-lg rounded-xl border border-desabilitado bg-superficie p-lg sm:flex-row sm:items-center sm:justify-between sm:p-xl"
    >
      <div class="flex flex-col gap-xs">
        <p class="text-legenda text-texto-suave uppercase">Painel da arena</p>
        <p v-if="user" data-test="profile" class="flex flex-col gap-xs">
          <span class="text-titulo-card">{{ user.email }}</span>
          <span class="text-legenda text-texto-suave">{{ ROLE_LABELS[user.role] }}</span>
        </p>
      </div>
      <nav aria-label="Menu do painel" class="flex flex-wrap items-center gap-lg">
        <!-- TODO #10: a agenda do dia (US09) entra neste menu, para os dois papéis. -->
        <!-- Esconder o item é conforto: quem barra o Operador é a API (CA10, CA16). -->
        <RouterLink
          v-if="user?.role === 'ADMIN'"
          :to="{ name: 'admin-novo-operador' }"
          class="text-corpo font-semibold text-primaria-escura underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primaria-escura"
        >
          Cadastrar operador
        </RouterLink>
        <button
          type="button"
          class="flex h-11 items-center justify-center rounded-lg border border-desabilitado bg-superficie px-lg text-corpo font-semibold text-texto hover:bg-primaria-escura hover:text-superficie focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primaria-escura"
          @click="signOut"
        >
          Sair
        </button>
      </nav>
    </header>
    <div
      v-if="errorMessage"
      role="alert"
      class="flex flex-col items-start gap-md rounded-xl border border-desabilitado bg-superficie p-lg sm:p-xl"
    >
      <p class="text-corpo text-perigo">{{ errorMessage }}</p>
      <button
        type="button"
        class="flex h-11 items-center justify-center rounded-lg bg-primaria px-lg text-corpo font-semibold text-texto hover:bg-primaria-escura hover:text-superficie focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primaria-escura"
        @click="loadProfile"
      >
        Tentar de novo
      </button>
    </div>
    <p v-else-if="!user" class="text-legenda text-texto-suave">Carregando o painel…</p>
    <RouterView v-else />
  </div>
</template>
