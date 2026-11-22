import type { RouteLocationNormalized, RouteLocationRaw } from 'vue-router'
import { useSession } from '@/shared/composables/useSession'

declare module 'vue-router' {
  interface RouteMeta {
    /** Rota do painel: sem token guardado, vai para o login (CA16). */
    requiresAuth?: boolean
  }
}

/**
 * Guard de navegação do painel (architecture §4): conforto de UX, não proteção — quem
 * protege é a API, que recusa a chamada sem token válido (CA5).
 *
 * O `meta` de `to` já junta o da rota-mãe com o da filha: `requiresAuth` no `/admin`
 * vale para todas as páginas dentro dele.
 */
export function requireSession(to: RouteLocationNormalized): true | RouteLocationRaw {
  if (to.meta.requiresAuth && !useSession().token.value) {
    return { name: 'admin-login' }
  }
  return true
}
