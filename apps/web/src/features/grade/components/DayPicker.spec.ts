import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import DayPicker from './DayPicker.vue'

describe('DayPicker', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('destaca o dia recebido na faixa, com o dia da semana, aria-pressed e aria-current', () => {
    const wrapper = mount(DayPicker, { props: { day: '2026-11-22' } })

    const chosen = wrapper.get('[data-test="day"][aria-current="date"]')
    expect(chosen.attributes('aria-label')).toBe('domingo, 22 de novembro')
    expect(chosen.attributes('aria-pressed')).toBe('true')
    // Só o escolhido fica marcado; os outros dias da faixa não.
    const marks = wrapper
      .findAll('[data-test="day"]')
      .map((day) => [day.attributes('aria-pressed'), day.attributes('aria-current')])
    expect(marks).toEqual([
      ['true', 'date'],
      ['false', undefined],
      ['false', undefined],
      ['false', undefined],
      ['false', undefined],
    ])
  })

  it('a faixa começa no dia recebido e segue pelos próximos, inclusive na virada do mês', () => {
    // O aparelho está em outro dia: a faixa sai do dia recebido, não do relógio dele.
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2030-01-01T12:00:00.000Z'))
    const wrapper = mount(DayPicker, { props: { day: '2026-11-30' } })

    const labels = wrapper.findAll('[data-test="day"]').map((day) => day.attributes('aria-label'))
    expect(labels).toEqual([
      'segunda-feira, 30 de novembro',
      'terça-feira, 1 de dezembro',
      'quarta-feira, 2 de dezembro',
      'quinta-feira, 3 de dezembro',
      'sexta-feira, 4 de dezembro',
    ])
  })

  it('escolher um dia da faixa pede aquele dia', async () => {
    const wrapper = mount(DayPicker, { props: { day: '2026-11-30' } })

    await wrapper.findAll('[data-test="day"]')[2]?.trigger('click')

    expect(wrapper.emitted('change')).toEqual([['2026-12-02']])
  })

  it('"Próximo dia" pede o dia seguinte, inclusive na virada do mês', async () => {
    const wrapper = mount(DayPicker, { props: { day: '2026-11-30' } })

    await wrapper.get('button[aria-label="Próximo dia"]').trigger('click')

    expect(wrapper.emitted('change')).toEqual([['2026-12-01']])
  })

  it('"Dia anterior" pede o dia de antes', async () => {
    const wrapper = mount(DayPicker, { props: { day: '2026-11-22' } })

    await wrapper.get('button[aria-label="Dia anterior"]').trigger('click')

    expect(wrapper.emitted('change')).toEqual([['2026-11-21']])
  })
})
