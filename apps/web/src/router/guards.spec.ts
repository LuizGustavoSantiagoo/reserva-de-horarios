import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { RouterView, createMemoryHistory, type Router } from 'vue-router'
import { useSession } from '@/shared/composables/useSession'
import { getMe } from '@/features/admin/services/users.service'
import type { getSlots, listCourts } from '@/features/grade/services/grade.service'
import { createAppRouter } from './index'

// As páginas reais são carregadas pelas rotas lazy, e o client exige `VITE_API_URL` ao
// ser carregado; o endereço não importa, nenhuma chamada sai daqui.
vi.hoisted(() => {
  vi.stubEnv('VITE_API_URL', 'http://api.test')
})

vi.mock('@/features/admin/services/users.service', () => {
  class ProfileError extends Error {}
  return { ProfileError, getMe: vi.fn<typeof getMe>() }
})

vi.mock('@/features/grade/services/grade.service', () => ({
  // A grade fica carregando: este teste só confere que a rota abre.
  listCourts: vi.fn<typeof listCourts>(() => new Promise(() => {})),
  getSlots: vi.fn<typeof getSlots>(),
}))

const getMeMock = vi.mocked(getMe)

// O router do app, com as rotas e o guard de verdade, sobre um histórico em memória.
function makeRouter(): Router {
  return createAppRouter(createMemoryHistory())
}

describe('guard de sessão do painel', () => {
  afterEach(() => {
    vi.resetAllMocks()
    useSession().clearSession()
  })

  it('sem token, /admin vai para /admin/login', async () => {
    const router = makeRouter()

    await router.push('/admin')

    expect(router.currentRoute.value.fullPath).toBe('/admin/login')
  })

  it('com token, /admin abre o painel', async () => {
    useSession().setToken('jwt-valido')
    const router = makeRouter()

    await router.push('/admin')

    expect(router.currentRoute.value.name).toBe('admin')
  })

  it.each([
    ['sem token', null],
    ['com token', 'jwt-valido'],
  ])('a grade (/) abre %s', async (_caso, token) => {
    if (token) useSession().setToken(token)
    const router = makeRouter()

    await router.push('/')

    expect(router.currentRoute.value.name).toBe('grade')
  })

  it('depois do Sair, voltar para /admin cai no login sem mostrar o painel', async () => {
    getMeMock.mockResolvedValue({ id: 'u1', email: 'ana@arena.com', role: 'ADMIN' })
    useSession().setToken('jwt-valido')
    const router = makeRouter()
    await router.push('/admin/login')
    await router.push('/admin')
    const wrapper = mount(RouterView, { global: { plugins: [router] } })
    await flushPromises()
    expect(wrapper.text()).toContain('ana@arena.com')

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Sair')
      ?.trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('admin-login')

    router.back()
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('admin-login')

    await router.push('/admin')
    await flushPromises()
    expect(router.currentRoute.value.fullPath).toBe('/admin/login')
    expect(wrapper.text()).not.toContain('ana@arena.com')
  })
})
