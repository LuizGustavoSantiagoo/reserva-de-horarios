# Parecer de Conformidade — Tarefa 11

**Veredito:** APROVADO

Revisão feita só com leitura, em `/home/santiago/Documentos/dev/faculdade/reserva-us06` (branch `7-entrar-no-painel`), sobre `git diff --cached 6c29d1d`. Nenhum arquivo foi alterado.

Passo 1: li `specs/007-entrar-no-painel/spec.md` (`status: aprovada`), com foco no CA13 e no CA15, e a Tarefa 11 do `plan.md`.
Passo 2: li o diff inteiro (7 arquivos).
Passo 3: rodei os testes unitários. apps/web: 14 arquivos e 94 testes, todos passando. apps/api: 13 arquivos e 69 testes, todos passando.
Passo 4: comparei cada afirmação nova da documentação com o código real (`useSession.ts`, `router/guards.ts`, `router/index.ts`, `session-expired.ts`, `main.ts`, `app.module.ts`, `users.controller.ts`, `auth.controller.ts`, `users.service.ts`, `auth.service.ts`).

## Critérios verificados
| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA15: se `GET /users/me` falha, aparece o erro com **Tentar de novo**. O aviso não pode ficar preso quando o guard grava o perfil por outro caminho | atendido | `apps/web/src/features/admin/pages/AdminLayout.vue:24-26` (o `errorMessage = undefined` agora vem antes do retorno antecipado). Teste em `AdminLayout.spec.ts:143-156`: o aviso some, o e-mail aparece e "Carregando o painel…" não aparece |
| CA13: a mensagem de recusa do login fica ligada aos campos (`aria-describedby` com id próprio, não derivado do e-mail) | atendido | `apps/web/src/features/admin/pages/LoginPage.vue:13,67,78,82` (o `errorId = useId()` é usado nos dois campos e no `<p role="alert">`). Teste em `LoginPage.spec.ts:89-103`: confere o id nos dois campos e que ele não é `${emailId}-erro` |
| Fechamento: PRD com US06 em `🟢 Live` e Histórico 1.6.0 | atendido | `docs/prd.md:4,173,355` |
| Fechamento: `specs/README.md` com 007 `implementada` | atendido | `specs/README.md:6` (o frontmatter da spec não foi mexido, como manda a regra 8) |
| Fechamento: architecture §3 (recuo de `users/`, exceção `session-expired.ts`) | atendido e confere com o código | `docs/architecture.md:294,313,324-326`. A exceção bate com `features/admin/session-expired.ts` e com `main.ts:14` (`onSessionExpired(createSessionExpiredHandler(router))`) |
| Fechamento: architecture §4 (perfil só em memória; guard por `meta.roles`) | atendido e confere com o código | `docs/architecture.md:348-357`. `useSession.ts`: `profile` não vai para o `sessionStorage`, `setToken` e `clearSession` zeram o perfil, como diz "trocar o token ou sair o descarta". `guards.ts`: sem token vai ao login; com `meta.roles`, lê o perfil da sessão ou chama `getMe()` e barra quem não tem o papel (manda para `admin`). `index.ts:38` declara `meta: { roles: ['ADMIN'] }` |
| Fechamento: architecture §6 (linha do domínio) | atendido e confere com o código | `docs/architecture.md:522`. `AuthGuard` e `RolesGuard` são registrados como `APP_GUARD` em `app.module.ts:37,39`. Há `@Public()` em `auth.controller.ts:28` e `@Roles('ADMIN')` em `POST /users` e `GET /users` (`users.controller.ts:53,95`). `AdminUser` é acessado por `PrismaService` dentro do `UsersService`, e o `AuthService` passa pelo `UsersService` |
| Fechamento: Histórico 1.10.0 e versão no cabeçalho | atendido | `docs/architecture.md:4,541` |

## Apontamentos

(nenhum)

Não encontrei escopo além do que a tarefa pede: o diff mexe só nos 7 arquivos que o plano previa. Também não vi termo fora do glossário.
