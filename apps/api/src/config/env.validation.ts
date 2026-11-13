export interface Env {
  DATABASE_URL: string;
}

// Usada pelo ConfigModule no boot: variável obrigatória faltando derruba a API na subida.
export function validateEnv(config: Record<string, unknown>): Env {
  const databaseUrl = config['DATABASE_URL'];

  if (typeof databaseUrl !== 'string' || databaseUrl.trim() === '') {
    throw new Error('Variável de ambiente obrigatória ausente: DATABASE_URL');
  }

  return { DATABASE_URL: databaseUrl };
}
