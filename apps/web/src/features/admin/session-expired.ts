import type { Router } from 'vue-router'

/**
 * O que acontece quando a API recusa o token (CA14): o client já limpou a sessão e chama
 * este callback, registrado no `main.ts` com `onSessionExpired`. O client não conhece o
 * router; quem conhece é o app.
 *
 * `replace`, e não `push`: voltar pelo navegador não reabre a tela que recusou o token.
 */
export function createSessionExpiredHandler(router: Router): () => void {
  return () => {
    void router.replace({ name: 'admin-login', query: { sessao: 'expirada' } })
  }
}
