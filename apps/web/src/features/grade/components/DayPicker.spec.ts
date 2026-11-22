import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import DayPicker from './DayPicker.vue'

describe('DayPicker', () => {
  it('mostra o dia recebido, com o dia da semana', () => {
    const wrapper = mount(DayPicker, { props: { day: '2026-11-22' } })

    expect(wrapper.text()).toContain('domingo, 22/11')
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
