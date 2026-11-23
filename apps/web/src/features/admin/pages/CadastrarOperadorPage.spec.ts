import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { CreateOperatorError, createOperator } from '../services/users.service'
import CadastrarOperadorPage from './CadastrarOperadorPage.vue'

vi.mock('../services/users.service', () => {
  class CreateOperatorError extends Error {
    readonly fields: Partial<Record<'email' | 'password', string>>
    constructor(message: string, fields: Partial<Record<'email' | 'password', string>> = {}) {
      super(message)
      this.fields = fields
    }
  }
  return { CreateOperatorError, createOperator: vi.fn<typeof createOperator>() }
})

const createOperatorMock = vi.mocked(createOperator)

function emailInput(wrapper: VueWrapper) {
  return wrapper.get('input[type="email"]')
}

function passwordInput(wrapper: VueWrapper) {
  return wrapper.get('input[type="password"]')
}

/** A mensagem ligada ao campo pelo `aria-describedby`, ou `undefined` se não houver. */
function messageOf(wrapper: VueWrapper, input: ReturnType<typeof emailInput>) {
  const id = input.attributes('aria-describedby')
  return id ? wrapper.get(`[id="${id}"]`).text() : undefined
}

async function fillAndSubmit(wrapper: VueWrapper, email: string, password: string) {
  await emailInput(wrapper).setValue(email)
  await passwordInput(wrapper).setValue(password)
  await wrapper.get('form').trigger('submit')
  await flushPromises()
}

describe('CadastrarOperadorPage', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('tem os campos de e-mail e senha com rótulo e o botão Cadastrar', () => {
    const wrapper = mount(CadastrarOperadorPage)

    const email = emailInput(wrapper)
    const password = passwordInput(wrapper)
    expect(wrapper.get('h1').text()).toBe('Cadastrar operador')
    expect(wrapper.get(`label[for="${email.attributes('id')}"]`).text()).toBe('E-mail')
    expect(wrapper.get(`label[for="${password.attributes('id')}"]`).text()).toBe('Senha')
    expect(wrapper.get('button[type="submit"]').text()).toBe('Cadastrar')
  })

  it('no envio válido, confirma o cadastro com o e-mail e limpa o formulário', async () => {
    createOperatorMock.mockResolvedValue({ id: 'u3', email: 'carla@arena.com', role: 'OPERATOR' })
    const wrapper = mount(CadastrarOperadorPage)

    await fillAndSubmit(wrapper, 'carla@arena.com', 'senha-do-operador')

    expect(createOperatorMock).toHaveBeenCalledWith('carla@arena.com', 'senha-do-operador')
    expect(wrapper.get('[role="status"]').text()).toBe('Operador carla@arena.com cadastrado.')
    expect((emailInput(wrapper).element as HTMLInputElement).value).toBe('')
    expect((passwordInput(wrapper).element as HTMLInputElement).value).toBe('')
    expect(wrapper.text()).not.toContain('senha-do-operador')
  })

  it('no 400, mostra a mensagem de cada campo embaixo dele e esvazia a senha', async () => {
    createOperatorMock.mockRejectedValue(
      new CreateOperatorError('Dados inválidos.', {
        email: 'Informe um e-mail válido.',
        password: 'A senha deve ter pelo menos 8 caracteres.',
      }),
    )
    const wrapper = mount(CadastrarOperadorPage)

    await fillAndSubmit(wrapper, 'carla', 'curta12')

    expect(messageOf(wrapper, emailInput(wrapper))).toBe('Informe um e-mail válido.')
    expect(messageOf(wrapper, passwordInput(wrapper))).toBe(
      'A senha deve ter pelo menos 8 caracteres.',
    )
    expect(emailInput(wrapper).attributes('aria-invalid')).toBe('true')
    expect(passwordInput(wrapper).attributes('aria-invalid')).toBe('true')
    expect((emailInput(wrapper).element as HTMLInputElement).value).toBe('carla')
    expect((passwordInput(wrapper).element as HTMLInputElement).value).toBe('')
    expect(wrapper.text()).not.toContain('curta12')
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
  })

  it('no 409, mostra "Já existe uma conta com este e-mail." embaixo do e-mail e esvazia a senha', async () => {
    createOperatorMock.mockRejectedValue(
      new CreateOperatorError('Já existe uma conta com este e-mail.', {
        email: 'Já existe uma conta com este e-mail.',
      }),
    )
    const wrapper = mount(CadastrarOperadorPage)

    await fillAndSubmit(wrapper, 'ana@arena.com', 'senha-do-operador')

    expect(messageOf(wrapper, emailInput(wrapper))).toBe('Já existe uma conta com este e-mail.')
    expect(messageOf(wrapper, passwordInput(wrapper))).toBeUndefined()
    expect((passwordInput(wrapper).element as HTMLInputElement).value).toBe('')
    expect(wrapper.text()).not.toContain('senha-do-operador')
  })

  it('numa recusa sem campo (ex.: falha de rede), mostra a mensagem e esvazia a senha', async () => {
    createOperatorMock.mockRejectedValue(
      new CreateOperatorError('Não foi possível conectar ao servidor.'),
    )
    const wrapper = mount(CadastrarOperadorPage)

    await fillAndSubmit(wrapper, 'carla@arena.com', 'senha-do-operador')

    expect(wrapper.get('[role="alert"]').text()).toBe('Não foi possível conectar ao servidor.')
    expect((passwordInput(wrapper).element as HTMLInputElement).value).toBe('')
  })

  it('um novo envio apaga as mensagens da resposta anterior', async () => {
    createOperatorMock
      .mockRejectedValueOnce(
        new CreateOperatorError('Já existe uma conta com este e-mail.', {
          email: 'Já existe uma conta com este e-mail.',
        }),
      )
      .mockResolvedValueOnce({ id: 'u3', email: 'carla@arena.com', role: 'OPERATOR' })
    const wrapper = mount(CadastrarOperadorPage)
    await fillAndSubmit(wrapper, 'ana@arena.com', 'senha-do-operador')

    await fillAndSubmit(wrapper, 'carla@arena.com', 'senha-do-operador')

    expect(messageOf(wrapper, emailInput(wrapper))).toBeUndefined()
    expect(wrapper.text()).not.toContain('Já existe uma conta com este e-mail.')
    expect(wrapper.get('[role="status"]').text()).toBe('Operador carla@arena.com cadastrado.')
  })

  it('desabilita o botão enquanto o cadastro está em andamento', async () => {
    let resolve!: (value: Awaited<ReturnType<typeof createOperator>>) => void
    createOperatorMock.mockReturnValue(new Promise((r) => (resolve = r)))
    const wrapper = mount(CadastrarOperadorPage)

    await emailInput(wrapper).setValue('carla@arena.com')
    await passwordInput(wrapper).setValue('senha-do-operador')
    await wrapper.get('form').trigger('submit')

    const button = wrapper.get('button[type="submit"]')
    expect(button.attributes('disabled')).toBeDefined()
    expect(button.text()).toBe('Cadastrando…')
    await wrapper.get('form').trigger('submit')
    expect(createOperatorMock).toHaveBeenCalledTimes(1)

    resolve({ id: 'u3', email: 'carla@arena.com', role: 'OPERATOR' })
    await flushPromises()

    expect(button.attributes('disabled')).toBeUndefined()
    expect(button.text()).toBe('Cadastrar')
  })
})
