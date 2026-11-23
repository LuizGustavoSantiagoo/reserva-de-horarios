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

  it('mostra "indisponível" no horário que já começou, no estilo desabilitado e sem o selo de livre', () => {
    const wrapper = mount(SlotItem, {
      props: {
        item: {
          startsAt: '2026-11-22T15:00:00.000Z',
          endsAt: '2026-11-22T16:00:00.000Z',
          status: 'UNAVAILABLE',
        },
      },
    })

    expect(wrapper.text()).toContain('12:00')
    expect(wrapper.get('[data-test="slot-status"]').text()).toBe('indisponível')
    expect(wrapper.get('[data-test="slot"]').classes()).toContain('bg-desabilitado')
    expect(wrapper.find('.bg-sucesso').exists()).toBe(false)
  })

  describe('seleção', () => {
    const FREE = {
      startsAt: '2026-11-22T11:00:00.000Z',
      endsAt: '2026-11-22T12:00:00.000Z',
      status: 'FREE' as const,
    }

    it('o livre é um botão com aria-pressed e tocar nele avisa a página', async () => {
      const wrapper = mount(SlotItem, { props: { item: FREE, selected: false } })

      const button = wrapper.get('button')
      expect(button.attributes('aria-pressed')).toBe('false')
      await button.trigger('click')

      expect(wrapper.emitted('toggle')).toHaveLength(1)
    })

    it('o livre selecionado fica marcado (aria-pressed e fundo escuro)', () => {
      const wrapper = mount(SlotItem, { props: { item: FREE, selected: true } })

      const button = wrapper.get('button')
      expect(button.attributes('aria-pressed')).toBe('true')
      expect(button.classes()).toContain('bg-texto')
      expect(button.classes()).toContain('text-superficie')
    })

    it.each(['HELD', 'RESERVED', 'BLOCKED', 'UNAVAILABLE'] as const)(
      '%s não é botão e não reage ao toque',
      async (status) => {
        const wrapper = mount(SlotItem, {
          props: { item: { ...FREE, status, firstName: 'Maria' }, selected: false },
        })

        expect(wrapper.find('button').exists()).toBe(false)
        await wrapper.get('[data-test="slot"]').trigger('click')
        expect(wrapper.emitted('toggle')).toBeUndefined()
      },
    )
  })
})
