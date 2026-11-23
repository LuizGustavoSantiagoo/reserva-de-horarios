/**
 * Transform do class-transformer para todo e-mail de usuário do painel: sem espaços
 * nas pontas e em minúsculas (`" Ana@Arena.com "` e `"ana@arena.com"` são a mesma
 * conta). O seed aplica a mesma regra em `prisma/admin-seed.ts`, porque não importa
 * nada de `src/`. Uso: `@Transform(normalizeEmail)`.
 */
export function normalizeEmail({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}
