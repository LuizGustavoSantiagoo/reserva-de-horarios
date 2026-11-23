// Arena e quadras do painel, sobre o cliente único de `src/api/` (architecture §4).
// Os tipos espelham as respostas de `GET /arena` e `POST /courts` (CA1, CA2): o
// `schema.d.ts` gerado fica fora do Git.
import { ApiError, NetworkError, apiGet, apiPost } from '@/api/client'

/** Quadra na resposta administrativa: só `id`, `name` e `isActive`. */
export interface AdminCourt {
  id: string
  name: string
  isActive: boolean
}

/** A arena única com todas as suas quadras, ativas e inativas, por nome (CA1). */
export interface Arena {
  id: string
  name: string
  address: string
  courts: AdminCourt[]
}

/** A quadra recém-cadastrada, com a ligação à arena (CA2). */
export interface CreatedCourt extends AdminCourt {
  arenaId: string
}

/**
 * A arena não chegou: a API não respondeu ou falhou. A mensagem é a que a tela mostra — a
 * da API, ou a de falha de conexão. O `401` já foi tratado pelo client (sessão vencida).
 */
export class ArenaError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ArenaError'
  }
}

/** Arena com as quadras, para a página de quadras (CA9). */
export async function getArena(): Promise<Arena> {
  try {
    return await apiGet<Arena>('/arena')
  } catch (error) {
    if (error instanceof ApiError || error instanceof NetworkError) {
      throw new ArenaError(error.message)
    }
    throw error
  }
}

/** Campos do formulário Nova quadra que podem receber uma mensagem. */
export type CourtField = 'name'

/**
 * O cadastro não aconteceu. `fields.name` traz a mensagem que vai embaixo do campo (o
 * `fields` do `400`, ou o `409` do nome repetido); sem campo, a tela mostra só a `message` —
 * a da API, ou a de falha de conexão.
 */
export class CreateCourtError extends Error {
  readonly fields: Partial<Record<CourtField, string>>

  constructor(message: string, fields: Partial<Record<CourtField, string>> = {}) {
    super(message)
    this.name = 'CreateCourtError'
    this.fields = fields
  }
}

/** Cadastra uma quadra; a API a liga à arena única (CA2, CA10). */
export async function createCourt(name: string): Promise<CreatedCourt> {
  try {
    return await apiPost<CreatedCourt>('/courts', { name })
  } catch (error) {
    if (error instanceof ApiError) {
      throw new CreateCourtError(error.message, nameMessage(error))
    }
    if (error instanceof NetworkError) {
      throw new CreateCourtError(error.message)
    }
    throw error
  }
}

/** O `409` é o nome repetido; o `400` aponta o campo em `fields`, com as mensagens juntas. */
function nameMessage(error: ApiError): Partial<Record<CourtField, string>> {
  if (error.statusCode === 409) return { name: error.message }
  const messages = error.fields?.name
  return messages?.length ? { name: messages.join(' ') } : {}
}
