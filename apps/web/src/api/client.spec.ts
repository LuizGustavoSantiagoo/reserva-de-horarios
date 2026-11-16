import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type ClientModule = typeof import('./client')

const API_URL = 'https://api.exemplo.test'

// O cliente lê `VITE_API_URL` ao ser carregado; por isso cada teste o importa de novo,
// depois de fixar a variável.
async function loadClient(apiUrl: string | undefined): Promise<ClientModule> {
  vi.stubEnv('VITE_API_URL', apiUrl)
  vi.resetModules()
  return import('./client')
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('endereço da API', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('recusa carregar o cliente quando VITE_API_URL não está definida', async () => {
    await expect(loadClient(undefined)).rejects.toThrow(/VITE_API_URL/)
  })

  it('recusa carregar o cliente quando VITE_API_URL está vazia', async () => {
    await expect(loadClient('')).rejects.toThrow(/VITE_API_URL/)
  })
})

describe('apiGet', () => {
  const fetchMock = vi.fn<typeof fetch>()
  let ApiError: ClientModule['ApiError']
  let NetworkError: ClientModule['NetworkError']
  let apiGet: ClientModule['apiGet']

  beforeEach(async () => {
    vi.stubGlobal('fetch', fetchMock)
    ;({ ApiError, NetworkError, apiGet } = await loadClient(API_URL))
  })

  afterEach(() => {
    fetchMock.mockReset()
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('devolve o conteúdo de data quando a resposta é de sucesso', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { data: [{ id: 'q1', name: 'Quadra 1' }] }))

    const courts = await apiGet<{ id: string; name: string }[]>('/courts')

    expect(courts).toEqual([{ id: 'q1', name: 'Quadra 1' }])
    const [url] = fetchMock.mock.calls[0] ?? []
    expect(String(url)).toBe(`${API_URL}/courts`)
  })

  it('lança ApiError com statusCode, message e fields quando a API recusa', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(400, {
        statusCode: 400,
        error: 'Bad Request',
        message: 'Data inválida',
        fields: { date: ['date deve ser hoje ou depois'] },
        path: '/courts/q1/slots',
        timestamp: '2026-11-13T12:00:00.000Z',
      }),
    )

    const error = await apiGet('/courts/q1/slots?date=2020-01-01').catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({
      statusCode: 400,
      message: 'Data inválida',
      fields: { date: ['date deve ser hoje ou depois'] },
    })
  })

  it('lança ApiError sem fields quando o erro não é de validação', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(404, {
        statusCode: 404,
        error: 'Not Found',
        message: 'Quadra não encontrada',
        path: '/courts/x/slots',
        timestamp: '2026-11-13T12:00:00.000Z',
      }),
    )

    const error = await apiGet('/courts/x/slots').catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ statusCode: 404, message: 'Quadra não encontrada' })
    expect((error as InstanceType<typeof ApiError>).fields).toBeUndefined()
  })

  it('lança ApiError com mensagem genérica quando o erro do servidor não vem no formato da API', async () => {
    fetchMock.mockResolvedValue(new Response('<html>Bad Gateway</html>', { status: 502 }))

    const error = await apiGet('/courts').catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ statusCode: 502 })
    expect((error as InstanceType<typeof ApiError>).message).not.toBe('')
    expect((error as InstanceType<typeof ApiError>).fields).toBeUndefined()
  })

  it('lança NetworkError, e não ApiError, quando a requisição nem chega ao servidor', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))

    const error = await apiGet('/courts').catch((e: unknown) => e)

    expect(error).toBeInstanceOf(NetworkError)
    expect(error).not.toBeInstanceOf(ApiError)
  })
})
