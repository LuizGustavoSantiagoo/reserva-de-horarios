// Usuários do painel, sobre o cliente único de `src/api/` (architecture §4).
// O tipo espelha o `UserDto` do Swagger: o `schema.d.ts` gerado fica fora do Git.
import { ApiError, NetworkError, apiGet } from '@/api/client'

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
