# Plano — Issue #8

## Decisões técnicas

**Sem entidade nova nem migration.** `Arena` 1:N `Court` já existe no
`schema.prisma` (`Court.arenaId` com `@relation`). Esta história é a primeira a
**escrever** na relação pela API: criar `Court` ligada à arena única e ler a arena com
as quadras pelo `include`. Nenhuma dependência nova.

**Domínio `arena/` novo** (`apps/api/src/arena/`): `ArenaModule`, `ArenaController`
(`GET /arena`), `ArenaService.findWithCourts()`, que faz um único
`prisma.arena.findFirst({ include: { courts: { orderBy: { name: 'asc' }, select: {
id, name, isActive } } } })`. Sem arena → `NotFoundException('arena não encontrada')`.
`@Roles('ADMIN', 'OPERATOR')` não é preciso: estar logado basta (o `AuthGuard` global
já exige o token); o papel só restringe as escritas.

**Escritas de quadra no domínio `courts/`** (que já existe): `CourtsController` ganha
`POST /courts` e `PATCH /courts/:id`, os dois com `@Roles('ADMIN')`; `GET /courts`
continua `@Public()`. O `CourtsService` ganha `create(name)` e `rename(id, name)`.

- **A arena do cadastro** é lida pelo `ArenaService` exportado (architecture §2.1,
  item 1: um módulo só usa outro pelo service exportado); o `CourtsModule` importa o
  `ArenaModule`. O cliente nunca informa `arenaId` (CA2).
- **Nome:** DTO `CourtNameDto` com `@Transform` de `trim`, `@IsString`, `@IsNotEmpty`
  e `@MaxLength(60)` (mensagens em português); o `whitelist` +
  `forbidNonWhitelisted` do pipe global recusa `arenaId`, `isActive` e qualquer outro
  campo (CA2, CA3).
- **Nome repetido (CA4):** comparação sem diferenciar maiúsculas por
  `findFirst({ where: { arenaId, name: { equals, mode: 'insensitive' }, NOT: { id } } })`
  antes de gravar → `ConflictException('Já existe uma quadra com este nome.')`. Na
  renomeação, o `NOT: { id }` deixa renomear para o próprio nome (CA4). A janela de
  corrida entre a checagem e a gravação é aceita: só o administrador cadastra quadra.
- **Id:** `ParseUUIDPipe` com mensagem apontando o campo `id` (400); id inexistente →
  `NotFoundException('quadra não encontrada')` (CA5).
- **Resposta:** `AdminCourtDto` (`id`, `name`, `isActive`) e `CreatedCourtDto`
  (+ `arenaId`), com `@ApiProperty` para o Swagger (CA8).

**Frontend** (`apps/web/src/features/admin/`):

- `services/courts.service.ts`: `getArena()` (`apiGet('/arena')`) e
  `createCourt(name)` (`apiPost('/courts')`), traduzindo `ApiError`/`NetworkError`
  para erros da tela, como `users.service.ts` já faz (`ProfileError`,
  `CreateOperatorError` com `fields`).
- `pages/QuadrasPage.vue`: rota filha `admin-quadras` (`/admin/quadras`) do
  `AdminLayout`, que herda o `requiresAuth`; estados de carregando, erro com
  **Tentar de novo** e vazio (CA9). O formulário **Nova quadra** aparece só com
  `profile.role === 'ADMIN'`, lido do `useSession` (CA10).
- `AdminLayout.vue`: item de menu **Quadras** para os dois papéis.

## Tarefas

- [ ] **Tarefa 1 — Ver a arena com as suas quadras (API)**
  - Cobre: CA1, CA7 (para `GET /arena`), CA8 (para `GET /arena`)
  - Teste primeiro: e2e `arena.e2e-spec.ts`: `ADMIN` e `OPERATOR` recebem `200` com a
    arena e **todas** as quadras (ativas e inativas) por nome, só com `id`, `name`,
    `isActive`; sem token e com token inválido → `401`; sem arena → `404`
    "arena não encontrada". Unitário do `ArenaService` (ordem e campos). Teste do
    `/docs-json`: `GET /arena` exige Bearer. Falham porque não há rota nem módulo.
  - Arquivos previstos: `apps/api/src/arena/arena.module.ts`, `arena.controller.ts`,
    `arena.service.ts` e spec, `dto/arena.dto.ts`, `apps/api/src/app.module.ts`,
    `apps/api/test/arena.e2e-spec.ts`, `apps/api/test/swagger.e2e-spec.ts`

