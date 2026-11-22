# Parecer de Código: Tarefa 10 (história #7, branch 7-entrar-no-painel)

**Veredito:** APONTAMENTOS

Não alterei nenhum arquivo. Usei o shell só para `git diff`, `git status` e para rodar as verificações.

## Como revisei
Passo 1: li `.agents/agents/revisor-codigo.md`, `docs/architecture.md` (v1.9.0), o `docs/design-tokens.md`, a Tarefa 10 do `plan.md` e o parecer `tarefa-09-codigo-r1.md`.
Passo 2: li o diff inteiro (`git diff --cached a9d2594`): 11 arquivos, todos em `apps/web`.
Passo 3: comparei o diff com o código que ele usa: `src/api/client.ts` (tratamento do 401 e `onSessionExpired`), `AdminLayout.vue` inteiro, `LoginPage.vue` e `assets/main.css`.
Passo 4: rodei as verificações e conferi o `git status` depois do lint.

## Verificações
- **web, unitários (`npm run test:unit -- --run`):** 90 de 90 passaram, em 14 arquivos.
- **web, lint (`npm run lint`, com `--fix`):** passou. Depois dele, o `git status` mostra só os 11 arquivos do diff, todos no índice. O lint não mexeu em nenhum arquivo.
- **web, build (`VITE_API_URL=http://localhost:3000 npm run build`):** passou (vue-tsc e vite). `CadastrarOperadorPage` saiu num chunk próprio, então o lazy loading por rota está valendo.
- **api (`npm test`):** 69 de 69 passaram, em 13 arquivos. O diff não mexe na API.

## O que conferi contra a régua
- **`shared/` importando de `features/` (§4):** não acontece. `grep` em `src/shared` e `src/api` não acha nenhum import de `@/features`. O `useSession` declara o próprio `SessionProfile` em vez de importar o `User`, e o comentário explica por quê.
- **Router importando o service:** `guards.ts` importa `getMe`/`ProfileError` de `features/admin/services`. A §4 só regula `pages/`, os domínios entre si e `shared/`. O `router/` não entra nessas regras e já depende de `features/` pelas páginas. A direção é aceitável e não há violação. O efeito é que o `users.service` agora vai no chunk principal, o que é desprezível.
- **O guard não engole erro:** `loadProfile` converte em `null` só o `ProfileError` e relança o resto. Com `null`, a navegação vai para `/admin`, e o `AdminLayout` busca o perfil de novo e mostra o erro com "Tentar de novo". Então a falha aparece na tela. Num 401 durante o guard, o client limpa a sessão e chama o handler. O guard devolve `admin`, roda de novo sem token e acaba no login. O token é mantido em caso de falha de rede, e há teste para isso.
- **Camadas:** a página só fala com o `users.service`, e o service só com o `apiPost` do client. Nenhum `fetch` fora de `src/api/`.
- **Tratamento de erro em `createOperator`:** `ApiError` vira `CreateOperatorError` com `fields` (o 409 vai para o e-mail, o 400 vai campo a campo), `NetworkError` vira a mensagem de conexão, e o resto é relançado. A página relança o que não for `CreateOperatorError`. Recusa sem campo mostra a `message` com `role="alert"`, então nada some.
- **Sessão:** o perfil fica só em memória. `setToken` e `clearSession` descartam o perfil, e há teste para os dois. É `readonly` para fora.
- **Rota:** é filha de `/admin`, lazy, com `meta.roles: ['ADMIN']` tipado por module augmentation (`SessionProfile['role'][]`). O link do `AdminLayout` vai pelo nome da rota, e o spec prova isso com um caminho fictício, sem se prender ao caminho real. Isso foi bem feito.
- **Tokens:** cores, espaçamento e tipografia vêm todos do `@theme`. `h-11`, `size-4`, `max-w-(--container-sm)` e o spinner repetem o que o `LoginPage` já usa. O botão segue o estado "carregando" do `design-tokens.md` (rótulo "Cadastrando…", indicador, inerte).
- **Segredos/URL:** nada escrito no código.
- **Testes:** conferem o que se vê na tela e o estado da sessão. O `guards.spec.ts` usa o `createAppRouter` real.

