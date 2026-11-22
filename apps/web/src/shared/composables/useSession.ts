import { readonly, ref, type Ref } from 'vue'

// Sessão do painel (architecture §4, ID16): o token mora na memória, com cópia no
// `sessionStorage`. Recarregar a página na mesma aba mantém a sessão; fechar a aba a apaga.
const STORAGE_KEY = 'reserva.token'

// Um único estado para o app inteiro, iniciado do `sessionStorage` quando o módulo carrega.
const token = ref<string | null>(sessionStorage.getItem(STORAGE_KEY))

function setToken(value: string): void {
  token.value = value
  sessionStorage.setItem(STORAGE_KEY, value)
}

function clearSession(): void {
  token.value = null
  sessionStorage.removeItem(STORAGE_KEY)
}

export function useSession(): {
  token: Readonly<Ref<string | null>>
  setToken: typeof setToken
  clearSession: typeof clearSession
} {
  return { token: readonly(token), setToken, clearSession }
}