- [ ] **Tarefa 2 — Cadastrar quadra ligada à arena (API)**
  - Cobre: CA2, CA3, CA4 (cadastro), CA6 (para `POST /courts`), CA7, CA8
  - Teste primeiro: e2e `courts-admin.e2e-spec.ts`: `ADMIN` cria → `201` com
    `arenaId` da arena e nome sem espaços nas pontas; a quadra aparece em `GET /arena`,
    `GET /courts` e `GET /courts/:id/slots` responde `200` sem horários; corpo sem
    `name`, vazio, só espaços, com 61 caracteres, não texto, com `arenaId` ou
    `isActive` → `400` com `fields` e nada gravado; nome igual a outro (maiúsculas e
    espaços diferentes, inclusive de quadra inativa) → `409`; `OPERATOR` → `403`
    também com corpo inválido; sem token → `401`. Unitário do `CourtsService.create`.
    Falham porque não há rota.
  - Arquivos previstos: `apps/api/src/courts/courts.controller.ts`,
    `courts.service.ts` e spec, `courts.module.ts`, `dto/court-name.dto.ts`,
    `dto/admin-court.dto.ts`, `apps/api/src/arena/arena.module.ts` (export),
    `apps/api/test/courts-admin.e2e-spec.ts`, `apps/api/test/swagger.e2e-spec.ts`

- [ ] **Tarefa 3 — Renomear quadra (API)**
  - Cobre: CA4 (renomeação), CA5, CA6 (para `PATCH /courts/:id`), CA7, CA8
  - Teste primeiro: no `courts-admin.e2e-spec.ts`: `ADMIN` renomeia → `200` com o
    nome novo e `isActive` inalterado, visível em `GET /arena` e `GET /courts`;
    renomear para o próprio nome trocando maiúsculas/espaços → `200`; nome de outra
    quadra → `409`; nome inválido → `400` com `fields`; id inexistente → `404`; id
    que não é UUID → `400`; `OPERATOR` → `403` também com id inexistente; sem token →
    `401`. Unitário do `CourtsService.rename`. Falham porque não há rota.
  - Arquivos previstos: `apps/api/src/courts/courts.controller.ts`,
    `courts.service.ts` e spec, `apps/api/test/courts-admin.e2e-spec.ts`,
    `apps/api/test/swagger.e2e-spec.ts`

- [ ] **Tarefa 4 — Quadras no painel: lista e cadastro**
  - Cobre: CA9, CA10
  - Teste primeiro: componente `QuadrasPage`: mostra nome e endereço da arena e as
    quadras por nome com "Ativa"/"Inativa"; carregando; erro de rede ou `500` com
    **Tentar de novo**, que chama de novo; "Nenhuma quadra cadastrada."; `ADMIN`
    cadastra → "Quadra <nome> cadastrada.", a quadra entra na lista na ordem e o campo
    limpa; `400`/`409` → mensagem embaixo do campo e a lista não muda; rede → "Não foi
    possível conectar ao servidor." e o nome continua no campo; **Cadastrar**
    desabilitado durante o pedido; `OPERATOR` não vê o formulário. Unitário do
    `courts.service` (com as classes reais do client). `AdminLayout`: item **Quadras**
    para os dois papéis. Router: sem token, `/admin/quadras` → login. Falham porque não
    há página, service nem rota.
  - **Pedido do usuário (22/11), fora dos CAs:** na grade pública, um link discreto
    **Entrar no painel** que leva a `/admin/login`, para o dono da arena chegar ao
    painel sem digitar o endereço. Teste: o `GradePage` mostra o link com destino
    `admin-login`.
  - Arquivos previstos: `apps/web/src/features/admin/pages/QuadrasPage.vue` e spec,
    `apps/web/src/features/admin/services/courts.service.ts` e spec,
    `apps/web/src/features/admin/pages/AdminLayout.vue` e spec,
    `apps/web/src/router/index.ts`, `apps/web/src/router/guards.spec.ts`,
    `apps/web/src/features/grade/pages/GradePage.vue` e spec (o link)

## Critérios sem tarefa

-
