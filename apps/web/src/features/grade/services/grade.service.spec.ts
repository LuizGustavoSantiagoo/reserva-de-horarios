import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiGet } from '@/api/client'
import { getSlots, listCourts } from './grade.service'

vi.mock('@/api/client', () => ({ apiGet: vi.fn<typeof apiGet>() }))

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
})
