import { readonly, ref, type Ref } from 'vue'

// Sessão do painel (architecture §4, ID16): o token mora na memória, com cópia no
// `sessionStorage`. Recarregar a página na mesma aba mantém a sessão; fechar a aba a apaga.
const STORAGE_KEY = 'reserva.token'

/**
 * Quem está logado, como `GET /users/me` devolve. O tipo é repetido aqui porque `shared/`
 * não importa de `features/` (architecture §4); o `User` do `users.service` tem a mesma forma.
 */
export interface SessionProfile {
  id: string
  email: string
  role: 'ADMIN' | 'OPERATOR'
}

// Um único estado para o app inteiro, iniciado do `sessionStorage` quando o módulo carrega.
const token = ref<string | null>(sessionStorage.getItem(STORAGE_KEY))

// O perfil fica só na memória, para o guard de papel não buscar `GET /users/me` a cada
// navegação; recarregar a página o busca de novo.
const profile = ref<SessionProfile | null>(null)

function setToken(value: string): void {
  token.value = value
  sessionStorage.setItem(STORAGE_KEY, value)
  // O perfil guardado, se houver, era do token anterior.
  profile.value = null
}

function setProfile(value: SessionProfile): void {
  profile.value = value
}

function clearSession(): void {
  token.value = null
  profile.value = null
  sessionStorage.removeItem(STORAGE_KEY)
}

export function useSession(): {
  token: Readonly<Ref<string | null>>
  profile: Readonly<Ref<SessionProfile | null>>
  setToken: typeof setToken
  setProfile: typeof setProfile
  clearSession: typeof clearSession
} {
  return { token: readonly(token), profile: readonly(profile), setToken, setProfile, clearSession }
}
