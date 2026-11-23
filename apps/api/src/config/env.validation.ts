export interface Env {
  DATABASE_URL: string;
  /** Origem do frontend que o navegador deixa ler as respostas da API (CORS). */
  CORS_ORIGIN: string;
  /** Segredo que assina e verifica o JWT do painel. */
  JWT_SECRET: string;
  /** Validade do JWT, em segundos. */
  JWT_EXPIRES_IN: number;
}

// 8 horas: um turno de trabalho no painel.
const DEFAULT_JWT_EXPIRES_IN = 28800;

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

function readJwtExpiresIn(config: Record<string, unknown>): number {
  const value = config['JWT_EXPIRES_IN'];

  if (value === undefined) return DEFAULT_JWT_EXPIRES_IN;

  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value.trim())) {
    throw new Error(
      'Variável de ambiente inválida: JWT_EXPIRES_IN deve ser um número inteiro positivo de segundos',
    );
  }

  return Number(value);
}

// Usada pelo ConfigModule no boot: variável obrigatória faltando derruba a API na subida.
export function validateEnv(config: Record<string, unknown>): Env {
  return {
    DATABASE_URL: requireVariable(config, 'DATABASE_URL'),
    CORS_ORIGIN: requireVariable(config, 'CORS_ORIGIN'),
    JWT_SECRET: requireVariable(config, 'JWT_SECRET'),
    JWT_EXPIRES_IN: readJwtExpiresIn(config),
  };
}
