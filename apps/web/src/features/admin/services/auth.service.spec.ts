import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, NetworkError, apiPost } from '@/api/client'
import { LoginError, login } from './auth.service'

vi.mock('@/api/client', async (importOriginal) => {
  // O client exige `VITE_API_URL` ao ser carregado; o endereço não importa, nada sai daqui.
  vi.stubEnv('VITE_API_URL', 'http://api.test')
  // As classes de erro são as reais do client (com o texto de produção); só `apiPost` é falso.
  const actual = await importOriginal<typeof import('@/api/client')>()
  return { ...actual, apiPost: vi.fn<typeof apiPost>() }
})

const apiPostMock = vi.mocked(apiPost)

describe('auth.service', () => {
  afterEach(() => {
    apiPostMock.mockReset()
  })

  it('login manda e-mail e senha para /auth/login sem tratar o 401 como sessão vencida', async () => {
    apiPostMock.mockResolvedValue({ accessToken: 'jwt' })

    await expect(login('ana@arena.com', 'segredo123')).resolves.toBe('jwt')
    expect(apiPostMock).toHaveBeenCalledWith(
      '/auth/login',
      { email: 'ana@arena.com', password: 'segredo123' },
      { sessionExpiry: false },
    )
  })

  it.each([401, 400, 429])('a recusa %i vira LoginError com a mensagem da API', async (status) => {
    apiPostMock.mockRejectedValue(new ApiError(status, `mensagem ${status}`))

    const error = await login('ana@arena.com', 'x').catch((e: unknown) => e)

    expect(error).toBeInstanceOf(LoginError)
    expect((error as LoginError).message).toBe(`mensagem ${status}`)
  })

  it('a falha de rede vira LoginError com a mensagem de conexão do client (CA13)', async () => {
    apiPostMock.mockRejectedValue(new NetworkError(new TypeError('fetch failed')))

    const error = await login('ana@arena.com', 'x').catch((e: unknown) => e)

    expect(error).toBeInstanceOf(LoginError)
    expect((error as LoginError).message).toBe('Não foi possível conectar ao servidor.')
  })
})
