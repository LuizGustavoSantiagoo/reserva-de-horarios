import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import type { LocationQueryRaw } from 'vue-router'
import { getSlots, listCourts } from '../services/grade.service'
import type { SlotGrid } from '../services/grade.service'
import { GradeRefusal } from '../services/grade-refusal'
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

// A página lê e grava a quadra e o dia na query (`?quadra=<id>&dia=YYYY-MM-DD`).
async function mountAt(query: LocationQueryRaw = {}) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', name: 'grade', component: GradePage }],
  })
  await router.push({ path: '/', query })
  await router.isReady()
  const wrapper = mount(GradePage, { global: { plugins: [router] } })
  return { wrapper, router }
}

describe('GradePage', () => {
  beforeEach(() => {
    // O aparelho está em outro dia: a página não pode usar o relógio dele. O intervalo do
    // polling também é falso, para nenhum teste deixar um timer de verdade rodando.
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] })
    vi.setSystemTime(new Date('2030-01-01T12:00:00.000Z'))
    listCourtsMock.mockResolvedValue(COURTS)
    getSlotsMock.mockImplementation(async (courtId, date) => grid(courtId, date ?? '2026-11-22'))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.resetAllMocks()
  })

  it('mostra que está carregando enquanto a grade não chega', async () => {
    const { wrapper } = await mountAt()

    expect(wrapper.text()).toContain('Carregando')
  })

  it('lista as quadras ativas, com a primeira já escolhida', async () => {
    const { wrapper } = await mountAt()
    await flushPromises()

    const select = wrapper.get('select')
    expect(select.findAll('option').map((option) => option.text())).toEqual([
      'Quadra 1',
      'Quadra 2',
    ])
    expect((select.element as HTMLSelectElement).value).toBe('q1')
  })

  it('pede a grade da primeira quadra sem dia e abre no dia que a API devolveu', async () => {
    const { wrapper } = await mountAt()
    await flushPromises()

    expect(getSlotsMock).toHaveBeenCalledWith('q1', undefined)
    expect(wrapper.get('[data-test="grid-heading"]').text()).toContain('domingo, 22 de novembro')
  })

  it('mostra, acima dos horários, o nome da quadra escolhida e o dia por extenso', async () => {
    const { wrapper } = await mountAt()
    await flushPromises()

    const heading = wrapper.get('[data-test="grid-heading"]')
    expect(heading.text()).toContain('Quadra 1')
    expect(heading.text()).toContain('domingo, 22 de novembro')

    await wrapper.get('select').setValue('q2')
    await flushPromises()

    expect(wrapper.get('[data-test="grid-heading"]').text()).toContain('Quadra 2')
  })

  it('mostra os horários em ordem com as situações "livre" e "bloqueado"', async () => {
    const { wrapper } = await mountAt()
    await flushPromises()

    const slots = wrapper.findAll('[data-test="slot"]')
    expect(slots).toHaveLength(2)
    expect(slots[0]?.text()).toContain('08:00')
    expect(slots[0]?.text()).toContain('livre')
    expect(slots[1]?.text()).toContain('09:00')
    expect(slots[1]?.text()).toContain('bloqueado')
  })

  it('escolher outra quadra pede a grade dela no mesmo dia', async () => {
    const { wrapper } = await mountAt()
    await flushPromises()

    await wrapper.get('select').setValue('q2')
    await flushPromises()

    expect(getSlotsMock).toHaveBeenLastCalledWith('q2', '2026-11-22')
    expect((wrapper.get('select').element as HTMLSelectElement).value).toBe('q2')
  })

  it('trocar de dia pede a grade daquele dia na quadra escolhida', async () => {
    const { wrapper } = await mountAt()
    await flushPromises()

    await wrapper.get('button[aria-label="Próximo dia"]').trigger('click')
    await flushPromises()

    expect(getSlotsMock).toHaveBeenLastCalledWith('q1', '2026-11-23')
    expect(wrapper.get('[data-test="grid-heading"]').text()).toContain(
      'segunda-feira, 23 de novembro',
    )
  })

  it('sem nenhuma quadra ativa, mostra "nenhuma quadra disponível" sem seletor de quadra nem de dia', async () => {
    listCourtsMock.mockResolvedValue([])

    const { wrapper } = await mountAt()
    await flushPromises()

    expect(wrapper.text()).toContain('Nenhuma quadra disponível')
    expect(wrapper.text()).not.toContain('Carregando')
    expect(wrapper.find('select').exists()).toBe(false)
    expect(wrapper.find('button[aria-label="Próximo dia"]').exists()).toBe(false)
    expect(getSlotsMock).not.toHaveBeenCalled()
  })

  it('num dia sem agenda, mantém os seletores e mostra que não há horários nesse dia', async () => {
    getSlotsMock.mockImplementation(async (courtId, date) => ({
      ...grid(courtId, date ?? '2026-11-22'),
      slots: [],
    }))

    const { wrapper } = await mountAt()
    await flushPromises()

    expect(wrapper.text()).toContain('Não há horários neste dia')
    expect(wrapper.find('select').exists()).toBe(true)
    expect(wrapper.find('button[aria-label="Próximo dia"]').exists()).toBe(true)
    expect(wrapper.findAll('[data-test="slot"]')).toHaveLength(0)
  })

  describe('quadra e dia na URL', () => {
    it('sem quadra nem dia na URL, pede a primeira quadra sem date e grava na URL a quadra e o dia devolvido', async () => {
      const { router } = await mountAt()
      await flushPromises()

      expect(getSlotsMock).toHaveBeenCalledWith('q1', undefined)
      expect(router.currentRoute.value.query).toEqual({ quadra: 'q1', dia: '2026-11-22' })
    })

    it('abre a quadra e o dia que vieram no link', async () => {
      const { wrapper } = await mountAt({ quadra: 'q2', dia: '2026-11-25' })
      await flushPromises()

      expect(getSlotsMock).toHaveBeenCalledTimes(1)
      expect(getSlotsMock).toHaveBeenCalledWith('q2', '2026-11-25')
      expect((wrapper.get('select').element as HTMLSelectElement).value).toBe('q2')
      expect(wrapper.get('[data-test="grid-heading"]').text()).toContain(
        'quarta-feira, 25 de novembro',
      )
    })

    it('com quadra e sem dia no link, pede aquela quadra sem date e grava o dia devolvido', async () => {
      const { router } = await mountAt({ quadra: 'q2' })
      await flushPromises()

      expect(getSlotsMock).toHaveBeenCalledWith('q2', undefined)
      expect(router.currentRoute.value.query).toEqual({ quadra: 'q2', dia: '2026-11-22' })
    })

    it('trocar de quadra e de dia atualiza a URL sem recarregar a página', async () => {
      const { wrapper, router } = await mountAt()
      await flushPromises()

      await wrapper.get('select').setValue('q2')
      await flushPromises()
      expect(router.currentRoute.value.query).toEqual({ quadra: 'q2', dia: '2026-11-22' })

      await wrapper.get('button[aria-label="Próximo dia"]').trigger('click')
      await flushPromises()
      expect(router.currentRoute.value.query).toEqual({ quadra: 'q2', dia: '2026-11-23' })

      // A página não foi montada de novo: as quadras foram pedidas uma vez só.
      expect(listCourtsMock).toHaveBeenCalledTimes(1)
    })
  })

  describe('link inválido', () => {
    it('quadra não encontrada: mostra a mensagem da API e "Voltar para hoje" abre a primeira quadra no dia de hoje', async () => {
      getSlotsMock.mockImplementation(async (courtId, date) => {
        if (courtId === 'q9') throw new GradeRefusal('court', 'Quadra não encontrada')
        return grid(courtId, date ?? '2026-11-22')
      })

      const { wrapper, router } = await mountAt({ quadra: 'q9', dia: '2026-11-25' })
      await flushPromises()

      expect(wrapper.text()).toContain('Quadra não encontrada')
      expect(wrapper.text()).not.toContain('Carregando')
      expect(wrapper.findAll('[data-test="slot"]')).toHaveLength(0)

      await wrapper.get('button[data-test="back-to-today"]').trigger('click')
      await flushPromises()

      expect(wrapper.find('button[data-test="back-to-today"]').exists()).toBe(false)
      expect(getSlotsMock).toHaveBeenLastCalledWith('q1', undefined)
      expect(router.currentRoute.value.query).toEqual({ quadra: 'q1', dia: '2026-11-22' })
      expect(wrapper.text()).not.toContain('Quadra não encontrada')
      expect(wrapper.findAll('[data-test="slot"]')).toHaveLength(2)
    })

    it('dia recusado: mostra a mensagem do campo da data e "Voltar para hoje" pede a mesma quadra sem date', async () => {
      getSlotsMock.mockImplementation(async (courtId, date) => {
        if (date === '2026-11-01') {
          throw new GradeRefusal('day', 'Não é possível ver um dia que já passou.')
        }
        return grid(courtId, date ?? '2026-11-22')
      })

      const { wrapper, router } = await mountAt({ quadra: 'q2', dia: '2026-11-01' })
      await flushPromises()

      expect(wrapper.text()).toContain('Não é possível ver um dia que já passou.')
      const back = wrapper.get('button[data-test="back-to-today"]')
      expect(back.text()).toBe('Voltar para hoje')

      await back.trigger('click')
      await flushPromises()

      expect(getSlotsMock).toHaveBeenLastCalledWith('q2', undefined)
      expect(router.currentRoute.value.query).toEqual({ quadra: 'q2', dia: '2026-11-22' })
      expect(wrapper.text()).not.toContain('já passou')
      expect(wrapper.findAll('[data-test="slot"]')).toHaveLength(2)
    })
  })

  it('o seletor de dia não volta para antes do today da API, mesmo com o relógio do aparelho em outro dia', async () => {
    // O aparelho marca 2030 (beforeEach); a API diz que hoje é 2026-11-22.
    const { wrapper } = await mountAt()
    await flushPromises()

    const previous = wrapper.get('button[aria-label="Dia anterior"]')
    expect(previous.attributes('disabled')).toBeDefined()
    await previous.trigger('click')
    await flushPromises()

    expect(getSlotsMock).toHaveBeenCalledTimes(1)
  })

  describe('seleção de horários', () => {
    function counter(wrapper: Awaited<ReturnType<typeof mountAt>>['wrapper']) {
      return wrapper.get('[data-test="selection-count"]').text()
    }

    it('tocar num livre marca e o contador mostra "1 horário selecionado"; tocar de novo desmarca', async () => {
      const { wrapper } = await mountAt()
      await flushPromises()

      expect(counter(wrapper)).toBe('0 horários selecionados')
      const free = wrapper.get('[data-test="slot-toggle"]')
      expect(free.attributes('aria-pressed')).toBe('false')

      await free.trigger('click')
      expect(wrapper.get('[data-test="slot-toggle"]').attributes('aria-pressed')).toBe('true')
      expect(counter(wrapper)).toBe('1 horário selecionado')

      await wrapper.get('[data-test="slot-toggle"]').trigger('click')
      expect(wrapper.get('[data-test="slot-toggle"]').attributes('aria-pressed')).toBe('false')
      expect(counter(wrapper)).toBe('0 horários selecionados')
    })

    it('trocar de quadra e de dia mantém a seleção e soma no plural', async () => {
      const { wrapper } = await mountAt()
      await flushPromises()

      await wrapper.get('[data-test="slot-toggle"]').trigger('click')

      await wrapper.get('select').setValue('q2')
      await flushPromises()
      expect(counter(wrapper)).toBe('1 horário selecionado')
      // O mesmo horário na outra quadra é outro horário: não vem marcado.
      expect(wrapper.get('[data-test="slot-toggle"]').attributes('aria-pressed')).toBe('false')
      await wrapper.get('[data-test="slot-toggle"]').trigger('click')
      expect(counter(wrapper)).toBe('2 horários selecionados')

      await wrapper.get('button[aria-label="Próximo dia"]').trigger('click')
      await flushPromises()
      expect(counter(wrapper)).toBe('2 horários selecionados')
      expect(wrapper.get('[data-test="slot-toggle"]').attributes('aria-pressed')).toBe('false')

      await wrapper.get('select').setValue('q1')
      await flushPromises()
      await wrapper.get('button[aria-label="Dia anterior"]').trigger('click')
      await flushPromises()
      expect(getSlotsMock).toHaveBeenLastCalledWith('q1', '2026-11-22')
      expect(wrapper.get('[data-test="slot-toggle"]').attributes('aria-pressed')).toBe('true')
      expect(counter(wrapper)).toBe('2 horários selecionados')
    })

    it('tocar em em reserva, reservado, bloqueado ou indisponível não muda nada', async () => {
      getSlotsMock.mockImplementation(async (courtId, date) => {
        const day = date ?? '2026-11-22'
        return {
          ...grid(courtId, day),
          slots: (['HELD', 'RESERVED', 'BLOCKED', 'UNAVAILABLE'] as const).map((status, i) => ({
            startsAt: `${day}T1${i}:00:00.000Z`,
            endsAt: `${day}T1${i + 1}:00:00.000Z`,
            status,
            ...(status === 'RESERVED' ? { firstName: 'Maria' } : {}),
          })),
        }
      })

      const { wrapper } = await mountAt()
      await flushPromises()

      const slots = wrapper.findAll('[data-test="slot"]')
      expect(slots).toHaveLength(4)
      for (const slot of slots) {
        await slot.trigger('click')
        await slot.findAll('*').at(-1)?.trigger('click')
      }

      expect(wrapper.find('[data-test="slot-toggle"]').exists()).toBe(false)
      expect(counter(wrapper)).toBe('0 horários selecionados')
    })

    it('não existe botão para avançar para a reserva', async () => {
      const { wrapper } = await mountAt()
      await flushPromises()

      await wrapper.get('[data-test="slot-toggle"]').trigger('click')

      // Só existem as setas e os botões de dia (DayPicker) e o próprio horário livre.
      const others = wrapper.findAll('button').filter((button) => {
        const label = button.attributes('aria-label') ?? ''
        const test = button.attributes('data-test')
        return (
          test !== 'day' &&
          test !== 'slot-toggle' &&
          label !== 'Dia anterior' &&
          label !== 'Próximo dia'
        )
      })
      expect(others).toHaveLength(0)
      expect(wrapper.text()).not.toMatch(/reservar|avançar|continuar/i)
    })
  })

  describe('atualização a cada 15 segundos', () => {
    const POLL_MS = 15_000

    function counter(wrapper: Awaited<ReturnType<typeof mountAt>>['wrapper']) {
      return wrapper.get('[data-test="selection-count"]').text()
    }

    // A grade de `grid()`, com o horário livre das 11h UTC já em reserva.
    function heldGrid(courtId: string, date: string): SlotGrid {
      const base = grid(courtId, date)
      return {
        ...base,
        slots: base.slots.map((slot, i) => (i === 0 ? { ...slot, status: 'HELD' } : slot)),
      }
    }

    it('depois de 15 s pede de novo a grade em exibição, sem voltar a mostrar "Carregando"', async () => {
      const { wrapper } = await mountAt({ quadra: 'q2', dia: '2026-11-25' })
      await flushPromises()
      expect(getSlotsMock).toHaveBeenCalledTimes(1)

      // A resposta da atualização demora: a grade antiga continua na tela.
      getSlotsMock.mockReturnValueOnce(new Promise(() => {}))
      vi.advanceTimersByTime(POLL_MS - 1)
      expect(getSlotsMock).toHaveBeenCalledTimes(1)
      vi.advanceTimersByTime(1)
      await flushPromises()

      expect(getSlotsMock).toHaveBeenCalledTimes(2)
      expect(getSlotsMock).toHaveBeenLastCalledWith('q2', '2026-11-25')
      expect(wrapper.text()).not.toContain('Carregando')
      expect(wrapper.findAll('[data-test="slot"]')).toHaveLength(2)
    })

    it('um horário selecionado que voltou como em reserva sai da seleção e o contador cai', async () => {
      const { wrapper } = await mountAt()
      await flushPromises()

      await wrapper.get('[data-test="slot-toggle"]').trigger('click')
      expect(counter(wrapper)).toBe('1 horário selecionado')

      getSlotsMock.mockImplementation(async (courtId, date) =>
        heldGrid(courtId, date ?? '2026-11-22'),
      )
      vi.advanceTimersByTime(POLL_MS)
      await flushPromises()

      expect(wrapper.find('[data-test="slot-toggle"]').exists()).toBe(false)
      expect(wrapper.findAll('[data-test="slot"]')[0]?.text()).toContain('em reserva')
      expect(counter(wrapper)).toBe('0 horários selecionados')
    })

    it('um horário selecionado em outra quadra é reconferido quando aquela grade volta à tela', async () => {
      const { wrapper } = await mountAt()
      await flushPromises()

      await wrapper.get('[data-test="slot-toggle"]').trigger('click')
      await wrapper.get('select').setValue('q2')
      await flushPromises()
      await wrapper.get('[data-test="slot-toggle"]').trigger('click')
      expect(counter(wrapper)).toBe('2 horários selecionados')

      // Enquanto a quadra 2 está na tela, o horário escolhido na quadra 1 foi pré-reservado.
      getSlotsMock.mockImplementation(async (courtId, date) =>
        courtId === 'q1'
          ? heldGrid(courtId, date ?? '2026-11-22')
          : grid(courtId, date ?? '2026-11-22'),
      )
      vi.advanceTimersByTime(POLL_MS)
      await flushPromises()
      // A atualização só pediu a quadra 2, que continua livre: nada sai da seleção.
      expect(getSlotsMock).toHaveBeenLastCalledWith('q2', '2026-11-22')
      expect(counter(wrapper)).toBe('2 horários selecionados')

      await wrapper.get('select').setValue('q1')
      await flushPromises()

      expect(counter(wrapper)).toBe('1 horário selecionado')
    })

    it('a resposta de uma atualização que chega depois da troca de quadra não substitui a grade nova', async () => {
      const { wrapper } = await mountAt()
      await flushPromises()

      let answerPoll: (value: SlotGrid) => void = () => {}
      getSlotsMock.mockReturnValueOnce(new Promise((resolve) => (answerPoll = resolve)))
      vi.advanceTimersByTime(POLL_MS)
      await wrapper.get('select').setValue('q2')
      await flushPromises()

      answerPoll(grid('q1', '2026-11-22'))
      await flushPromises()

      expect(wrapper.get('[data-test="grid-heading"]').text()).toContain('Quadra 2')
    })

    it('uma atualização que falha não interrompe as seguintes', async () => {
      const { wrapper } = await mountAt()
      await flushPromises()

      getSlotsMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))
      vi.advanceTimersByTime(POLL_MS)
      await flushPromises()
      vi.advanceTimersByTime(POLL_MS)
      await flushPromises()

      expect(getSlotsMock).toHaveBeenCalledTimes(3)
      expect(wrapper.findAll('[data-test="slot"]')).toHaveLength(2)
    })

    it('a grade em tela vira passado (meia-noite): pede a grade de hoje sem date e grava o novo dia', async () => {
      const { wrapper, router } = await mountAt()
      await flushPromises()

      // Passou da meia-noite em São Paulo: o dia em tela já é passado e a API recusa.
      getSlotsMock.mockImplementation(async (courtId, date) => {
        if (date === '2026-11-22') {
          throw new GradeRefusal('day', 'Não é possível ver um dia que já passou.')
        }
        return { ...grid(courtId, date ?? '2026-11-23'), today: '2026-11-23' }
      })
      vi.advanceTimersByTime(POLL_MS)
      await flushPromises()

      expect(getSlotsMock).toHaveBeenLastCalledWith('q1', undefined)
      expect(router.currentRoute.value.query).toEqual({ quadra: 'q1', dia: '2026-11-23' })
      expect(wrapper.get('[data-test="grid-heading"]').text()).toContain(
        'segunda-feira, 23 de novembro',
      )
      expect(wrapper.text()).not.toContain('já passou')
    })

    it('desmontar a página limpa o intervalo', async () => {
      const { wrapper } = await mountAt()
      await flushPromises()

      wrapper.unmount()
      vi.advanceTimersByTime(POLL_MS * 2)
      await flushPromises()

      expect(getSlotsMock).toHaveBeenCalledTimes(1)
    })
  })

  describe('falha de rede ou do servidor (CA10)', () => {
    const POLL_MS = 15_000
    const NETWORK_MESSAGE = 'Não foi possível conectar ao servidor.'

    function counter(wrapper: Awaited<ReturnType<typeof mountAt>>['wrapper']) {
      return wrapper.get('[data-test="selection-count"]').text()
    }

    it('a lista de quadras falha na primeira carga: mostra o erro e "Tentar de novo" carrega a grade', async () => {
      listCourtsMock.mockRejectedValueOnce(new Error(NETWORK_MESSAGE))

      const { wrapper } = await mountAt()
      await flushPromises()

      const alert = wrapper.get('[role="alert"]')
      expect(alert.text()).toContain(NETWORK_MESSAGE)
      expect(wrapper.text()).not.toContain('Carregando')
      expect(wrapper.find('select').exists()).toBe(false)

      const retry = wrapper.get('button[data-test="retry"]')
      expect(retry.text()).toBe('Tentar de novo')
      await retry.trigger('click')
      await flushPromises()

      expect(listCourtsMock).toHaveBeenCalledTimes(2)
      expect(getSlotsMock).toHaveBeenCalledWith('q1', undefined)
      expect(wrapper.find('[role="alert"]').exists()).toBe(false)
      expect(wrapper.findAll('[data-test="slot"]')).toHaveLength(2)
    })

    it('a primeira grade falha: mostra o erro e "Tentar de novo" pede de novo a quadra e o dia do link', async () => {
      getSlotsMock.mockRejectedValueOnce(new Error('Erro inesperado no servidor.'))

      const { wrapper } = await mountAt({ quadra: 'q2', dia: '2026-11-25' })
      await flushPromises()

      expect(wrapper.get('[role="alert"]').text()).toContain('Erro inesperado no servidor.')
      expect(wrapper.findAll('[data-test="slot"]')).toHaveLength(0)

      await wrapper.get('button[data-test="retry"]').trigger('click')
      await flushPromises()

      expect(listCourtsMock).toHaveBeenCalledTimes(1)
      expect(getSlotsMock).toHaveBeenCalledTimes(2)
      expect(getSlotsMock).toHaveBeenLastCalledWith('q2', '2026-11-25')
      expect(wrapper.find('[role="alert"]').exists()).toBe(false)
      expect(wrapper.get('[data-test="grid-heading"]').text()).toContain('Quadra 2')
    })

    it('a atualização automática falha: mantém a grade e a seleção e avisa; o aviso some na próxima que der certo', async () => {
      const { wrapper } = await mountAt()
      await flushPromises()
      await wrapper.get('[data-test="slot-toggle"]').trigger('click')

      getSlotsMock.mockRejectedValueOnce(new Error(NETWORK_MESSAGE))
      vi.advanceTimersByTime(POLL_MS)
      await flushPromises()

      const warning = wrapper.get('[data-test="refresh-warning"]')
      expect(warning.text()).toBe('Não foi possível atualizar.')
      const region = wrapper.get('[data-test="refresh-warning-region"]')
      expect(region.attributes('aria-live')).toBe('polite')
      expect(region.element.contains(warning.element)).toBe(true)
      expect(wrapper.find('[role="alert"]').exists()).toBe(false)
      expect(wrapper.findAll('[data-test="slot"]')).toHaveLength(2)
      expect(wrapper.get('[data-test="slot-toggle"]').attributes('aria-pressed')).toBe('true')
      expect(counter(wrapper)).toBe('1 horário selecionado')

      vi.advanceTimersByTime(POLL_MS)
      await flushPromises()

      expect(wrapper.find('[data-test="refresh-warning"]').exists()).toBe(false)
      expect(counter(wrapper)).toBe('1 horário selecionado')
    })

    it('com a grade na tela, a troca de quadra que falha mantém a grade e a quadra em exibição e avisa', async () => {
      const { wrapper, router } = await mountAt()
      await flushPromises()
      await wrapper.get('[data-test="slot-toggle"]').trigger('click')

      getSlotsMock.mockRejectedValueOnce(new Error(NETWORK_MESSAGE))
      await wrapper.get('select').setValue('q2')
      await flushPromises()

      expect(wrapper.get('[data-test="refresh-warning"]').text()).toBe('Não foi possível atualizar.')
      expect(wrapper.get('[data-test="grid-heading"]').text()).toContain('Quadra 1')
      expect((wrapper.get('select').element as HTMLSelectElement).value).toBe('q1')
      expect(router.currentRoute.value.query).toEqual({ quadra: 'q1', dia: '2026-11-22' })
      expect(counter(wrapper)).toBe('1 horário selecionado')

      // A próxima atualização automática pede a grade que está na tela, não a que falhou.
      vi.advanceTimersByTime(POLL_MS)
      await flushPromises()
      expect(getSlotsMock).toHaveBeenLastCalledWith('q1', '2026-11-22')
      expect(wrapper.find('[data-test="refresh-warning"]').exists()).toBe(false)
    })

    it('com a grade na tela, a troca de dia que falha mantém a grade e avisa', async () => {
      const { wrapper } = await mountAt()
      await flushPromises()

      getSlotsMock.mockRejectedValueOnce(new Error(NETWORK_MESSAGE))
      await wrapper.get('button[aria-label="Próximo dia"]').trigger('click')
      await flushPromises()

      expect(wrapper.find('[data-test="refresh-warning"]').exists()).toBe(true)
      expect(wrapper.get('[data-test="grid-heading"]').text()).toContain('domingo, 22 de novembro')
      expect(wrapper.findAll('[data-test="slot"]')).toHaveLength(2)
    })

    it('"Voltar para hoje" que falha por rede mostra o erro com "Tentar de novo"', async () => {
      getSlotsMock.mockImplementation(async (courtId, date) => {
        if (date === '2026-11-01') {
          throw new GradeRefusal('day', 'Não é possível ver um dia que já passou.')
        }
        throw new Error(NETWORK_MESSAGE)
      })

      const { wrapper } = await mountAt({ quadra: 'q2', dia: '2026-11-01' })
      await flushPromises()
      await wrapper.get('button[data-test="back-to-today"]').trigger('click')
      await flushPromises()

      expect(wrapper.get('[role="alert"]').text()).toContain(NETWORK_MESSAGE)
      expect(wrapper.find('button[data-test="back-to-today"]').exists()).toBe(false)

      getSlotsMock.mockImplementation(async (courtId, date) => grid(courtId, date ?? '2026-11-22'))
      await wrapper.get('button[data-test="retry"]').trigger('click')
      await flushPromises()

      expect(getSlotsMock).toHaveBeenLastCalledWith('q2', undefined)
      expect(wrapper.findAll('[data-test="slot"]')).toHaveLength(2)
    })
  })
})
