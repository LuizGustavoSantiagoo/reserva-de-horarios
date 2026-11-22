import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, NetworkError, apiGet } from '@/api/client'
import { getSlots, listCourts } from './grade.service'
import { GradeRefusal } from './grade-refusal'

// O cliente exige o endereço da API ao ser carregado; as classes de erro vêm dele de verdade.
vi.hoisted(() => {
  vi.stubEnv('VITE_API_URL', 'https://api.exemplo.test')
})

vi.mock('@/api/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/client')>()),
  apiGet: vi.fn<typeof apiGet>(),
}))

const apiGetMock = vi.mocked(apiGet)

describe('grade.service', () => {
  afterEach(() => {
    apiGetMock.mockReset()
  })

  it('listCourts pede as quadras ativas em /courts', async () => {
    apiGetMock.mockResolvedValue([{ id: 'q1', name: 'Quadra 1' }])

    await expect(listCourts()).resolves.toEqual([{ id: 'q1', name: 'Quadra 1' }])
    expect(apiGetMock).toHaveBeenCalledWith('/courts')
  })

  it('getSlots sem dia pede a grade sem date, para o servidor decidir o que é hoje', async () => {
    const grid = { courtId: 'q1', date: '2026-11-22', today: '2026-11-22', slots: [] }
    apiGetMock.mockResolvedValue(grid)

    await expect(getSlots('q1')).resolves.toEqual(grid)
    expect(apiGetMock).toHaveBeenCalledWith('/courts/q1/slots')
  })

  it('getSlots com dia pede a grade daquele dia', async () => {
    apiGetMock.mockResolvedValue({})

    await getSlots('q1', '2026-11-23')

    expect(apiGetMock).toHaveBeenCalledWith('/courts/q1/slots?date=2026-11-23')
  })

  describe('getSlots recusado pela API (CA11)', () => {
    it('quadra não encontrada (404) vira recusa da quadra com a mensagem da API', async () => {
      apiGetMock.mockRejectedValue(new ApiError(404, 'Quadra não encontrada'))

      const refusal = await getSlots('q9').catch((error: unknown) => error)

      expect(refusal).toBeInstanceOf(GradeRefusal)
      expect(refusal).toMatchObject({ reason: 'court', message: 'Quadra não encontrada' })
    })

    it('dia recusado (400) vira recusa do dia com a mensagem do campo da data', async () => {
      apiGetMock.mockRejectedValue(
        new ApiError(400, 'Dados inválidos.', {
          date: ['Não é possível ver um dia que já passou.'],
        }),
      )

      const refusal = await getSlots('q1', '2026-11-01').catch((error: unknown) => error)

      expect(refusal).toBeInstanceOf(GradeRefusal)
      expect(refusal).toMatchObject({
        reason: 'day',
        message: 'Não é possível ver um dia que já passou.',
      })
    })

    it('400 sem mensagem do campo da data usa a mensagem geral da API', async () => {
      apiGetMock.mockRejectedValue(new ApiError(400, 'Dados inválidos.'))

      await expect(getSlots('q1', 'x')).rejects.toMatchObject({
        reason: 'day',
        message: 'Dados inválidos.',
      })
    })

    it('erro que não é recusa do link continua sendo relançado como veio', async () => {
      const serverError = new ApiError(500, 'Erro inesperado no servidor.')
      apiGetMock.mockRejectedValueOnce(serverError)
      await expect(getSlots('q1')).rejects.toBe(serverError)

      const networkError = new NetworkError(new TypeError('fetch failed'))
      apiGetMock.mockRejectedValueOnce(networkError)
      await expect(getSlots('q1')).rejects.toBe(networkError)
    })
  })
})
