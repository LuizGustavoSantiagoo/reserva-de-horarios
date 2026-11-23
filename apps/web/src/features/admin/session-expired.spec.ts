import { describe, expect, it } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createSessionExpiredHandler } from './session-expired'

function makeRouter() {
  const Empty = { render: () => null }
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'grade', component: Empty },
      { path: '/admin', name: 'admin', component: Empty },
      { path: '/admin/login', name: 'admin-login', component: Empty },
    ],
  })
}

describe('createSessionExpiredHandler', () => {
  it('leva ao login com o aviso de sessão encerrada', async () => {
    const router = makeRouter()
    await router.push('/admin')

    createSessionExpiredHandler(router)()
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('admin-login')
    expect(router.currentRoute.value.query).toEqual({ sessao: 'expirada' })
  })

  it('troca a rota atual, para o voltar do navegador não reabrir a tela que recusou o token', async () => {
    const router = makeRouter()
    await router.push('/')
    await router.push('/admin')

    createSessionExpiredHandler(router)()
    await flushPromises()
    router.back()
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('grade')
  })
})
