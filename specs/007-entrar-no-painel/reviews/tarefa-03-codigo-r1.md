# Parecer de Código — Tarefa 3 (US06 #7, "Fechar as rotas que não são públicas"), rodada 1

**Veredito:** APROVADO

Li `docs/architecture.md` (§2.1 itens 1, 5, 6; §2.2; §3), o texto da Tarefa 3 e o diff inteiro (`git diff --cached 42b64f2…`, 23 arquivos). Nenhum arquivo alterado.

## Decisões conferidas
- **`AuthGuard` global via `APP_GUARD`, sem Passport** (§2.1 item 6).
- **Verificação:** `JwtService` global (HS256); `role` contra o enum gerado; `sub` texto; todas as falhas dão a mesma `UnauthorizedException(AUTHENTICATION_REQUIRED)`.
- **`@Public()`** no método nas quatro rotas públicas; `getAllAndOverride` também aceita na classe (testado).
- **`/users/me` com usuário apagado:** 401 no `UsersService.findMe`; controller só delega; `PROFILE_SELECT` (id, email, role); `UserDto` com `@ApiProperty`; envelope `{ data }`.
- **`AUTHENTICATION_REQUIRED`:** constante única (`common/auth/auth-user.ts`).
- **`setupSwagger`** em `common/swagger.ts` com `addBearerAuth()`; `@ApiBearerAuth()` no `UsersController` (§2.2, 1.7.0).
- **Helpers** `tokenFor` e `invalidAuthorizations`; testes por comportamento.
- **Segredos:** nenhum em código de produção.

## Apontamentos (bloqueiam)
Nenhum.

## Sugestões (não bloqueiam)
- `docs/architecture.md:289`: a linha `users/` perdeu os 4 espaços iniciais.
- `withoutTimestamp` repetido em três e2e: levar para `test/helpers/`.
- `sub` bem assinado mas não UUID faria o Prisma responder 500 (improvável; exige o `JWT_SECRET`).
- `AUTHENTICATION_REQUIRED` num arquivo de tipos; `auth.constants.ts` seria mais fácil de achar.

## Fora do escopo
- `main.ts`: `process.env.PORT` (anterior; contraria o §2.1 item 11).

## Testes
apps/api `npm test` 63/63, build ok, lint ok, `npm run test:e2e` 57/57; apps/web 26/26.
