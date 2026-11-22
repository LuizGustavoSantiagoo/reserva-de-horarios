import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import SlotList from './SlotList.vue'

describe('SlotList', () => {
  it('mostra um item por horário', () => {
    const wrapper = mount(SlotList, {
      props: {
        slots: [
          {
            startsAt: '2026-11-22T11:00:00.000Z',
            endsAt: '2026-11-22T12:00:00.000Z',
            status: 'FREE',
          },
        ],
      },
    })

    expect(wrapper.findAll('[data-test="slot"]')).toHaveLength(1)
    expect(wrapper.text()).not.toContain('Não há horários neste dia')
  })

  it('sem horários, mostra que não há horários nesse dia no lugar da lista', () => {
    const wrapper = mount(SlotList, { props: { slots: [] } })

    expect(wrapper.text()).toContain('Não há horários neste dia')
    expect(wrapper.find('ul').exists()).toBe(false)
  })
})
