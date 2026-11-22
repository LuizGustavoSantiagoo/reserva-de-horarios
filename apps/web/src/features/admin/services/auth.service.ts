// Login do painel, sobre o cliente único de `src/api/` (architecture §4).
// O tipo espelha o `AccessTokenDto` do Swagger: o `schema.d.ts` gerado fica fora do Git.
import { ApiError, NetworkError, apiPost } from '@/api/client'

interface AccessToken {
  accessToken: string
}

/**
 * O login não aconteceu: a API recusou (`401`, `400`, `429`) ou não respondeu. A mensagem
 * é a que a tela mostra — a da API, ou a de falha de conexão.
 */
export class LoginError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'LoginError'
  }
}

/** Devolve o token de acesso; quem guarda a sessão é a tela. */
export async function login(email: string, password: string): Promise<string> {
  try {
    // Aqui `401` é senha errada, não sessão vencida: o client não deve limpar nem redirecionar.
    const { accessToken } = await apiPost<AccessToken>(
      '/auth/login',
      { email, password },
      { sessionExpiry: false },
    )
    return accessToken
  } catch (error) {
    if (error instanceof ApiError || error instanceof NetworkError) {
      throw new LoginError(error.message)
    }
    throw error
  }
}
