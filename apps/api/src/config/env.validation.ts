export interface Env {
  DATABASE_URL: string;
  /** Origem do frontend que o navegador deixa ler as respostas da API (CORS). */
  CORS_ORIGIN: string;
}

function requireVariable(
  config: Record<string, unknown>,
  name: keyof Env,
): string {
  const value = config[name];

  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Variável de ambiente obrigatória ausente: ${name}`);
  }

  return value;
}

// Usada pelo ConfigModule no boot: variável obrigatória faltando derruba a API na subida.
export function validateEnv(config: Record<string, unknown>): Env {
  return {
    DATABASE_URL: requireVariable(config, 'DATABASE_URL'),
    CORS_ORIGIN: requireVariable(config, 'CORS_ORIGIN'),
  };
}
