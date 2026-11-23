import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, NetworkError, apiGet, apiPost } from '@/api/client'
import { ArenaError, CreateCourtError, createCourt, getArena } from './courts.service'

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

describe('courts.service', () => {
  afterEach(() => {
    apiGetMock.mockReset()
    apiPostMock.mockReset()
  })

  describe('getArena', () => {
    it('busca a arena com as quadras em GET /arena (CA1, CA9)', async () => {
      const arena = {
        id: 'a1',
        name: 'Arena Beira-Mar',
        address: 'Av. Atlântica, 100',
        courts: [
          { id: 'q1', name: 'Quadra 1', isActive: true },
          { id: 'q2', name: 'Quadra 2', isActive: false },
        ],
      }
      apiGetMock.mockResolvedValue(arena)

      await expect(getArena()).resolves.toEqual(arena)
      expect(apiGetMock).toHaveBeenCalledWith('/arena')
    })

    it('o erro do servidor vira ArenaError com a mensagem da API', async () => {
      apiGetMock.mockRejectedValue(new ApiError(500, 'Erro inesperado no servidor.'))

      const error = await getArena().catch((e: unknown) => e)

      expect(error).toBeInstanceOf(ArenaError)
      expect((error as ArenaError).message).toBe('Erro inesperado no servidor.')
    })

    it('a falha de rede vira ArenaError com a mensagem de conexão do client', async () => {
      apiGetMock.mockRejectedValue(new NetworkError(new TypeError('fetch failed')))

      const error = await getArena().catch((e: unknown) => e)

      expect(error).toBeInstanceOf(ArenaError)
      expect((error as ArenaError).message).toBe('Não foi possível conectar ao servidor.')
    })
  })

  describe('createCourt', () => {
    async function createCourtError(): Promise<CreateCourtError> {
      const error = await createCourt('Quadra 3').catch((e: unknown) => e)
      expect(error).toBeInstanceOf(CreateCourtError)
      return error as CreateCourtError
    }

    it('manda o nome para POST /courts e devolve a quadra cadastrada (CA2, CA10)', async () => {
      const created = { id: 'q3', arenaId: 'a1', name: 'Quadra 3', isActive: true }
      apiPostMock.mockResolvedValue(created)

      await expect(createCourt('Quadra 3')).resolves.toEqual(created)
      expect(apiPostMock).toHaveBeenCalledWith('/courts', { name: 'Quadra 3' })
    })

    it('o 400 vira CreateCourtError com as mensagens do campo nome juntas', async () => {
      apiPostMock.mockRejectedValue(
        new ApiError(400, 'Dados inválidos.', {
          name: ['O nome deve ter no máximo 60 caracteres.', 'Informe o nome.'],
        }),
      )

      const error = await createCourtError()

      expect(error.fields).toEqual({
        name: 'O nome deve ter no máximo 60 caracteres. Informe o nome.',
      })
    })

    it('o 409 vira a mensagem da API no campo nome (CA4)', async () => {
      apiPostMock.mockRejectedValue(new ApiError(409, 'Já existe uma quadra com este nome.'))

      const error = await createCourtError()

      expect(error.fields).toEqual({ name: 'Já existe uma quadra com este nome.' })
    })

    it('outra recusa da API vira CreateCourtError só com a mensagem, sem campo', async () => {
      apiPostMock.mockRejectedValue(new ApiError(403, 'Seu perfil não tem acesso a esta operação.'))

      const error = await createCourtError()

      expect(error.message).toBe('Seu perfil não tem acesso a esta operação.')
      expect(error.fields).toEqual({})
    })

    it('a falha de rede vira CreateCourtError com a mensagem de conexão do client', async () => {
      apiPostMock.mockRejectedValue(new NetworkError(new TypeError('fetch failed')))

      const error = await createCourtError()

      expect(error.message).toBe('Não foi possível conectar ao servidor.')
      expect(error.fields).toEqual({})
    })
  })
})
