// Usuários do painel, sobre o cliente único de `src/api/` (architecture §4).
// O tipo espelha o `UserDto` do Swagger: o `schema.d.ts` gerado fica fora do Git.
import { ApiError, NetworkError, apiGet, apiPost, type ApiErrorFields } from '@/api/client'

export type Role = 'ADMIN' | 'OPERATOR'

export interface User {
  id: string
  email: string
  role: Role
}

/**
 * O perfil não chegou: a API não respondeu ou falhou. A mensagem é a que a tela mostra — a
 * da API, ou a de falha de conexão. O `401` já foi tratado pelo client (sessão vencida).
 */
export class ProfileError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ProfileError'
  }
}

/** Perfil de quem está logado, o dono do token (CA15). */
export async function getMe(): Promise<User> {
  try {
    return await apiGet<User>('/users/me')
  } catch (error) {
    if (error instanceof ApiError || error instanceof NetworkError) {
      throw new ProfileError(error.message)
    }
    throw error
  }
}

/** Campos do formulário de cadastro de operador que podem receber uma mensagem. */
export type OperatorField = 'email' | 'password'

const OPERATOR_FIELDS: OperatorField[] = ['email', 'password']

/**
 * O cadastro não aconteceu. `fields` traz a mensagem que vai embaixo de cada campo (o
 * `fields` do `400`, ou o `409` no e-mail); sem campo, a tela mostra só a `message` — a da
 * API, ou a de falha de conexão.
 */
export class CreateOperatorError extends Error {
  readonly fields: Partial<Record<OperatorField, string>>

  constructor(message: string, fields: Partial<Record<OperatorField, string>> = {}) {
    super(message)
    this.name = 'CreateOperatorError'
    this.fields = fields
  }
}

/** Cadastra um operador; a API fixa o papel `OPERATOR` (CA7, CA17). */
export async function createOperator(email: string, password: string): Promise<User> {
  try {
    return await apiPost<User>('/users', { email, password })
  } catch (error) {
    if (error instanceof ApiError) {
      // O `409` é o e-mail que já pertence a outra conta: a mensagem vai para esse campo.
      const fields =
        error.statusCode === 409 ? { email: error.message } : messagesByField(error.fields)
      throw new CreateOperatorError(error.message, fields)
    }
    if (error instanceof NetworkError) {
      throw new CreateOperatorError(error.message)
    }
    throw error
  }
}

/** Uma linha por campo do formulário, com as mensagens da API juntas. */
function messagesByField(fields: ApiErrorFields = {}): Partial<Record<OperatorField, string>> {
  const messages: Partial<Record<OperatorField, string>> = {}
  for (const field of OPERATOR_FIELDS) {
    const fieldMessages = fields[field]
    if (fieldMessages?.length) messages[field] = fieldMessages.join(' ')
  }
  return messages
}
