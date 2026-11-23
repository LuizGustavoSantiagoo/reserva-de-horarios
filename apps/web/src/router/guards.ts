import type { RouteLocationNormalized, RouteLocationRaw } from 'vue-router'
import { useSession, type SessionProfile } from '@/shared/composables/useSession'
import { ProfileError, getMe } from '@/features/admin/services/users.service'

declare module 'vue-router' {
  interface RouteMeta {
    /** Rota do painel: sem token guardado, vai para o login (CA16). */
    requiresAuth?: boolean
    /** Papéis que abrem a rota; os outros voltam ao início do painel (CA16). */
    roles?: SessionProfile['role'][]
  }
}

/**
 * Guard de navegação do painel (architecture §4): conforto de UX, não proteção — quem
 * protege é a API, que recusa a chamada sem token válido (CA5) ou com o papel errado (CA10).
 *
 * O `meta` de `to` já junta o da rota-mãe com o da filha: `requiresAuth` no `/admin`
 * vale para todas as páginas dentro dele.
 */
export async function requireSession(
  to: RouteLocationNormalized,
): Promise<true | RouteLocationRaw> {
  const session = useSession()
  if (to.meta.requiresAuth && !session.token.value) {
    return { name: 'admin-login' }
  }
  if (to.meta.roles) {
    const profile = await loadProfile()
    // Sem perfil (rede ou servidor fora), o início do painel mostra o erro com Tentar de novo.
    if (!profile || !to.meta.roles.includes(profile.role)) {
      return { name: 'admin' }
    }
  }
  return true
}

/** O perfil guardado na sessão ou, na primeira vez, o de `GET /users/me`. */
async function loadProfile(): Promise<SessionProfile | null> {
  const session = useSession()
  if (session.profile.value) return session.profile.value
  try {
    const profile = await getMe()
    session.setProfile(profile)
    return profile
  } catch (error) {
    if (error instanceof ProfileError) return null
    throw error
  }
}
