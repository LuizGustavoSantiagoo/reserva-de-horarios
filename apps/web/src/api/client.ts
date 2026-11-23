// Único ponto do frontend que conhece a URL da API, chama `fetch` e monta cabeçalhos
// (architecture §4): é aqui, e só aqui, que o token da sessão vira `Authorization: Bearer`.
// Sucesso chega como `{ data }`; erro, como `{ statusCode, error, message, fields?, path, timestamp }`
// (architecture §2.1, item 5).

import { useSession } from '@/shared/composables/useSession'

const BASE_URL = requireApiUrl(import.meta.env.VITE_API_URL)

// Sem endereço da API o app não tem o que fazer: a falta derruba o cliente ao ser carregado,
// não no meio de uma requisição, e nunca cai num endereço padrão (architecture §2.1, item 11).
function requireApiUrl(value: string | undefined): string {
  if (!value) {
    throw new Error(
      'VITE_API_URL não definida: no desenvolvimento, copie apps/web/.env.example para ' +
        'apps/web/.env.development; no build de produção, defina-a no ambiente.',
    )
  }
  return value
}

export type ApiErrorFields = Record<string, string[]>

interface ApiErrorBody {
  statusCode: number
  message: string
  fields?: ApiErrorFields
}

/** A API respondeu, mas recusou o pedido (4xx ou 5xx). */
export class ApiError extends Error {
  readonly statusCode: number
  readonly fields?: ApiErrorFields

  constructor(statusCode: number, message: string, fields?: ApiErrorFields) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.fields = fields
  }
}

/** A requisição nem chegou à API (sem conexão, servidor fora do ar, CORS). */
export class NetworkError extends Error {
  constructor(cause: unknown) {
    super('Não foi possível conectar ao servidor.', { cause })
    this.name = 'NetworkError'
  }
}

const GENERIC_ERROR_MESSAGE = 'Erro inesperado no servidor.'

export interface RequestOptions {
  /**
   * `false` quando o `401` da chamada não quer dizer sessão vencida (o login: lá, `401` é
   * senha errada). Padrão: `true`.
   */
  sessionExpiry?: boolean
}

let sessionExpiredHandler: (() => void) | undefined

/** Registra quem é avisado quando a API recusa o token (`401`); a sessão já foi limpa. */
export function onSessionExpired(handler: () => void): void {
  sessionExpiredHandler = handler
}

export function apiGet<T>(path: string, options?: RequestOptions): Promise<T> {
  return request<T>(path, { method: 'GET' }, options)
}

export function apiPost<T>(path: string, body: unknown, options?: RequestOptions): Promise<T> {
  return request<T>(
    path,
    { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } },
    options,
  )
}

async function request<T>(
  path: string,
  init: { method: string; body?: string; headers?: Record<string, string> },
  { sessionExpiry = true }: RequestOptions = {},
): Promise<T> {
  const session = useSession()
  const headers: Record<string, string> = { Accept: 'application/json', ...init.headers }
  // Sem token guardado, o cabeçalho não vai: as rotas públicas (a grade) seguem como antes.
  if (session.token.value) {
    headers.Authorization = `Bearer ${session.token.value}`
  }

  let response: Response
  try {
    response = await fetch(`${BASE_URL}${path}`, { ...init, headers })
  } catch (error) {
    throw new NetworkError(error)
  }

  if (!response.ok) {
    const error = await toApiError(response)
    if (response.status === 401 && sessionExpiry) {
      session.clearSession()
      sessionExpiredHandler?.()
    }
    throw error
  }

  const body = (await response.json()) as { data: T }
  return body.data
}

async function toApiError(response: Response): Promise<ApiError> {
  try {
    const body = (await response.json()) as ApiErrorBody
    return new ApiError(response.status, body.message || GENERIC_ERROR_MESSAGE, body.fields)
  } catch {
    // Corpo fora do formato da API (ex.: página de erro do provedor de hospedagem).
    return new ApiError(response.status, GENERIC_ERROR_MESSAGE)
  }
}