## Apontamentos (bloqueiam)
1. **O perfil de quem está logado agora é carregado em dois lugares, e o cache criado neste diff só serve a um deles.** Locais: `apps/web/src/router/guards.ts:36-47` (`loadProfile` novo, com cache em `session.profile`) e `apps/web/src/features/admin/pages/AdminLayout.vue:21-29` (`loadProfile` antigo, que sempre chama `getMe` e guarda num `ref` local).
   Regra violada: duplicação de regra que já existe no repo (critério do revisor). O mesmo `getMe` + tratamento de `ProfileError` existe duas vezes, com duas fontes de verdade para o mesmo dado (`session.profile` e `user` do layout). Isso vai contra a ideia da §2/§4 de guardar num composable dedicado o estado que atravessa telas.
   Prejuízo concreto: quem abre `/admin/operadores/novo` direto (recarregar a página ou colar o link) dispara dois `GET /users/me`: um do guard e outro do layout ao montar. Quando "Tentar de novo" dá certo no layout, `session.profile` continua vazio, e a próxima navegação para uma rota com `roles` busca de novo. Daqui a três semanas, qualquer mudança no perfil (outro campo, outra regra de erro, outra rota com `roles`, como a agenda do dia da #10) vai ter que ser feita nos dois lugares, que já se comportam diferente.
   Correção mínima: o `AdminLayout` passa a ler e gravar `session.profile`, ou o guard e o layout passam a usar uma única função de carga.

## Sugestões (não bloqueiam)
- **`User` e `SessionProfile` têm a mesma forma escrita duas vezes** (`users.service.ts:5-11` e `useSession.ts:11-15`). `features/` pode importar de `shared/`, então o service poderia derivar o tipo (`export type User = SessionProfile`, `Role = SessionProfile['role']`). Assim o contrato do `/users/me` fica num lugar só, sem quebrar a §4.
- **A conversão `ApiError | NetworkError` → erro da tela agora aparece três vezes** (`LoginError`, `ProfileError`, `CreateOperatorError`). O parecer da Tarefa 9 já previa que um terceiro caso justificaria um helper comum. O `CreateOperatorError` tem `fields`, mas a parte de mensagem e rede é a mesma.
- **As classes de input e botão primário foram copiadas pela terceira vez** (`CadastrarOperadorPage.vue:274,289,303` e `LoginPage.vue:67,78,89`). A §3 prevê "componentes base (botão, campo, aviso)" em `shared/`. Com três cópias, uma mudança de estado do token (foco, hover, carregando) vai ficar velha em alguma tela.
- **Os mocks repetem a classe `CreateOperatorError` à mão** (`CadastrarOperadorPage.spec.ts:48-57`, `guards.spec.ts:14-20`). Se a classe ganhar um campo, os testes continuam passando com a forma antiga. O `users.service.spec.ts` já mostra o caminho com `importOriginal`: classes reais e só as funções falsas.
- **Live region criada já com conteúdo** (`CadastrarOperadorPage.vue:258-264`). O `<p role="status">` nasce com o `v-if` já preenchido, e alguns leitores de tela não anunciam região viva inserida assim. Deixar o contêiner sempre no DOM e trocar só o texto deixa o anúncio confiável. Isso é mais de acessibilidade que de arquitetura.

## Observações fora do escopo deste diff
- Continua aberto: `lint:oxlint` e `lint:eslint` do `apps/web` rodam com `--fix`, então o `npm run lint` pode reescrever arquivos. É candidato a Issue de manutenção (separar `lint` de `lint:fix`). Desta vez nenhum arquivo mudou.
- `LoginPage.vue:77` continua com `${emailId}-erro` no `aria-describedby` do campo de senha, como já apontado nas Tarefas 8 e 9. A página nova faz certo (`${passwordId}-erro`).
