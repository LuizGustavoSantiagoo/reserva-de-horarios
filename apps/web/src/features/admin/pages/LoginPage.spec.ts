import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import { useSession } from '@/shared/composables/useSession'
import { LoginError, login } from '../services/auth.service'
import LoginPage from './LoginPage.vue'

vi.mock('../services/auth.service', () => {
  class LoginError extends Error {}
  return { LoginError, login: vi.fn<typeof login>() }
})

const loginMock = vi.mocked(login)

function makeRouter(): Router {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/admin', name: 'admin', component: { render: () => null } },
      { path: '/admin/login', name: 'admin-login', component: LoginPage },
    ],
  })
}

async function mountAt(path: string) {
  const router = makeRouter()
  await router.push(path)
  await router.isReady()
  const wrapper = mount(LoginPage, { global: { plugins: [router] } })
  return { wrapper, router }
}

async function fillAndSubmit(wrapper: Awaited<ReturnType<typeof mountAt>>['wrapper']) {
  await wrapper.get('input[type="email"]').setValue('ana@arena.com')
  await wrapper.get('input[type="password"]').setValue('segredo123')
  await wrapper.get('form').trigger('submit')
}

describe('LoginPage', () => {
  beforeEach(() => {
    useSession().clearSession()
  })

  afterEach(() => {
    vi.resetAllMocks()
    useSession().clearSession()
  })

  it('tem os campos de e-mail e senha com rótulo e o botão Entrar', async () => {
    const { wrapper } = await mountAt('/admin/login')

    const email = wrapper.get('input[type="email"]')
    const password = wrapper.get('input[type="password"]')
    expect(wrapper.get(`label[for="${email.attributes('id')}"]`).text()).toBe('E-mail')
    expect(wrapper.get(`label[for="${password.attributes('id')}"]`).text()).toBe('Senha')
    expect(wrapper.get('button[type="submit"]').text()).toBe('Entrar')
  })

  it('com as credenciais certas, guarda o token e leva ao painel', async () => {
    loginMock.mockResolvedValue('jwt-valido')
    const { wrapper, router } = await mountAt('/admin/login')

    await fillAndSubmit(wrapper)
    await flushPromises()

    expect(loginMock).toHaveBeenCalledWith('ana@arena.com', 'segredo123')
    expect(useSession().token.value).toBe('jwt-valido')
    expect(sessionStorage.getItem('reserva.token')).toBe('jwt-valido')
    expect(router.currentRoute.value.name).toBe('admin')
  })

  it.each([
    ['401', 'E-mail ou senha inválidos.'],
    ['400', 'email must be an email'],
    ['429', 'Muitas tentativas de login. Tente de novo em alguns minutos.'],
  ])('na recusa %s, mostra a mensagem da API, sem token, no login', async (_status, message) => {
    loginMock.mockRejectedValue(new LoginError(message))
    const { wrapper, router } = await mountAt('/admin/login')

    await fillAndSubmit(wrapper)
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toBe(message)
    expect(useSession().token.value).toBeNull()
    expect(sessionStorage.getItem('reserva.token')).toBeNull()
    expect(router.currentRoute.value.name).toBe('admin-login')
  })

  it('sem resposta da API, mostra que não foi possível conectar', async () => {
    loginMock.mockRejectedValue(new LoginError('Não foi possível conectar ao servidor.'))
    const { wrapper, router } = await mountAt('/admin/login')

    await fillAndSubmit(wrapper)
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toBe('Não foi possível conectar ao servidor.')
    expect(useSession().token.value).toBeNull()
    expect(router.currentRoute.value.name).toBe('admin-login')
  })

  it('desabilita o botão enquanto o pedido está em andamento e o libera na resposta', async () => {
    let reject!: (error: Error) => void
    loginMock.mockReturnValue(new Promise((_resolve, r) => (reject = r)))
    const { wrapper } = await mountAt('/admin/login')

    await fillAndSubmit(wrapper)

    const button = wrapper.get('button[type="submit"]')
    expect(button.attributes('disabled')).toBeDefined()
    expect(button.attributes('aria-busy')).toBe('true')
    expect(button.text()).toBe('Entrando…')

    await wrapper.get('form').trigger('submit')
    expect(loginMock).toHaveBeenCalledTimes(1)

    reject(new LoginError('E-mail ou senha inválidos.'))
    await flushPromises()

    expect(button.attributes('disabled')).toBeUndefined()
    expect(button.text()).toBe('Entrar')
  })

  it('com ?sessao=expirada, avisa que a sessão terminou', async () => {
    const { wrapper } = await mountAt('/admin/login?sessao=expirada')

    expect(wrapper.get('[role="status"]').text()).toBe('Sua sessão terminou. Entre de novo.')
  })

  it('sem o aviso no endereço, não fala de sessão', async () => {
    const { wrapper } = await mountAt('/admin/login')

    expect(wrapper.text()).not.toContain('Sua sessão terminou')
  })
})
