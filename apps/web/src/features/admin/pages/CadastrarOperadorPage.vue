<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { CreateOperatorError, createOperator, type OperatorField } from '../services/users.service'

const emailId = useId()
const passwordId = useId()

const email = ref('')
const password = ref('')
const submitting = ref(false)
const createdEmail = ref<string>()
const fieldErrors = ref<Partial<Record<OperatorField, string>>>({})
const errorMessage = ref<string>()

const emailError = computed(() => fieldErrors.value.email)
const passwordError = computed(() => fieldErrors.value.password)

async function submit(): Promise<void> {
  if (submitting.value) return
  submitting.value = true
  createdEmail.value = undefined
  fieldErrors.value = {}
  errorMessage.value = undefined
  try {
    const operator = await createOperator(email.value, password.value)
    createdEmail.value = operator.email
    email.value = ''
  } catch (error) {
    if (!(error instanceof CreateOperatorError)) throw error
    fieldErrors.value = error.fields
    // Sem campo apontado (rede, servidor, 403), a mensagem vai acima do botão.
    if (!error.fields.email && !error.fields.password) errorMessage.value = error.message
  } finally {
    // A senha digitada não fica na tela depois da resposta, seja ela qual for (CA17).
    password.value = ''
    submitting.value = false
  }
}
</script>

<template>
  <section aria-labelledby="cadastrar-operador-titulo" class="flex flex-col gap-xl">
    <h1 id="cadastrar-operador-titulo" class="text-titulo-pagina">Cadastrar operador</h1>
    <!-- A validação é a da API (CA17): o navegador não barra o envio com a mensagem dele. -->
    <form
      novalidate
      aria-labelledby="cadastrar-operador-titulo"
      class="flex max-w-(--container-sm) flex-col gap-lg rounded-xl border border-desabilitado bg-superficie p-lg sm:p-xl"
      @submit.prevent="submit"
    >
      <p
        v-if="createdEmail"
        role="status"
        class="rounded-lg border border-desabilitado p-md text-legenda text-texto"
      >
        Operador {{ createdEmail }} cadastrado.
      </p>
      <div class="flex flex-col gap-sm">
        <label :for="emailId" class="text-corpo">E-mail</label>
        <input
          :id="emailId"
          v-model="email"
          type="email"
          autocomplete="off"
          :aria-invalid="emailError ? true : undefined"
          :aria-describedby="emailError ? `${emailId}-erro` : undefined"
          class="h-11 w-full rounded-lg border border-desabilitado bg-superficie px-md text-corpo text-texto focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primaria-escura"
        />
        <p v-if="emailError" :id="`${emailId}-erro`" class="text-legenda text-perigo">
          {{ emailError }}
        </p>
      </div>
      <div class="flex flex-col gap-sm">
        <label :for="passwordId" class="text-corpo">Senha</label>
        <input
          :id="passwordId"
          v-model="password"
          type="password"
          autocomplete="new-password"
          :aria-invalid="passwordError ? true : undefined"
          :aria-describedby="passwordError ? `${passwordId}-erro` : undefined"
          class="h-11 w-full rounded-lg border border-desabilitado bg-superficie px-md text-corpo text-texto focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primaria-escura"
        />
        <p v-if="passwordError" :id="`${passwordId}-erro`" class="text-legenda text-perigo">
          {{ passwordError }}
        </p>
      </div>
      <p v-if="errorMessage" role="alert" class="text-legenda text-perigo">
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
        {{ submitting ? 'Cadastrando…' : 'Cadastrar' }}
      </button>
    </form>
  </section>
</template>
