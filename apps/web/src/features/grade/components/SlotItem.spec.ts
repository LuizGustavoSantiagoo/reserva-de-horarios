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

  it('mostra "reservado · Maria" no horário com reserva confirmada', () => {
    const wrapper = mount(SlotItem, {
      props: {
        item: {
          startsAt: '2026-11-22T13:00:00.000Z',
          endsAt: '2026-11-22T14:00:00.000Z',
          status: 'RESERVED',
          firstName: 'Maria',
        },
      },
    })

    expect(wrapper.text()).toContain('10:00')
    expect(wrapper.text()).toContain('reservado · Maria')
  })

  it('mostra "em reserva" sem nome de ninguém', () => {
    const wrapper = mount(SlotItem, {
      props: {
        item: {
          startsAt: '2026-11-22T14:00:00.000Z',
          endsAt: '2026-11-22T15:00:00.000Z',
          status: 'HELD',
        },
      },
    })

    const label = wrapper.get('[data-test="slot-status"]').text()
    expect(label).toBe('em reserva')
  })
})
