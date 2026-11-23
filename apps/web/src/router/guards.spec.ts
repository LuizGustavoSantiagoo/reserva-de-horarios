import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { RouterView, createMemoryHistory, type Router } from 'vue-router'
import { useSession } from '@/shared/composables/useSession'
import { ProfileError, getMe, type createOperator } from '@/features/admin/services/users.service'
import type { createCourt, getArena } from '@/features/admin/services/courts.service'
import type { getSlots, listCourts } from '@/features/grade/services/grade.service'
import { createAppRouter } from './index'

// As páginas reais são carregadas pelas rotas lazy, e o client exige `VITE_API_URL` ao
// ser carregado; o endereço não importa, nenhuma chamada sai daqui.
vi.hoisted(() => {
  vi.stubEnv('VITE_API_URL', 'http://api.test')
})

vi.mock('@/features/admin/services/users.service', () => {
  class ProfileError extends Error {}
  class CreateOperatorError extends Error {}
  return {
    ProfileError,
    CreateOperatorError,
    getMe: vi.fn<typeof getMe>(),
    createOperator: vi.fn<typeof createOperator>(),
  }
})

vi.mock('@/features/admin/services/courts.service', () => {
  class ArenaError extends Error {}
  class CreateCourtError extends Error {}
  return {
    ArenaError,
    CreateCourtError,
    getArena: vi.fn<typeof getArena>(),
    createCourt: vi.fn<typeof createCourt>(),
  }
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

describe('guard de papel do cadastro de operador', () => {
  const ADMIN = { id: 'u1', email: 'ana@arena.com', role: 'ADMIN' as const }
  const OPERATOR = { id: 'u2', email: 'bia@arena.com', role: 'OPERATOR' as const }

  afterEach(() => {
    vi.resetAllMocks()
    useSession().clearSession()
  })

  it('sem token, /admin/operadores/novo vai para /admin/login', async () => {
    const router = makeRouter()

    await router.push('/admin/operadores/novo')

    expect(router.currentRoute.value.fullPath).toBe('/admin/login')
    expect(getMeMock).not.toHaveBeenCalled()
  })

  it('o OPERATOR que abre /admin/operadores/novo volta a /admin', async () => {
    getMeMock.mockResolvedValue(OPERATOR)
    useSession().setToken('jwt-operador')
    const router = makeRouter()

    await router.push('/admin/operadores/novo')

    expect(router.currentRoute.value.fullPath).toBe('/admin')
  })

  it('o ADMIN entra no cadastro de operador, e o perfil fica guardado na sessão', async () => {
    getMeMock.mockResolvedValue(ADMIN)
    useSession().setToken('jwt-admin')
    const router = makeRouter()

    await router.push('/admin/operadores/novo')

    expect(router.currentRoute.value.name).toBe('admin-novo-operador')
    expect(useSession().profile.value).toEqual(ADMIN)
  })

  it('com o perfil já guardado na sessão, não busca o getMe de novo', async () => {
    useSession().setToken('jwt-operador')
    useSession().setProfile(OPERATOR)
    const router = makeRouter()

    await router.push('/admin/operadores/novo')

    expect(getMeMock).not.toHaveBeenCalled()
    expect(router.currentRoute.value.fullPath).toBe('/admin')
  })

  it('se o getMe falhar por rede, vai para /admin, onde o layout mostra o erro', async () => {
    getMeMock.mockRejectedValue(new ProfileError('Não foi possível conectar ao servidor.'))
    useSession().setToken('jwt-admin')
    const router = makeRouter()

    await router.push('/admin/operadores/novo')

    expect(router.currentRoute.value.fullPath).toBe('/admin')
    expect(useSession().token.value).toBe('jwt-admin')
  })
})

describe('guard da página de quadras (CA9)', () => {
  afterEach(() => {
    vi.resetAllMocks()
    useSession().clearSession()
  })

  it('sem token, /admin/quadras vai para /admin/login', async () => {
    const router = makeRouter()

    await router.push('/admin/quadras')

    expect(router.currentRoute.value.fullPath).toBe('/admin/login')
  })

  it.each([
    ['ADMIN', { id: 'u1', email: 'ana@arena.com', role: 'ADMIN' as const }],
    ['OPERATOR', { id: 'u2', email: 'bia@arena.com', role: 'OPERATOR' as const }],
  ])('com token, o %s abre /admin/quadras', async (_papel, profile) => {
    useSession().setToken('jwt-valido')
    useSession().setProfile(profile)
    const router = makeRouter()

    await router.push('/admin/quadras')

    expect(router.currentRoute.value.name).toBe('admin-quadras')
  })
})
