import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, NetworkError, apiGet, apiPost } from '@/api/client'
import { CreateOperatorError, ProfileError, createOperator, getMe } from './users.service'

vi.mock('@/api/client', async (importOriginal) => {
  // O client exige `VITE_API_URL` ao ser carregado; o endereço não importa, nada sai daqui.
  vi.stubEnv('VITE_API_URL', 'http://api.test')
  // As classes de erro são as reais do client (com o texto de produção); só `apiGet` e
  // `apiPost` são falsos.
  const actual = await importOriginal<typeof import('@/api/client')>()
  return { ...actual, apiGet: vi.fn<typeof apiGet>(), apiPost: vi.fn<typeof apiPost>() }
})

const apiGetMock = vi.mocked(apiGet)
const apiPostMock = vi.mocked(apiPost)

describe('users.service', () => {
  afterEach(() => {
    apiGetMock.mockReset()
    apiPostMock.mockReset()
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

  describe('createOperator', () => {
    async function createOperatorError(): Promise<CreateOperatorError> {
      const error = await createOperator('carla@arena.com', 'senha-curta').catch((e: unknown) => e)
      expect(error).toBeInstanceOf(CreateOperatorError)
      return error as CreateOperatorError
    }

    it('manda e-mail e senha para POST /users e devolve o operador cadastrado', async () => {
      const created = { id: 'u3', email: 'carla@arena.com', role: 'OPERATOR' as const }
      apiPostMock.mockResolvedValue(created)

      await expect(createOperator('carla@arena.com', 'senha-do-operador')).resolves.toEqual(
        created,
      )
      expect(apiPostMock).toHaveBeenCalledWith('/users', {
        email: 'carla@arena.com',
        password: 'senha-do-operador',
      })
    })

    it('o 400 vira CreateOperatorError com a mensagem de cada campo que falhou', async () => {
      apiPostMock.mockRejectedValue(
        new ApiError(400, 'Dados inválidos.', {
          email: ['Informe um e-mail válido.'],
          password: ['A senha deve ter pelo menos 8 caracteres.'],
        }),
      )

      const error = await createOperatorError()

      expect(error.fields).toEqual({
        email: 'Informe um e-mail válido.',
        password: 'A senha deve ter pelo menos 8 caracteres.',
      })
    })

    it('o 400 com mais de uma mensagem no mesmo campo junta as mensagens', async () => {
      apiPostMock.mockRejectedValue(
        new ApiError(400, 'Dados inválidos.', {
          password: ['A senha deve ter pelo menos 8 caracteres.', 'Informe a senha.'],
        }),
      )

      const error = await createOperatorError()

      expect(error.fields).toEqual({
        password: 'A senha deve ter pelo menos 8 caracteres. Informe a senha.',
      })
    })

    it('o 409 vira a mensagem da API no campo de e-mail (CA17)', async () => {
      apiPostMock.mockRejectedValue(new ApiError(409, 'Já existe uma conta com este e-mail.'))

      const error = await createOperatorError()

      expect(error.fields).toEqual({ email: 'Já existe uma conta com este e-mail.' })
    })

    it('outra recusa da API vira CreateOperatorError só com a mensagem, sem campo', async () => {
      apiPostMock.mockRejectedValue(
        new ApiError(403, 'Seu perfil não tem acesso a esta operação.'),
      )

      const error = await createOperatorError()

      expect(error.message).toBe('Seu perfil não tem acesso a esta operação.')
      expect(error.fields).toEqual({})
    })

    it('a falha de rede vira CreateOperatorError com a mensagem de conexão do client', async () => {
      apiPostMock.mockRejectedValue(new NetworkError(new TypeError('fetch failed')))

      const error = await createOperatorError()

      expect(error.message).toBe('Não foi possível conectar ao servidor.')
      expect(error.fields).toEqual({})
    })
  })
})
