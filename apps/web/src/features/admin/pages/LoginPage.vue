<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSession } from '@/shared/composables/useSession'
import { LoginError, login } from '../services/auth.service'

const route = useRoute()
const router = useRouter()
const session = useSession()

const emailId = useId()
const passwordId = useId()
const errorId = useId()

const email = ref('')
const password = ref('')
const submitting = ref(false)
const errorMessage = ref<string>()

// O client manda para cá com `?sessao=expirada` quando a API recusa o token (CA14).
const sessionExpired = computed(() => route.query.sessao === 'expirada')

async function submit(): Promise<void> {
  if (submitting.value) return
  submitting.value = true
  errorMessage.value = undefined
  try {
    const token = await login(email.value, password.value)
    session.setToken(token)
    await router.push({ name: 'admin' })
  } catch (error) {
    if (!(error instanceof LoginError)) throw error
    errorMessage.value = error.message
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="mx-auto flex max-w-(--container-sm) flex-col gap-xl p-lg sm:p-2xl">
    <header class="flex flex-col gap-sm">
      <p class="text-legenda text-texto-suave uppercase">Painel da arena</p>
      <h1 class="text-titulo-pagina">Entrar</h1>
    </header>
    <!-- A validação é a da API (CA13): o navegador não barra o envio com a mensagem dele. -->
    <form
      novalidate
      aria-label="Entrar no painel"
      class="flex flex-col gap-lg rounded-xl border border-desabilitado bg-superficie p-lg sm:p-xl"
      @submit.prevent="submit"
    >
      <p
        v-if="sessionExpired"
        role="status"
        class="rounded-lg border border-desabilitado p-md text-legenda text-texto"
      >
        Sua sessão terminou. Entre de novo.
      </p>
      <div class="flex flex-col gap-sm">
        <label :for="emailId" class="text-corpo">E-mail</label>
        <input
          :id="emailId"
          v-model="email"
          type="email"
          autocomplete="username"
          :aria-describedby="errorMessage ? errorId : undefined"
          class="h-11 w-full rounded-lg border border-desabilitado bg-superficie px-md text-corpo text-texto focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primaria-escura"
        />
      </div>
      <div class="flex flex-col gap-sm">
        <label :for="passwordId" class="text-corpo">Senha</label>
        <input
          :id="passwordId"
          v-model="password"
          type="password"
          autocomplete="current-password"
          :aria-describedby="errorMessage ? errorId : undefined"
          class="h-11 w-full rounded-lg border border-desabilitado bg-superficie px-md text-corpo text-texto focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primaria-escura"
        />
      </div>
      <p v-if="errorMessage" :id="errorId" role="alert" class="text-legenda text-perigo">
        {{ errorMessage }}
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
        {{ submitting ? 'Entrando…' : 'Entrar' }}
      </button>
    </form>
  </div>
</template>
