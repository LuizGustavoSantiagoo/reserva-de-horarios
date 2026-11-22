import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { RouterView, createMemoryHistory, createRouter, type Router } from 'vue-router'
import { useSession } from '@/shared/composables/useSession'
import { ProfileError, getMe, type User } from '../services/users.service'
import AdminLayout from './AdminLayout.vue'

vi.mock('../services/users.service', () => {
  class ProfileError extends Error {}
  return { ProfileError, getMe: vi.fn<typeof getMe>() }
})

const getMeMock = vi.mocked(getMe)

const ADMIN: User = { id: 'u1', email: 'ana@arena.com', role: 'ADMIN' }
const OPERATOR: User = { id: 'u2', email: 'bia@arena.com', role: 'OPERATOR' }

function makeRouter(): Router {
  const Empty = { render: () => null }
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'grade', component: Empty },
      { path: '/admin/login', name: 'admin-login', component: Empty },
      {
        path: '/admin',
        component: AdminLayout,
        children: [
          { path: '', name: 'admin', component: Empty },
          { path: 'operadores/novo', component: Empty },
        ],
      },
    ],
  })
}

async function mountLayout() {
  const router = makeRouter()
  await router.push('/')
  await router.push('/admin')
  await router.isReady()
  // Montado pela RouterView, como no app: o layout é a rota-mãe e a página filha entra nele.
  const wrapper = mount(RouterView, { global: { plugins: [router] } })
  await flushPromises()
  return { wrapper, router }
}

function findLink(wrapper: Awaited<ReturnType<typeof mountLayout>>['wrapper'], text: string) {
  return wrapper.findAll('a').find((link) => link.text() === text)
}

function findButton(wrapper: Awaited<ReturnType<typeof mountLayout>>['wrapper'], text: string) {
  return wrapper.findAll('button').find((button) => button.text() === text)
}

describe('AdminLayout', () => {
  beforeEach(() => {
    useSession().setToken('jwt-valido')
  })

  afterEach(() => {
    vi.resetAllMocks()
    useSession().clearSession()
  })

  it('mostra o e-mail e o rótulo "Administrador" do ADMIN, com o item Cadastrar operador', async () => {
    getMeMock.mockResolvedValue(ADMIN)

    const { wrapper } = await mountLayout()

    expect(wrapper.text()).toContain('ana@arena.com')
    expect(wrapper.text()).toContain('Administrador')
    expect(findLink(wrapper, 'Cadastrar operador')?.attributes('href')).toBe(
      '/admin/operadores/novo',
    )
  })

  it('mostra o e-mail e o rótulo "Operador" do OPERATOR, sem o item Cadastrar operador', async () => {
    getMeMock.mockResolvedValue(OPERATOR)

    const { wrapper } = await mountLayout()

    expect(wrapper.text()).toContain('bia@arena.com')
    expect(wrapper.text()).toContain('Operador')
    expect(wrapper.text()).not.toContain('Administrador')
    expect(findLink(wrapper, 'Cadastrar operador')).toBeUndefined()
  })

  it('mostra que está carregando enquanto o perfil não chega', async () => {
    getMeMock.mockReturnValue(new Promise(() => {}))

    const { wrapper } = await mountLayout()

    expect(wrapper.text()).toContain('Carregando o painel…')
  })

  it('Sair apaga a sessão e troca a rota pelo login, sem deixar o painel no histórico', async () => {
    getMeMock.mockResolvedValue(ADMIN)
    const { wrapper, router } = await mountLayout()
    const replace = vi.spyOn(router, 'replace')

    await findButton(wrapper, 'Sair')?.trigger('click')
    await flushPromises()

    expect(useSession().token.value).toBeNull()
    expect(sessionStorage.getItem('reserva.token')).toBeNull()
    expect(replace).toHaveBeenCalledWith({ name: 'admin-login' })
    expect(router.currentRoute.value.name).toBe('admin-login')
  })

  it.each([
    ['falha de rede', 'Não foi possível conectar ao servidor.'],
    ['erro do servidor', 'Erro inesperado no servidor.'],
  ])('na %s, mostra a mensagem com Tentar de novo e mantém a sessão', async (_caso, message) => {
    getMeMock.mockRejectedValue(new ProfileError(message))

    const { wrapper, router } = await mountLayout()

    expect(wrapper.get('[role="alert"]').text()).toContain(message)
    expect(findButton(wrapper, 'Tentar de novo')).toBeDefined()
    expect(useSession().token.value).toBe('jwt-valido')
    expect(sessionStorage.getItem('reserva.token')).toBe('jwt-valido')
    expect(router.currentRoute.value.name).toBe('admin')
  })

  it('Tentar de novo chama o getMe outra vez e mostra o perfil quando ele chega', async () => {
    getMeMock
      .mockRejectedValueOnce(new ProfileError('Não foi possível conectar ao servidor.'))
      .mockResolvedValueOnce(ADMIN)
    const { wrapper } = await mountLayout()

    await findButton(wrapper, 'Tentar de novo')?.trigger('click')
    await flushPromises()

    expect(getMeMock).toHaveBeenCalledTimes(2)
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('ana@arena.com')
  })
})
