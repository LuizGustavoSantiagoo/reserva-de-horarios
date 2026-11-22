import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import CourtPicker from './CourtPicker.vue'

const COURTS = [
  { id: 'q1', name: 'Quadra 1' },
  { id: 'q2', name: 'Quadra 2' },
]

describe('CourtPicker', () => {
  it('lista as quadras num menu rotulado "Quadra", com a escolhida marcada', () => {
    const wrapper = mount(CourtPicker, { props: { courts: COURTS, selectedId: 'q2' } })

    const select = wrapper.get('select')
    const label = wrapper.get(`label[for="${select.attributes('id')}"]`)
    expect(label.text()).toBe('Quadra')
    expect(select.findAll('option').map((option) => option.text())).toEqual([
      'Quadra 1',
      'Quadra 2',
    ])
    expect((select.element as HTMLSelectElement).value).toBe('q2')
  })

  it('escolher outra quadra no menu emite "select" com o id dela', async () => {
    const wrapper = mount(CourtPicker, { props: { courts: COURTS, selectedId: 'q1' } })

    await wrapper.get('select').setValue('q2')

    expect(wrapper.emitted('select')).toEqual([['q2']])
  })
})
