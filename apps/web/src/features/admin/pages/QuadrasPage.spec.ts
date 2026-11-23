import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { useSession } from '@/shared/composables/useSession'
import {
  ArenaError,
  CreateCourtError,
  createCourt,
  getArena,
  type Arena,
} from '../services/courts.service'
import QuadrasPage from './QuadrasPage.vue'

vi.mock('../services/courts.service', () => {
  class ArenaError extends Error {}
  class CreateCourtError extends Error {
    readonly fields: Partial<Record<'name', string>>
    constructor(message: string, fields: Partial<Record<'name', string>> = {}) {
      super(message)
      this.fields = fields
    }
  }
  return {
    ArenaError,
    CreateCourtError,
    getArena: vi.fn<typeof getArena>(),
    createCourt: vi.fn<typeof createCourt>(),
  }
})

const getArenaMock = vi.mocked(getArena)
const createCourtMock = vi.mocked(createCourt)

const ADMIN = { id: 'u1', email: 'ana@arena.com', role: 'ADMIN' as const }
const OPERATOR = { id: 'u2', email: 'bia@arena.com', role: 'OPERATOR' as const }

function arena(courts: Arena['courts'] = []): Arena {
  return { id: 'a1', name: 'Arena Beira-Mar', address: 'Av. Atlântica, 100', courts }
}

const COURTS: Arena['courts'] = [
  { id: 'q1', name: 'Quadra 1', isActive: true },
  { id: 'q2', name: 'Quadra 2', isActive: false },
  { id: 'q4', name: 'Quadra 4', isActive: true },
]

async function mountPage() {
  const wrapper = mount(QuadrasPage)
  await flushPromises()
  return wrapper
}

/** Cada quadra da lista como "<nome> <rótulo>", na ordem da tela. */
function courtRows(wrapper: VueWrapper): string[] {
  return wrapper.findAll('[data-test="court"]').map((row) => row.text().replace(/\s+/g, ' '))
}

function nameInput(wrapper: VueWrapper) {
  return wrapper.get('input[type="text"]')
}

function submitButton(wrapper: VueWrapper) {
  return wrapper.get('button[type="submit"]')
}

/** A mensagem ligada ao campo pelo `aria-describedby`, ou `undefined` se não houver. */
function nameMessage(wrapper: VueWrapper): string | undefined {
  const id = nameInput(wrapper).attributes('aria-describedby')
  return id ? wrapper.get(`[id="${id}"]`).text() : undefined
}

async function fillAndSubmit(wrapper: VueWrapper, name: string) {
  await nameInput(wrapper).setValue(name)
  await wrapper.get('form').trigger('submit')
  await flushPromises()
}

