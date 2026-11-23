# Parecer de Código: Tarefa 4 (US06 #7, "Cadastrar operador"), rodada 1

**Veredito:** APROVADO

Revisei o diff completo (`git diff --cached 663973c…`, 15 arquivos) contra `docs/architecture.md` (v1.8.0). Nenhum arquivo alterado.

## Decisões conferidas
1. `RolesGuard` como segundo `APP_GUARD`, logo depois do `AuthGuard` (§2.1 item 6).
2. `@Roles(...roles: Role[])` com o enum do Prisma; `getAllAndOverride`; sem `@Roles` passa; papel fora da lista ou sem `user` → `ForbiddenException(ACCESS_DENIED)`.
3. 403 antes da validação do corpo (guard antes do pipe), provado no e2e.
4. 409 por P2002 no service, sem checagem prévia; outros erros relançados; `Role.OPERATOR` fixo; só o hash argon2 gravado; `PROFILE_SELECT` na resposta.
5. `normalizeEmail` em `src/common/` usada por `LoginDto` e `CreateUserDto`; o seed mantém regra própria (justificado).
6. `ACCESS_DENIED` ao lado de `AUTHENTICATION_REQUIRED`.
7. `withoutTimestamp` em `test/helpers/error-body.ts`, cópias removidas.

Também: controller só delega; formato único de erro; Swagger com 201/400/401/403/409/500 e envelope `data`; sem segredos; testes por comportamento; architecture §2.1 item 6 e Histórico coerentes com o plano.

## Apontamentos (bloqueiam)
Nenhum.

## Sugestões (não bloqueiam)
- Todo 409 paga o custo do hash argon2 (consequência de não fazer checagem prévia).
- Os testes repetem o texto literal do CA10 em vez de importar `ACCESS_DENIED` — mantido de propósito.

## Fora do escopo
- `public-routes.e2e-spec.ts:67` ainda tem um `withoutTimestamp` próprio (outra semântica).

## Testes
apps/api `npm test` 69/69, build ok, lint ok, `npm run test:e2e` 71/71; apps/web 26/26.
