import { existsSync } from 'node:fs';
import { defineConfig } from 'prisma/config';

// O Prisma 7 não carrega o .env sozinho; no CI as variáveis já vêm do ambiente.
if (existsSync('.env')) process.loadEnvFile('.env');

// Administrador criado pelo seed (prisma/seed.ts). Lidas só aqui, não no ConfigModule:
// a API não precisa delas para subir (docs/architecture.md §2.1, item 11).
export const adminSeedEnv = {
  email: process.env['ADMIN_EMAIL'],
  password: process.env['ADMIN_PASSWORD'],
};

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'node prisma/seed.ts',
  },
  datasource: {
    url: process.env['DATABASE_URL'],
  },
});
