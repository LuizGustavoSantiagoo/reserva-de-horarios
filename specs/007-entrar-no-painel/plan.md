# Plano — Issue #7

## Decisões técnicas

**Fundação da autenticação.** A US01 (#2) montou o `ConfigModule`, o `PrismaService`, o
pipe, o filtro e o interceptor globais, e deixou o `AuthGuard` para esta história
(`specs/002-grade-publica/plan.md`). Aqui nascem o `AuthGuard` global com `@Public()`, o
`RolesGuard` com `@Roles(...)`, o login com JWT, o limite de tentativas do login e as
rotas de usuário. Dependências novas, todas já listadas na `architecture.md` §2:
`argon2` (Tarefa 1), `@nestjs/jwt` (Tarefa 2) e `@nestjs/throttler` (Tarefa 6). Nenhuma
outra entra; se alguma tarefa parecer exigir outra, o implementador para e escala.

**Entidade nova** (`apps/api/prisma/schema.prisma`, uma migration `usuarios_do_painel`):

| Model | Campos | Observação |
| --- | --- | --- |
| `AdminUser` | `id` (uuid), `email` (único), `passwordHash`, `role` | o nome é o da `architecture.md` §5.1 e do diagrama ER, onde `Block` e `Reservation` já apontam para ele; "usuário do painel" vale para os dois papéis |

Enum novo `Role` (`ADMIN`, `OPERATOR`), usado por `AdminUser.role`. O código da API
importa esse enum do client gerado (`generated/prisma/enums`); ninguém reescreve a lista
de papéis à mão. O e-mail é gravado já normalizado (`trim` + minúsculas), então o índice
único do banco é o que garante o `409` do CA8, sem checagem prévia.

**Seed** (`apps/api/prisma/seed.ts`):

- O seed passa a ter três etapas, nesta ordem: (1) validar `ADMIN_EMAIL` e
  `ADMIN_PASSWORD`, **antes** de tocar no banco; (2) `seedArena()`, que mantém o
  `return` antecipado de hoje ("a arena existe, nada a fazer"); (3) `seedAdmin()`, **fora**
  desse `return`, então roda também num banco em que a arena já existia.
- `seedAdmin()` faz `upsert` pelo e-mail normalizado com `update: {}`: o segundo seed não
  cria outro usuário e não troca a senha do existente (CA1). O hash é `argon2.hash`.
- A validação é uma função pura em `apps/api/prisma/admin-seed.ts` (sem import do client
  gerado), com teste unitário: falta de variável, valor vazio e senha com menos de 8
  caracteres lançam erro com o **nome** da variável; também normaliza o e-mail. O seed
  não importa nada de `src/` (o Node com *type stripping* não resolve os imports `.js`
  do código da API), por isso a normalização mora nesse arquivo.
- **Como ler as duas variáveis sem violar o item 11.** O item 11 só admite `process.env`
  no módulo de configuração e no `prisma.config.ts`. O `prisma.config.ts` passa a ter
  um export nomeado `adminSeedEnv = { email: process.env['ADMIN_EMAIL'], password:
  process.env['ADMIN_PASSWORD'] }`, lido pelo seed do mesmo jeito que ele já lê a URL
  (`import prismaConfig, { adminSeedEnv } from '../prisma.config.ts'`). As duas **não**
  entram no `ConfigModule`: a API não precisa delas para subir. Mudança de texto na
  `architecture.md` §2.1, item 11, feita na Tarefa 1: acrescentar `ADMIN_EMAIL` e
  `ADMIN_PASSWORD` à lista de nomes, "lidas só pelo seed, através do `prisma.config.ts`".

**Configuração (`ConfigModule`, validação no boot).**

- `JWT_SECRET`: obrigatória e não vazia; sem ela a API não sobe (CA1).
- `JWT_EXPIRES_IN`: opcional, em **segundos** (inteiro positivo), padrão `28800` (8 h,
  CA2); valor inválido derruba a API na subida.
- `ADMIN_EMAIL`/`ADMIN_PASSWORD`: só no seed (acima).
- `apps/api/.env.example` ganha os quatro nomes com valores fictícios
  (`JWT_SECRET="troque-este-segredo"`, `JWT_EXPIRES_IN=28800`,
  `ADMIN_EMAIL="admin@exemplo.com"`, `ADMIN_PASSWORD="troque-esta-senha"`).
- **CI (`.github/workflows/ci.yml`).** O `JWT_SECRET` é gerado a cada execução, num
  passo antes dos testes (`echo "JWT_SECRET=$(openssl rand -hex 32)" >> "$GITHUB_ENV"`):
  nenhum segredo escrito no YAML e nenhum *secret* para o usuário configurar no GitHub.
  `JWT_EXPIRES_IN` fica no padrão. **`ADMIN_EMAIL` e `ADMIN_PASSWORD` não entram no
  CI**: o `seed.e2e-spec.ts` passa as duas no `env` do processo filho do
  `npx prisma db seed`, com valores do próprio teste. Assim o CA1 ("e-mail e senha do
  administrador não aparecem em nenhum arquivo") não esbarra num YAML, e o teste
  consegue provar os casos de variável faltando. Para "faltando", o teste passa a
  variável **vazia** (`ADMIN_EMAIL: ''`): o `process.loadEnvFile()` do
  `prisma.config.ts` não sobrescreve variável que já existe no ambiente (conferido no
  Node 22), então o `.env` local do desenvolvedor não mascara o caso.

**Login e token** (módulo `auth/`, `POST /auth/login`, `@HttpCode(200)`).

- `JwtModule.registerAsync({ global: true, ... })` dentro do `AuthModule`, com `secret`
  e `expiresIn` lidos do `ConfigService`, e verificação restrita a `HS256`.
- O token é `signAsync({ sub, role })`: o `@nestjs/jwt` acrescenta só `iat` e `exp`
  (CA2). Resposta `{ data: { accessToken } }` pelo interceptor.
- O `AuthService` não acessa a tabela: pede ao `UsersService` (exportado pelo
  `UsersModule`, §2.1 item 1) as credenciais pelo e-mail normalizado e compara com
  `argon2.verify`. E-mail inexistente e senha errada lançam a **mesma**
  `UnauthorizedException('E-mail ou senha inválidos.')` (CA3). Igualar o tempo de
  resposta está fora de escopo.
- `LoginDto`: `email` com `@Transform` (trim + minúsculas) e `@IsEmail`; `password`
  `@IsString` + `@IsNotEmpty`. O `400` com `fields` vem do `ValidationPipe` (CA3).

**Guards globais** (registrados no `AppModule` como `APP_GUARD`, nesta ordem):

1. `AuthGuard` (`src/common/auth/auth.guard.ts`): se a rota tem `@Public()`, passa sem
   olhar o cabeçalho (um token inválido numa rota pública não atrapalha — CA5). Senão,
   exige `Authorization: Bearer <token>`, verifica assinatura e validade com o
   `JwtService`, confere que o conteúdo tem `sub` texto e `role` do enum, e grava
   `request.user = { id, role }`. Qualquer falha → `UnauthorizedException('Autenticação
   necessária.')`, a mesma mensagem nos cinco casos do CA5. O guard **não** consulta o
   banco (usuário removido ou com papel trocado está fora de escopo).
2. `RolesGuard` (`src/common/auth/roles.guard.ts`): sem `@Roles(...)` na rota, passa; com,
   recusa papel fora da lista com `ForbiddenException('Seu perfil não tem acesso a esta
   operação.')` (CA10).

- Decorators em `src/common/auth/`: `@Public()`, `@Roles(...roles)` e `@CurrentUser()`
  (lê o `request.user`, tipo `AuthUser { id, role }`).
- **Rotas públicas, todas marcadas na mesma tarefa em que o guard liga (Tarefa 3):**
  `GET /` (`AppController`), `GET /courts`, `GET /courts/:courtId/slots` e
  `POST /auth/login`. Ligar o `AuthGuard` sem o `@Public()` nelas fecha a grade.
- CORS: o `Authorization` exige *preflight*. O `enableCors` atual não fixa
  `allowedHeaders`, então o pacote `cors` devolve os cabeçalhos pedidos; a Tarefa 3
  prova isso num e2e em vez de presumir.

**Rotas de usuário** (módulo `users/`, `UsersController` com `@ApiBearerAuth()` na
classe, então toda rota nova dele já sai protegida no Swagger):

| Rota | Quem | Resposta |
| --- | --- | --- |
| `GET /users/me` | os dois papéis | `200 { id, email, role }` do dono do token; `sub` que não existe mais no banco → `401` "Autenticação necessária." |
| `POST /users` | `@Roles('ADMIN')` | `201 { id, email, role: 'OPERATOR' }`; o papel é fixado no service, nunca lido do corpo |
| `GET /users` | `@Roles('ADMIN')` | `200 [{ id, email, role }]` ordenado por `email` |
| `GET /users/:id` | os dois papéis | regra de dono no service (abaixo) |

- **Ordem no controller:** `GET /users/me` declarado **antes** de `GET /users/:id`; ao
  contrário, `me` cairia na validação de UUID e responderia `400`.
- `CreateUserDto`: `email` (`@Transform` trim + minúsculas, `@IsEmail`), `password`
  (`@IsString`, `@MinLength(8)`). Campo não declarado, como `role`, já é `400` pelo
  `forbidNonWhitelisted` (CA8).
- `409`: o `UsersService` captura o `P2002` do `create` e lança
  `ConflictException('Já existe uma conta com este e-mail.')` — o mesmo texto que o
  CA17 mostra na tela. (Sem a captura, o filtro global responderia o genérico "Já existe
  um registro com este valor: email.")
- `UserIdParamDto` com `@IsUUID()` em `id`: o `400` sai com `fields.id` (CA11). O
  `ParseUUIDPipe` não serve, porque não preenche `fields`.
- **Regra de dono** (`UsersService.findOneFor(requester, id)`): `OPERATOR` com `id`
  diferente do próprio → `ForbiddenException` com a mensagem do CA10, **antes** de
  consultar o banco (não revela se o id existe); `ADMIN` → busca, e id inexistente →
  `NotFoundException('Usuário não encontrado.')`.
- **Nenhuma saída leva a senha ou o hash.** Toda consulta de perfil usa uma constante
  `select` com `id`, `email` e `role`; só o método de credenciais (usado pelo login, nunca
  devolvido por rota) seleciona o `passwordHash`. O `UserDto` de saída tem só os três
  campos.

**Limite de tentativas** (Tarefa 6).

- `ThrottlerModule.forRoot({ throttlers: [{ name: 'login', ttl: 600_000, limit: 5 }],
  errorMessage: 'Muitas tentativas de login. Tente de novo em alguns minutos.' })` no
  `AuthModule`, e `@UseGuards(ThrottlerGuard)` **só** na rota de login. Ele **não** é
  `APP_GUARD`: assim nenhuma outra rota é contada (CA4, "o limite vale só para a rota de
  login"). O rastreio é o `req.ip` padrão; `trust proxy` fica para o deploy.
- O guard da rota roda depois dos globais e antes do `ValidationPipe`: tentativa com
  corpo inválido também conta, como pede o "certas ou erradas" do CA4.
- O armazenamento em memória do throttler (`@nestjs/throttler` 6.8, compatível com o Nest
  12) usa `Date.now()`. O e2e prova "passados os 10 minutos" com
  `vi.useFakeTimers({ toFake: ['Date'] })` e avanço de 10 minutos, sem esperar de verdade.

**Isolamento dos e2e.**

- `test/helpers/db.ts`: o `TRUNCATE` passa a incluir `"AdminUser"`.
- `test/helpers/auth.ts` (novo): `createUser(prisma, { email, password, role })` grava
  direto pelo Prisma com `argon2`, e `tokenFor(app, user)` assina com o `JwtService` da
  própria app — é um token válido pela definição da spec. **Só os testes do login
  chamam `POST /auth/login`**; todos os outros e2e pegam o token pelo helper, então não
  gastam as 5 tentativas.
- O contador do throttler vive no provider da app. O `auth.e2e-spec.ts` monta uma app
  **por teste** (`beforeEach`), desde a Tarefa 2: quando a Tarefa 6 ligar o limite,
  nenhum teste de login existente estoura o 6º pedido.

**Swagger.** A montagem sai do `main.ts` para `src/common/swagger.ts`
(`setupSwagger(app)`), no mesmo padrão do `enableCors`: o `main.ts` chama, e o e2e do
CA12 também, porque o `TestingModule` não passa pelo `main.ts`. O `DocumentBuilder` ganha
`addBearerAuth()`. As rotas públicas não declaram segurança nenhuma.

**Frontend.**

- **Domínio único `features/admin/`**, como já prevê a `architecture.md` §3 ("login,
  agenda do dia..."): `pages/LoginPage.vue`, `pages/AdminLayout.vue` (cabeçalho com
  e-mail, papel, menu e **Sair**), `pages/PainelPage.vue` (início do painel, com o
  `// TODO #10` da agenda do dia), `pages/CadastrarOperadorPage.vue`;
  `services/auth.service.ts` (login) e `services/users.service.ts` (`getMe`,
  `createOperator`). Separar em `auth/` e `users/` obrigaria um domínio a importar o
  outro (o layout precisa do perfil e do logout), o que a §4 proíbe.
- **Sessão** em `src/shared/composables/useSession.ts`: um `ref<string | null>` no
  escopo do módulo, iniciado do `sessionStorage` (chave `reserva.token`), com
  `setToken`, `clearSession` (apaga da memória e do `sessionStorage`) e
  `isAuthenticated`. Guarda também o perfil lido de `GET /users/me`, para o guard de
  navegação não buscar duas vezes. Está em `shared/` porque é usado pelo `src/api/` e
  por `features/admin/`, e `shared/` não importa de `features/`.
- **`src/api/client.ts`** é o único que monta o cabeçalho: ganha `apiPost` ao lado do
  `apiGet`, os dois sobre um `request` comum que anexa `Authorization: Bearer <token>`
  quando o `useSession` tem token (e não anexa quando não tem). Em `401`, se a chamada
  não pediu `{ sessionExpiry: false }`, o client chama `clearSession()` e o callback
  registrado com `onSessionExpired(handler)`. Só o `auth.service.login` passa
  `{ sessionExpiry: false }`: o `401` do login é "senha errada", não sessão vencida.
- O callback é registrado em `src/main.ts` e faz
  `router.replace({ name: 'admin-login', query: { sessao: 'expirada' } })`; a
  `LoginPage` mostra "Sua sessão terminou. Entre de novo." quando vê esse `query`. O
  client não importa o router.
- **Rotas** (lazy, como as demais): `/admin/login` (`admin-login`, pública); `/admin`
  (`AdminLayout`, `meta.requiresAuth`) com os filhos `''` (`admin`, `PainelPage`) e
  `operadores/novo` (`admin-novo-operador`, `meta.roles: ['ADMIN']`). A grade (`/`) não
  tem `meta` e continua aberta com ou sem token (CA16).
- **Guard de navegação** (`router.beforeEach`): rota com `requiresAuth` sem token →
  `admin-login`; rota com `meta.roles` → pega o perfil do `useSession` ou de
  `users.service.getMe()` e, se o papel não está na lista, vai para `admin`; se o
  `getMe` falhar por rede, também vai para `admin`, onde o layout mostra o erro com
  **Tentar de novo**. O guard é conforto de UX; quem protege é a API (CA10, CA16).
- **Sair:** `clearSession()` e `router.replace({ name: 'admin-login' })`. Voltar pelo
  navegador cai em `/admin`, e o guard devolve ao login, porque não há mais token
  (CA15).
- Rótulos de papel só no front: `ADMIN` → "Administrador", `OPERATOR` → "Operador".
- Tipos dos services a partir do `schema.d.ts` (`npm run api:types`), como o
  `grade.service.ts`.
- Testes de componente com Vitest + `@vue/test-utils`, services mockados; o client com
  `fetch` mockado. Esta história não traz teste Playwright.

**Ajustes de texto na `architecture.md`**, cada um na tarefa que o torna verdade (com
linha no Histórico e versão nova a cada um):

- Tarefa 1: §5.1, `AdminUser.role` passa a `ADMIN` | `OPERATOR`; §2.1, item 11, ganha
  `ADMIN_EMAIL` e `ADMIN_PASSWORD` (só no seed, via `prisma.config.ts`), o padrão de
  `JWT_EXPIRES_IN` e o `JWT_SECRET` do CI gerado a cada execução.
- Tarefa 3: §2.2, `@ApiBearerAuth()` "nos controllers protegidos" (e não "nos
  administrativos": `/users/me` é protegido e aberto ao `OPERATOR`); §3, pasta
  `users/` na API e `swagger.ts` em `common/`; o comentário do `main.ts` na árvore.
- Tarefa 4: §2.1, item 6, `RolesGuard` com `@Roles(...)` (a lista de papéis, não só
  `'ADMIN'`).
- Tarefa 7: §4, o client anexa o Bearer "a toda chamada, quando há token guardado" (e
  não "a toda chamada administrativa"), e o `useSession` mora em `shared/composables/`.

## Tarefas

- [x] **Tarefa 1 — Criar o administrador pelo seed**
  - Cobre: CA1
  - Teste primeiro: (a) unitário de `env.validation.ts`: falta de `JWT_SECRET` derruba
    com o nome dela; `JWT_EXPIRES_IN` ausente vira `28800`; valor não inteiro ou ≤ 0
    derruba. (b) unitário de `prisma/admin-seed.ts`: falta, valor vazio e senha de 7
    caracteres lançam erro com o nome da variável; o e-mail sai normalizado. (c) e2e
    `seed.e2e-spec.ts`: depois do seed (com `ADMIN_*` no `env` do processo filho) existe
    um `ADMIN` com o e-mail normalizado, o `passwordHash` confere com `argon2.verify` e
    nenhuma coluna da linha é igual à senha; o segundo seed não cria outro usuário nem
    muda o hash; num banco com a arena já existente e sem o admin, o seed cria o admin;
    com `ADMIN_PASSWORD` vazia ou curta, o processo falha, a saída nomeia a variável e
    não há usuário. Falham porque não há model, validação nem etapa de admin no seed.
  - Arquivos previstos: `apps/api/prisma/schema.prisma`,
    `apps/api/prisma/migrations/<data>_usuarios_do_painel/`, `apps/api/prisma/seed.ts`,
    `apps/api/prisma/admin-seed.ts` e `admin-seed.spec.ts`, `apps/api/prisma.config.ts`,
    `apps/api/src/config/env.validation.ts` e spec, `apps/api/test/seed.e2e-spec.ts`,
    `apps/api/test/helpers/db.ts`, `apps/api/.env.example`, `apps/api/package.json`
    (`argon2`), `.github/workflows/ci.yml` (passo do `JWT_SECRET`), `docs/architecture.md`
    (§2.1 item 11, §5.1, Histórico)

- [x] **Tarefa 2 — Entrar com e-mail e senha**
  - Cobre: CA2, CA3
  - Teste primeiro: e2e `auth.e2e-spec.ts` (uma app por teste): `ADMIN` e `OPERATOR`
    entram e recebem `200 { data: { accessToken } }`; o token verifica com o
    `JWT_SECRET`, tem exatamente as chaves `sub`, `role`, `iat`, `exp`, e
    `exp − iat = 28800`; e-mail com maiúsculas e espaços entra na mesma conta; senha
    errada e e-mail inexistente dão `401` com corpos iguais fora o `timestamp`, sem
    `accessToken`; e-mail mal formado e senha vazia dão `400` com `fields.email` e
    `fields.password`; nenhum corpo contém a senha nem `passwordHash`. Falha porque a
    rota não existe.
  - Arquivos previstos: `apps/api/src/auth/` (`auth.module.ts`, `auth.controller.ts`,
    `auth.service.ts`, `dto/login.dto.ts`, `dto/access-token.dto.ts`),
    `apps/api/src/users/` (`users.module.ts`, `users.service.ts` com o método de
    credenciais), `apps/api/src/app.module.ts`, `apps/api/test/auth.e2e-spec.ts`,
    `apps/api/test/helpers/auth.ts`, `apps/api/package.json` (`@nestjs/jwt`)

- [x] **Tarefa 3 — Fechar as rotas que não são públicas**
  - Cobre: CA5, CA6, CA12 (com `/users/me`; `/users` e `/users/:id` entram no teste do
    Swagger nas Tarefas 4 e 5)
  - Teste primeiro: e2e `users.e2e-spec.ts`: `GET /users/me` sem cabeçalho, com valor sem
    `Bearer`, com token de outro segredo, com o `role` adulterado e com token vencido →
    `401` "Autenticação necessária." nos cinco; com token de `ADMIN` e de `OPERATOR` →
    `200` só com `id`, `email`, `role`. E2e das rotas públicas (`GET /`, `GET /courts`,
    `GET /courts/:id/slots`, `POST /auth/login`) sem token e com cada token inválido →
    a mesma resposta de antes. E2e de CORS: *preflight* pedindo `authorization` é
    liberado para a origem do `CORS_ORIGIN`. E2e do `/docs-json` (montado com
    `setupSwagger`): existe o esquema Bearer, `/users/me` exige, as públicas não. O botão
    **Authorize** do `/docs` é conferido à mão e anotado no PR. Falham porque não há
    guard, `@Public()` nem a rota.
  - Arquivos previstos: `apps/api/src/common/auth/` (`auth.guard.ts`, `public.decorator.ts`,
    `current-user.decorator.ts`, `auth-user.ts` e specs), `apps/api/src/common/swagger.ts`,
    `apps/api/src/main.ts`, `apps/api/src/app.module.ts` (`APP_GUARD`),
    `apps/api/src/app.controller.ts`, `apps/api/src/courts/courts.controller.ts`,
    `apps/api/src/slots/slots.controller.ts`, `apps/api/src/auth/auth.controller.ts`,
    `apps/api/src/users/` (`users.controller.ts`, `users.service.ts`, `dto/user.dto.ts`),
    `apps/api/test/users.e2e-spec.ts`, `apps/api/test/public-routes.e2e-spec.ts`,
    `apps/api/test/cors.e2e-spec.ts`, `apps/api/test/swagger.e2e-spec.ts`,
    `docs/architecture.md` (§2.2, §3, Histórico)

- [x] **Tarefa 4 — Cadastrar operador**
  - Cobre: CA7, CA8, CA10 (em `POST /users`; `GET /users` entra na Tarefa 5)
  - Teste primeiro: unitário do `RolesGuard` (sem `@Roles` passa; papel fora da lista →
    `403` com a mensagem do CA10). E2e: `ADMIN` cadastra → `201` com `role: 'OPERATOR'`,
    sem `password` nem `passwordHash`; o hash no banco confere com `argon2.verify`; o novo
    operador entra pelo `POST /auth/login`; e-mail mal formado, senha de 7 caracteres,
    campo faltando e `"role": "ADMIN"` → `400` com cada campo em `fields`, e nenhum
    usuário gravado; e-mail repetido com maiúsculas e espaços → `409` "Já existe uma
    conta com este e-mail.", sem gravar; `OPERATOR` → `403`, sem gravar, sem dado de
    usuário no corpo; o `/docs-json` mostra `POST /users` com o Bearer. Falham porque
    não há guard de papel nem a rota.
  - Arquivos previstos: `apps/api/src/common/auth/` (`roles.guard.ts`,
    `roles.decorator.ts` e spec), `apps/api/src/app.module.ts`,
    `apps/api/src/users/` (controller, service, `dto/create-user.dto.ts`),
    `apps/api/test/users.e2e-spec.ts`, `apps/api/test/swagger.e2e-spec.ts`,
    `docs/architecture.md` (§2.1 item 6, Histórico)

- [x] **Tarefa 5 — Listar e consultar usuários com a regra de dono**
  - Cobre: CA9, CA11, CA10 (em `GET /users`)
  - Teste primeiro: e2e: `ADMIN` em `GET /users` → todos, ordenados por e-mail, só com
    `id`, `email`, `role`; `OPERATOR` → `403` sem dado de usuário. `GET /users/:id`:
    `ADMIN` vê qualquer um e recebe `404` "Usuário não encontrado." para id inexistente;
    `OPERATOR` vê o próprio; `OPERATOR` com id de outra pessoa **e** com id inexistente
    → `403` com corpos iguais fora o `timestamp`; id que não é UUID → `400` com
    `fields.id` para os dois papéis; `GET /users/me` continua respondendo (ordem das
    rotas); o `/docs-json` mostra `/users` e `/users/:id` com o Bearer. Falham porque as
    rotas não existem.
  - Arquivos previstos: `apps/api/src/users/` (controller, service,
    `dto/user-id-param.dto.ts`), `apps/api/test/users.e2e-spec.ts`,
    `apps/api/test/swagger.e2e-spec.ts`

- [x] **Tarefa 6 — Limitar as tentativas de login**
  - Cobre: CA4
  - Teste primeiro: e2e (uma app por teste, `Date` falso): 5 logins, certos ou errados, e
    o 6º com a senha certa → `429` "Muitas tentativas de login. Tente de novo em alguns
    minutos.", sem `accessToken`; avançados 10 minutos, o login volta a dar `200`;
    depois de estourar o login, `GET /courts` e `GET /users/me` (com token) seguem
    respondendo `200`. Os testes de login das Tarefas 2 a 4 continuam verdes. Falha
    porque não há limite.
  - Arquivos previstos: `apps/api/src/auth/auth.module.ts`,
    `apps/api/src/auth/auth.controller.ts`, `apps/api/test/auth.e2e-spec.ts`,
    `apps/api/package.json` (`@nestjs/throttler`)

- [x] **Tarefa 7 — Anexar o token às chamadas do frontend**
  - Cobre: CA14 (cabeçalho, ausência dele e limpeza da sessão no `401`; o
    redirecionamento com o aviso fecha na Tarefa 8)
  - Teste primeiro: unitário de `useSession` (`setToken` grava no `sessionStorage`; um
    módulo recarregado com `vi.resetModules` lê o token de volta — o "recarregar mantém a
    sessão" do CA13; `clearSession` apaga da memória e do `sessionStorage`). Unitário do
    `client.ts` com `fetch` mockado: com token, `apiGet` e `apiPost` mandam
    `Authorization: Bearer <token>`; sem token, não mandam; `401` numa chamada comum
    limpa a sessão e chama o callback de `onSessionExpired`; `401` com
    `{ sessionExpiry: false }` só lança o `ApiError`, sem limpar nada. Falham porque não
    há sessão nem `apiPost`.
  - Arquivos previstos: `apps/web/src/shared/composables/useSession.ts` e spec,
    `apps/web/src/api/client.ts` e `client.spec.ts`, `docs/architecture.md` (§4,
    Histórico)

- [x] **Tarefa 8 — Entrar pela tela de login**
  - Cobre: CA13, CA14 (o redirecionamento com o aviso)
  - Teste primeiro: componente `LoginPage`: credenciais certas → `setToken` e
    `router.push` para `admin`; `401`, `400` e `429` → mensagem da API na tela, sem token
    guardado, na mesma rota; `NetworkError` → "Não foi possível conectar ao servidor.";
    **Entrar** desabilitado enquanto a promessa não resolve; com `?sessao=expirada`
    mostra "Sua sessão terminou. Entre de novo.". Unitário do `auth.service` (chama o
    client com `{ sessionExpiry: false }`). Teste do callback registrado no `main.ts`
    (extraído para uma função testável) levando a `admin-login` com o `query`. Falham
    porque não há tela, rota nem callback.
  - Arquivos previstos: `apps/web/src/features/admin/pages/LoginPage.vue` e spec,
    `apps/web/src/features/admin/services/auth.service.ts` e spec,
    `apps/web/src/router/index.ts`, `apps/web/src/main.ts`,
    `apps/web/src/features/admin/session-expired.ts` e spec (o callback)

- [x] **Tarefa 9 — Mostrar o painel a quem entrou**
  - Cobre: CA15, CA16 (sem token → login; a grade continua aberta)
  - Teste primeiro: componente `AdminLayout`: mostra o e-mail e "Administrador" ou
    "Operador" vindos do `getMe`; **Cadastrar operador** só para `ADMIN`; **Sair** chama
    `clearSession` e `router.replace` para `admin-login`; falha de rede ou `500` no
    `getMe` → mensagem com **Tentar de novo**, que chama o `getMe` de novo, e a sessão
    continua guardada. Teste do router (`createRouter` com memória): sem token, `/admin`
    vai para `/admin/login`; depois do **Sair**, voltar para `/admin` cai no login; `/`
    abre com e sem token. Falham porque não há layout, painel nem guard.
  - Arquivos previstos: `apps/web/src/features/admin/pages/AdminLayout.vue` e spec,
    `apps/web/src/features/admin/pages/PainelPage.vue`,
    `apps/web/src/features/admin/services/users.service.ts` e spec,
    `apps/web/src/router/index.ts`, `apps/web/src/router/guards.ts` e spec

- [ ] **Tarefa 10 — Cadastrar operador pela tela**
  - Cobre: CA17, CA16 (o `OPERATOR` que abre `/admin/operadores/novo` volta a `/admin`;
    o `403` da API já foi provado na Tarefa 4)
  - Teste primeiro: componente `CadastrarOperadorPage`: envio válido → "Operador
    <e-mail> cadastrado." e formulário limpo; `400` → a mensagem de cada campo embaixo
    dele; `409` → "Já existe uma conta com este e-mail." embaixo do e-mail; em todos os
    casos o campo de senha está vazio depois da resposta. Teste do guard: `OPERATOR` em
    `/admin/operadores/novo` → `/admin`; `ADMIN` entra; sem token → login; `getMe` com
    falha de rede → `/admin`. Falham porque não há página nem regra de papel no guard.
  - Arquivos previstos: `apps/web/src/features/admin/pages/CadastrarOperadorPage.vue` e
    spec, `apps/web/src/features/admin/services/users.service.ts` e spec
    (`createOperator`), `apps/web/src/router/index.ts`, `apps/web/src/router/guards.ts`
    e spec

## Critérios sem tarefa

-

---