describe('QuadrasPage', () => {
  afterEach(() => {
    vi.resetAllMocks()
    useSession().clearSession()
  })

  describe('lista (CA9)', () => {
    beforeEach(() => {
      useSession().setToken('jwt-valido')
      useSession().setProfile(OPERATOR)
    })

    it('mostra o nome e o endereço da arena e as quadras por nome com "Ativa"/"Inativa"', async () => {
      getArenaMock.mockResolvedValue(arena(COURTS))

      const wrapper = await mountPage()

      expect(getArenaMock).toHaveBeenCalledTimes(1)
      expect(wrapper.text()).toContain('Arena Beira-Mar')
      expect(wrapper.text()).toContain('Av. Atlântica, 100')
      expect(courtRows(wrapper)).toEqual(['Quadra 1 Ativa', 'Quadra 2 Inativa', 'Quadra 4 Ativa'])
    })

    it('mostra que está carregando enquanto a arena não chega', async () => {
      getArenaMock.mockReturnValue(new Promise(() => {}))

      const wrapper = await mountPage()

      expect(wrapper.text()).toContain('Carregando')
      expect(wrapper.findAll('[data-test="court"]')).toHaveLength(0)
    })

    it.each([
      ['falha de rede', 'Não foi possível conectar ao servidor.'],
      ['erro do servidor (500)', 'Erro inesperado no servidor.'],
    ])('na %s, mostra a mensagem com Tentar de novo, que busca de novo', async (_caso, message) => {
      getArenaMock
        .mockRejectedValueOnce(new ArenaError(message))
        .mockResolvedValueOnce(arena(COURTS))

      const wrapper = await mountPage()

      expect(wrapper.get('[role="alert"]').text()).toContain(message)
      expect(wrapper.text()).not.toContain('Carregando')
      const retry = wrapper.findAll('button').find((button) => button.text() === 'Tentar de novo')
      expect(retry).toBeDefined()

      await retry?.trigger('click')
      await flushPromises()

      expect(getArenaMock).toHaveBeenCalledTimes(2)
      expect(wrapper.find('[role="alert"]').exists()).toBe(false)
      expect(courtRows(wrapper)).toHaveLength(3)
    })

    it('sem nenhuma quadra, mostra "Nenhuma quadra cadastrada."', async () => {
      getArenaMock.mockResolvedValue(arena([]))

      const wrapper = await mountPage()

      expect(wrapper.text()).toContain('Arena Beira-Mar')
      expect(wrapper.text()).toContain('Nenhuma quadra cadastrada.')
    })

    it('o OPERATOR não vê o formulário Nova quadra (CA10)', async () => {
      getArenaMock.mockResolvedValue(arena(COURTS))

      const wrapper = await mountPage()

      expect(wrapper.find('form').exists()).toBe(false)
      expect(wrapper.text()).not.toContain('Nova quadra')
      expect(wrapper.find('button[type="submit"]').exists()).toBe(false)
    })
  })

  describe('cadastro pelo ADMIN (CA10)', () => {
    beforeEach(() => {
      useSession().setToken('jwt-valido')
      useSession().setProfile(ADMIN)
      getArenaMock.mockResolvedValue(arena(COURTS))
    })

    it('mostra o formulário Nova quadra com o campo de nome e o botão Cadastrar', async () => {
      const wrapper = await mountPage()

      const input = nameInput(wrapper)
      expect(wrapper.text()).toContain('Nova quadra')
      expect(wrapper.get(`label[for="${input.attributes('id')}"]`).text()).toBe('Nome')
      expect(submitButton(wrapper).text()).toBe('Cadastrar')
    })

    it('cadastra: confirma com o nome, põe a quadra na lista na ordem como "Ativa" e limpa o campo', async () => {
      createCourtMock.mockResolvedValue({
        id: 'q3',
        arenaId: 'a1',
        name: 'Quadra 3',
        isActive: true,
      })
      const wrapper = await mountPage()

      await fillAndSubmit(wrapper, '  Quadra 3  ')

      expect(createCourtMock).toHaveBeenCalledWith('  Quadra 3  ')
      expect(wrapper.get('[role="status"]').text()).toBe('Quadra Quadra 3 cadastrada.')
      expect(courtRows(wrapper)).toEqual([
        'Quadra 1 Ativa',
        'Quadra 2 Inativa',
        'Quadra 3 Ativa',
        'Quadra 4 Ativa',
      ])
      expect((nameInput(wrapper).element as HTMLInputElement).value).toBe('')
    })

    it('cadastra a primeira quadra: "Nenhuma quadra cadastrada." sai e a quadra entra', async () => {
      getArenaMock.mockResolvedValue(arena([]))
      createCourtMock.mockResolvedValue({
        id: 'q1',
        arenaId: 'a1',
        name: 'Central',
        isActive: true,
      })
      const wrapper = await mountPage()

      await fillAndSubmit(wrapper, 'Central')

      expect(wrapper.text()).not.toContain('Nenhuma quadra cadastrada.')
      expect(courtRows(wrapper)).toEqual(['Central Ativa'])
    })

    it.each([
      ['400', 'Informe o nome da quadra.'],
      ['409', 'Já existe uma quadra com este nome.'],
    ])('no %s, mostra a mensagem embaixo do campo e a lista não muda', async (_status, message) => {
      createCourtMock.mockRejectedValue(new CreateCourtError(message, { name: message }))
      const wrapper = await mountPage()

      await fillAndSubmit(wrapper, 'quadra 1')

      expect(nameMessage(wrapper)).toBe(message)
      expect(nameInput(wrapper).attributes('aria-invalid')).toBe('true')
      expect(courtRows(wrapper)).toEqual(['Quadra 1 Ativa', 'Quadra 2 Inativa', 'Quadra 4 Ativa'])
      expect(wrapper.find('[role="status"]').exists()).toBe(false)
    })

    it('na falha de rede, mostra "Não foi possível conectar ao servidor." e o nome continua no campo', async () => {
      createCourtMock.mockRejectedValue(
        new CreateCourtError('Não foi possível conectar ao servidor.'),
      )
      const wrapper = await mountPage()

      await fillAndSubmit(wrapper, 'Quadra 3')

      expect(wrapper.get('[role="alert"]').text()).toBe('Não foi possível conectar ao servidor.')
      expect((nameInput(wrapper).element as HTMLInputElement).value).toBe('Quadra 3')
      expect(courtRows(wrapper)).toHaveLength(3)
    })

    it('um novo envio apaga as mensagens da resposta anterior', async () => {
      createCourtMock
        .mockRejectedValueOnce(
          new CreateCourtError('Já existe uma quadra com este nome.', {
            name: 'Já existe uma quadra com este nome.',
          }),
        )
        .mockResolvedValueOnce({ id: 'q3', arenaId: 'a1', name: 'Quadra 3', isActive: true })
      const wrapper = await mountPage()
      await fillAndSubmit(wrapper, 'Quadra 1')

      await fillAndSubmit(wrapper, 'Quadra 3')

      expect(nameMessage(wrapper)).toBeUndefined()
      expect(wrapper.text()).not.toContain('Já existe uma quadra com este nome.')
      expect(wrapper.get('[role="status"]').text()).toBe('Quadra Quadra 3 cadastrada.')
    })

    it('desabilita o botão Cadastrar enquanto o pedido está em andamento', async () => {
      let resolve!: (value: Awaited<ReturnType<typeof createCourt>>) => void
      createCourtMock.mockReturnValue(new Promise((r) => (resolve = r)))
      const wrapper = await mountPage()

      await nameInput(wrapper).setValue('Quadra 3')
      await wrapper.get('form').trigger('submit')

      const button = submitButton(wrapper)
      expect(button.attributes('disabled')).toBeDefined()
      expect(button.text()).toBe('Cadastrando…')
      await wrapper.get('form').trigger('submit')
      expect(createCourtMock).toHaveBeenCalledTimes(1)

      resolve({ id: 'q3', arenaId: 'a1', name: 'Quadra 3', isActive: true })
      await flushPromises()

      expect(button.attributes('disabled')).toBeUndefined()
      expect(button.text()).toBe('Cadastrar')
    })
  })
})
