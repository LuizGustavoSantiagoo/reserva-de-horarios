# Parecer de Código — Tarefa 11

**Veredito:** APROVADO

Passo 1: li `/home/santiago/Documentos/dev/faculdade/reserva-us06/.agents/agents/revisor-codigo.md` e `docs/architecture.md` do worktree.
Passo 2: li o diff inteiro com `git diff --cached 6c29d1d`. São 7 arquivos staged: AdminLayout.vue/.spec.ts, LoginPage.vue/.spec.ts, architecture.md, prd.md e specs/README.md.
Passo 3: rodei as verificações.
- web `npm run test:unit -- --run`: 14 arquivos, 94 testes, todos passaram.
- web `npm run lint` (oxlint e eslint com `--fix`): saiu sem erro. Pelo `git status`, o lint não alterou nada: continuam só os 7 arquivos staged e nenhum unstaged.
- web `VITE_API_URL=http://localhost:3000 npm run build`: build ok.
- api `npm test`: 13 arquivos, 69 testes, todos passaram.

Passo 4: conferi cada afirmação da architecture 1.10.0 contra o código. Todas batem.
- **§3, árvore:** `apps/api/src/users/` existe e a indentação está corrigida. `apps/web/src/features/admin/session-expired.ts` está na raiz do domínio, ao lado de `pages/` e `services/`. O `main.ts` registra `onSessionExpired(createSessionExpiredHandler(router))`, e `onSessionExpired` está em `src/api/client.ts`.
- **§4, `useSession`:** fica em `shared/composables/useSession.ts`. O perfil (`id`, `email`, `role`) fica só num `ref` em memória. `setToken` e `clearSession` zeram o perfil, como o texto diz.
- **§4, guard:** `router/guards.ts` tem `requireSession`. Sem token, leva para `admin-login`. Com `meta.roles`, usa `loadProfile()`, que lê o perfil da sessão ou chama `getMe()`. A rota `meta: { roles: ['ADMIN'] }` está em `router/index.ts:38`.
- **§6:** `AuthGuard` e `RolesGuard` existem, as duas são `APP_GUARD` no `app.module.ts:37-39` e moram em `common/auth/`. `@Public()` está em `POST /auth/login`. `@Roles('ADMIN')` está em `@Post()` e `@Get()` de `users.controller.ts:52-53,94-95`. O acesso a dados é `this.prisma.adminUser.*` dentro do `UsersService`.

Código:
- `AdminLayout.vue`: limpar o `errorMessage` antes do retorno antecipado está correto. Não esconde erro: no caminho com `getMe`, o catch continua gravando a mensagem.
- `LoginPage.vue`: o `useId()` próprio para o erro segue o padrão de `useId` que o componente já usava. As classes de token não mudaram, então não há nada a conferir contra `design-tokens.md`.

## Apontamentos (bloqueiam)
Nenhum.

## Sugestões (não bloqueiam)
- `apps/web/src/features/admin/pages/LoginPage.spec.ts`, no teste novo: a última verificação, `expect(errorId).not.toBe(`${email.attributes('id')}-erro`)`, testa que um formato antigo de id não volta. Isso é detalhe de implementação. As verificações anteriores (o id existe, e os dois `aria-describedby` apontam para ele) já cobrem o comportamento que importa. Pode ser removida sem perder cobertura.
- `docs/architecture.md` §6, coluna Guard: `GET /users/:id` não tem `@Roles`. A restrição "o OPERATOR só vê a si mesmo" é feita no `UsersService.findOneFor`. Mencionar isso na linha evitaria que alguém leia a tabela e conclua que a rota está aberta a qualquer papel. Hoje a linha não está errada, só incompleta.
- `docs/architecture.md` §3: `session-expired.ts` é explicado duas vezes, no comentário da árvore e no parágrafo "Exceção". Isso não causa prejuízo, mas basta um dos dois.

## Observações fora do escopo deste diff
- `apps/web/src/features/admin/pages/CadastrarOperadorPage.vue:88`: o `<p role="alert">` do erro geral não tem `id`, e nenhum campo aponta para ele por `aria-describedby`. É o mesmo tipo de lacuna que esta tarefa corrigiu na LoginPage. Os erros por campo (`${emailId}-erro` e `${passwordId}-erro`) estão corretos, cada um derivado do id do seu próprio campo. Pode virar Issue de manutenção de acessibilidade, se a spec da tela exigir.
