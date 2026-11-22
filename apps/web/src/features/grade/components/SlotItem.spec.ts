import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import SlotItem from './SlotItem.vue'

describe('SlotItem', () => {
  it('mostra o horário no fuso de São Paulo e a situação "livre"', () => {
    const wrapper = mount(SlotItem, {
      props: {
        item: {
          startsAt: '2026-11-22T11:00:00.000Z',
          endsAt: '2026-11-22T12:00:00.000Z',
          status: 'FREE',
        },
      },
    })

    expect(wrapper.text()).toContain('08:00')
    expect(wrapper.text()).toContain('09:00')
    expect(wrapper.text()).toContain('livre')
  })

  it('mostra a situação "bloqueado"', () => {
    const wrapper = mount(SlotItem, {
      props: {
        item: {
          startsAt: '2026-11-22T12:00:00.000Z',
          endsAt: '2026-11-22T13:00:00.000Z',
          status: 'BLOCKED',
        },
      },
    })

    expect(wrapper.text()).toContain('09:00')
    expect(wrapper.text()).toContain('bloqueado')
  })
})
