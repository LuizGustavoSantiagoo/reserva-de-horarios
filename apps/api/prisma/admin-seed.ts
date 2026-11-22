// Validação das variáveis do administrador do seed. Função pura, sem o client gerado:
// o seed não importa nada de src/, por isso a normalização do e-mail mora aqui.

export interface AdminSeedEnv {
  email?: string;
  password?: string;
}

export interface AdminSeedInput {
  email: string;
  password: string;
}

const MIN_PASSWORD_LENGTH = 8;

export function readAdminSeedInput(env: AdminSeedEnv): AdminSeedInput {
  const email = env.email?.trim() ?? '';
  if (email === '') {
    throw new Error('Variável de ambiente obrigatória ausente: ADMIN_EMAIL');
  }

  const password = env.password ?? '';
  if (password === '') {
    throw new Error('Variável de ambiente obrigatória ausente: ADMIN_PASSWORD');
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(
      `Variável de ambiente inválida: ADMIN_PASSWORD deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres`,
    );
  }

  return { email: email.toLowerCase(), password };
}
