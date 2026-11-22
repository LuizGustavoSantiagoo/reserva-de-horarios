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

describe('sessão nas chamadas', () => {
  const STORAGE_KEY = 'reserva.token'
  const TOKEN = 'abc.def.ghi'
  const fetchMock = vi.fn<typeof fetch>()

  // O token guardado antes de carregar o cliente é o da sessão em curso (a página foi
  // aberta com ele no `sessionStorage`).
  async function loadClientWithSession(token: string | null): Promise<ClientModule> {
    if (token !== null) sessionStorage.setItem(STORAGE_KEY, token)
    vi.stubGlobal('fetch', fetchMock)
    return loadClient(API_URL)
  }

  // Mesmo registro de módulos do cliente carregado: é a sessão que ele enxerga.
  async function currentToken(): Promise<string | null> {
    const { useSession } = await import('@/shared/composables/useSession')
    return useSession().token.value
  }

  function sentHeaders(callIndex = 0): Headers {
    const [, init] = fetchMock.mock.calls[callIndex] ?? []
    return new Headers(init?.headers)
  }

  function unauthorizedResponse(message: string): Response {
    return jsonResponse(401, {
      statusCode: 401,
      error: 'Unauthorized',
      message,
      path: '/users/me',
      timestamp: '2026-11-22T12:00:00.000Z',
    })
  }

  afterEach(() => {
    fetchMock.mockReset()
    sessionStorage.clear()
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('apiGet manda Authorization: Bearer <token> quando há token guardado', async () => {
    const { apiGet } = await loadClientWithSession(TOKEN)
    fetchMock.mockResolvedValue(jsonResponse(200, { data: {} }))

    await apiGet('/users/me')

    expect(sentHeaders().get('Authorization')).toBe(`Bearer ${TOKEN}`)
  })

  it('apiPost manda Authorization: Bearer <token> e o corpo em JSON', async () => {
    const { apiPost } = await loadClientWithSession(TOKEN)
    fetchMock.mockResolvedValue(jsonResponse(201, { data: { id: 'u1' } }))

    const created = await apiPost<{ id: string }>('/users', { email: 'op@arena.com' })

    expect(created).toEqual({ id: 'u1' })
    const [url, init] = fetchMock.mock.calls[0] ?? []
    expect(String(url)).toBe(`${API_URL}/users`)
    expect(init?.method).toBe('POST')
    expect(init?.body).toBe(JSON.stringify({ email: 'op@arena.com' }))
    expect(sentHeaders().get('Content-Type')).toBe('application/json')
    expect(sentHeaders().get('Authorization')).toBe(`Bearer ${TOKEN}`)
  })

  it('apiGet e apiPost não mandam Authorization quando não há token guardado', async () => {
    const { apiGet, apiPost } = await loadClientWithSession(null)
    fetchMock.mockImplementation(async () => jsonResponse(200, { data: {} }))

    await apiGet('/courts')
    await apiPost('/auth/login', { email: 'a@arena.com', password: 'x' })

    expect(sentHeaders(0).has('Authorization')).toBe(false)
    expect(sentHeaders(1).has('Authorization')).toBe(false)
  })

  it('passa a mandar o token gravado depois de o cliente carregar', async () => {
    const { apiGet } = await loadClientWithSession(null)
    const { useSession } = await import('@/shared/composables/useSession')
    fetchMock.mockImplementation(async () => jsonResponse(200, { data: {} }))

    useSession().setToken(TOKEN)
    await apiGet('/users/me')

    expect(sentHeaders().get('Authorization')).toBe(`Bearer ${TOKEN}`)
  })

  it('401 numa chamada comum limpa a sessão, avisa o onSessionExpired e lança ApiError', async () => {
    const { apiGet, onSessionExpired, ApiError } = await loadClientWithSession(TOKEN)
    const handler = vi.fn<() => void>()
    onSessionExpired(handler)
    fetchMock.mockResolvedValue(unauthorizedResponse('Autenticação necessária.'))

    const error = await apiGet('/users/me').catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ statusCode: 401, message: 'Autenticação necessária.' })
    expect(await currentToken()).toBeNull()
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull()
    expect(handler).toHaveBeenCalledOnce()
  })

  it('401 com { sessionExpiry: false } só lança o ApiError, sem limpar a sessão nem avisar', async () => {
    const { apiPost, onSessionExpired, ApiError } = await loadClientWithSession(TOKEN)
    const handler = vi.fn<() => void>()
    onSessionExpired(handler)
    fetchMock.mockResolvedValue(unauthorizedResponse('E-mail ou senha inválidos.'))

    const error = await apiPost(
      '/auth/login',
      { email: 'a@arena.com', password: 'errada' },
      { sessionExpiry: false },
    ).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ statusCode: 401, message: 'E-mail ou senha inválidos.' })
    expect(await currentToken()).toBe(TOKEN)
    expect(sessionStorage.getItem(STORAGE_KEY)).toBe(TOKEN)
    expect(handler).not.toHaveBeenCalled()
  })

  it('erro que não é 401 não mexe na sessão', async () => {
    const { apiGet, onSessionExpired } = await loadClientWithSession(TOKEN)
    const handler = vi.fn<() => void>()
    onSessionExpired(handler)
    fetchMock.mockResolvedValue(
      jsonResponse(403, {
        statusCode: 403,
        error: 'Forbidden',
        message: 'Seu perfil não tem acesso a esta operação.',
        path: '/users',
        timestamp: '2026-11-22T12:00:00.000Z',
      }),
    )

    await apiGet('/users').catch(() => undefined)

    expect(await currentToken()).toBe(TOKEN)
    expect(handler).not.toHaveBeenCalled()
  })
})
