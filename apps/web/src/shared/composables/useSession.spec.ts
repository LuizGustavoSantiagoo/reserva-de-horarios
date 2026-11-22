import { afterEach, describe, expect, it, vi } from 'vitest'

type SessionModule = typeof import('./useSession')

const STORAGE_KEY = 'reserva.token'

// A sessão é lida do `sessionStorage` quando o módulo carrega; recarregar o módulo é o
// equivalente, no teste, a recarregar a página na mesma aba.
async function loadSession(): Promise<SessionModule> {
  vi.resetModules()
  return import('./useSession')
}

describe('useSession', () => {
  afterEach(() => {
    sessionStorage.clear()
  })

  it('começa sem token quando o sessionStorage está vazio', async () => {
    const { useSession } = await loadSession()

    expect(useSession().token.value).toBeNull()
  })

  it('setToken guarda o token na memória e no sessionStorage', async () => {
    const { useSession } = await loadSession()

    useSession().setToken('abc.def.ghi')

    expect(useSession().token.value).toBe('abc.def.ghi')
    expect(sessionStorage.getItem(STORAGE_KEY)).toBe('abc.def.ghi')
  })

  it('recarregar a página mantém a sessão: o módulo novo lê o token do sessionStorage', async () => {
    const first = await loadSession()
    first.useSession().setToken('abc.def.ghi')

    const reloaded = await loadSession()

    expect(reloaded).not.toBe(first)
    expect(reloaded.useSession().token.value).toBe('abc.def.ghi')
  })

  it('clearSession apaga o token da memória e do sessionStorage', async () => {
    const { useSession } = await loadSession()
    useSession().setToken('abc.def.ghi')

    useSession().clearSession()

    expect(useSession().token.value).toBeNull()
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull()
    const reloaded = await loadSession()
    expect(reloaded.useSession().token.value).toBeNull()
  })
})
