import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { getSlots, listCourts } from '../services/grade.service'
import type { SlotGrid } from '../services/grade.service'
import GradePage from './GradePage.vue'

vi.mock('../services/grade.service', () => ({
  listCourts: vi.fn<typeof listCourts>(),
  getSlots: vi.fn<typeof getSlots>(),
}))

const listCourtsMock = vi.mocked(listCourts)
const getSlotsMock = vi.mocked(getSlots)

const COURTS = [
  { id: 'q1', name: 'Quadra 1' },
  { id: 'q2', name: 'Quadra 2' },
]

function grid(courtId: string, date: string): SlotGrid {
  return {
    courtId,
    date,
    today: '2026-11-22',
    slots: [
      {
        startsAt: `${date}T11:00:00.000Z`,
        endsAt: `${date}T12:00:00.000Z`,
        status: 'FREE',
      },
      {
        startsAt: `${date}T12:00:00.000Z`,
        endsAt: `${date}T13:00:00.000Z`,
        status: 'BLOCKED',
      },
    ],
  }
}

describe('GradePage', () => {
  beforeEach(() => {
    // O aparelho está em outro dia: a página não pode usar o relógio dele.
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2030-01-01T12:00:00.000Z'))
    listCourtsMock.mockResolvedValue(COURTS)
    getSlotsMock.mockImplementation(async (courtId, date) => grid(courtId, date ?? '2026-11-22'))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.resetAllMocks()
  })

  it('mostra que está carregando enquanto a grade não chega', () => {
    const wrapper = mount(GradePage)

    expect(wrapper.text()).toContain('Carregando')
  })

  it('lista as quadras ativas, com a primeira já escolhida', async () => {
    const wrapper = mount(GradePage)
    await flushPromises()

    const buttons = wrapper.findAll('[data-test="court"]')
    expect(buttons.map((button) => button.text())).toEqual(['Quadra 1', 'Quadra 2'])
    expect(buttons.map((button) => button.attributes('aria-pressed'))).toEqual(['true', 'false'])
  })

  it('pede a grade da primeira quadra sem dia e abre no dia que a API devolveu', async () => {
    const wrapper = mount(GradePage)
    await flushPromises()

    expect(getSlotsMock).toHaveBeenCalledWith('q1', undefined)
    expect(wrapper.text()).toContain('domingo, 22/11')
  })

  it('mostra os horários em ordem com as situações "livre" e "bloqueado"', async () => {
    const wrapper = mount(GradePage)
    await flushPromises()

    const slots = wrapper.findAll('[data-test="slot"]')
    expect(slots).toHaveLength(2)
    expect(slots[0]?.text()).toContain('08:00')
    expect(slots[0]?.text()).toContain('livre')
    expect(slots[1]?.text()).toContain('09:00')
    expect(slots[1]?.text()).toContain('bloqueado')
  })

  it('escolher outra quadra pede a grade dela no mesmo dia', async () => {
    const wrapper = mount(GradePage)
    await flushPromises()

    await wrapper.findAll('[data-test="court"]')[1]?.trigger('click')
    await flushPromises()

    expect(getSlotsMock).toHaveBeenLastCalledWith('q2', '2026-11-22')
    const buttons = wrapper.findAll('[data-test="court"]')
    expect(buttons.map((button) => button.attributes('aria-pressed'))).toEqual(['false', 'true'])
  })

  it('trocar de dia pede a grade daquele dia na quadra escolhida', async () => {
    const wrapper = mount(GradePage)
    await flushPromises()

    await wrapper.get('button[aria-label="Próximo dia"]').trigger('click')
    await flushPromises()

    expect(getSlotsMock).toHaveBeenLastCalledWith('q1', '2026-11-23')
    expect(wrapper.text()).toContain('segunda-feira, 23/11')
  })
})
