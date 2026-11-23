// Único ponto do frontend que conhece a URL da API e chama `fetch` (architecture §4).
// Sucesso chega como `{ data }`; erro, como `{ statusCode, error, message, fields?, path, timestamp }`
// (architecture §2.1, item 5).

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

export async function apiGet<T>(path: string): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${BASE_URL}${path}`, { headers: { Accept: 'application/json' } })
  } catch (error) {
    throw new NetworkError(error)
  }

  if (!response.ok) {
    throw await toApiError(response)
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
