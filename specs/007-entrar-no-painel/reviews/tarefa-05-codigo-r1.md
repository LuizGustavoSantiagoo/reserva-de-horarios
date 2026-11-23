# Parecer de Código — Tarefa 5

**Veredito:** APROVADO

Rodada 1. Comparei com `docs/architecture.md` v1.8.0 e li o diff inteiro (`git diff --cached 5f385af…`, 5 arquivos, todos previstos). Suítes: API `npm test` 69/69, build ok, lint sem avisos, `npm run test:e2e` 85/85; web 26/26.

## Decisões verificadas
- **Regra de dono no service (§2.1 item 1):** `findOneFor(requester, id)` lança `ForbiddenException(ACCESS_DENIED)` antes do `findUnique`; o controller só valida e repassa.
- **`@IsUUID` no `UserIdParamDto`:** 400 pelo pipe global com `fields.id` (§2.1 itens 2 e 5); e2e cobre os dois papéis.
- **Ordem das rotas:** `@Get('me')` (linha 26) antes de `@Get(':id')` (linha 127), com comentário; e2e confirma.
- **GET /users com `@Roles('ADMIN')`:** 403 pelo `RolesGuard` global (§2.1 item 6); `findAll` usa o `PROFILE_SELECT`, ordenado por e-mail.
- **Constantes:** `ACCESS_DENIED` reaproveitada; `USER_NOT_FOUND` nova e única.
- **Envelope, erro e Swagger (§2.1 item 5, §2.2):** respostas documentadas; `@ApiBearerAuth()` herdado; `swagger.e2e-spec.ts` confere.
- Sem segredo, sem `process.env`, sem erro engolido.

## Apontamentos (bloqueiam)
Nenhum.

## Sugestões (não bloqueiam)
- `users.e2e-spec.ts`: `expectForbiddenWithoutUserData` e `expectForbidden` (linhas 281-293) quase iguais; um helper com `path` como parâmetro.
- No 403 de `GET /users`, o laço de e-mails repete o helper; só a checagem dos `id` é nova.
- `getAs` e `getMe` fazem papéis parecidos.
