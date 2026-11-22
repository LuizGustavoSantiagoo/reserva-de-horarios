import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, NetworkError, apiGet } from '@/api/client'
import { ProfileError, getMe } from './users.service'

vi.mock('@/api/client', async (importOriginal) => {
  // O client exige `VITE_API_URL` ao ser carregado; o endereço não importa, nada sai daqui.
  vi.stubEnv('VITE_API_URL', 'http://api.test')
  // As classes de erro são as reais do client (com o texto de produção); só `apiGet` é falso.
  const actual = await importOriginal<typeof import('@/api/client')>()
  return { ...actual, apiGet: vi.fn<typeof apiGet>() }
})

const apiGetMock = vi.mocked(apiGet)

describe('users.service', () => {
  afterEach(() => {
    apiGetMock.mockReset()
  })

  it('getMe busca o perfil de quem está logado em /users/me', async () => {
    const me = { id: 'u1', email: 'ana@arena.com', role: 'ADMIN' as const }
    apiGetMock.mockResolvedValue(me)

    await expect(getMe()).resolves.toEqual(me)
    expect(apiGetMock).toHaveBeenCalledWith('/users/me')
  })

  it('o erro do servidor vira ProfileError com a mensagem da API', async () => {
    apiGetMock.mockRejectedValue(new ApiError(500, 'Erro inesperado no servidor.'))

    const error = await getMe().catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ProfileError)
    expect((error as ProfileError).message).toBe('Erro inesperado no servidor.')
  })

  it('a falha de rede vira ProfileError com a mensagem de conexão do client', async () => {
    apiGetMock.mockRejectedValue(new NetworkError(new TypeError('fetch failed')))

    const error = await getMe().catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ProfileError)
    expect((error as ProfileError).message).toBe('Não foi possível conectar ao servidor.')
  })
})
