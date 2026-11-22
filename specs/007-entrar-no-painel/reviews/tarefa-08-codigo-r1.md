# Parecer de Código: Tarefa 8, rodada 1

**Veredito:** APROVADO

Não encontrei nada que bloqueie. Há quatro sugestões abaixo, a principal é um comentário falso no `auth.service.spec.ts`. Nenhum arquivo foi alterado.

## Como revisei
Passo 1: li a Tarefa 8 em `specs/007-entrar-no-painel/plan.md` (linhas 339-352), o `docs/architecture.md` (§2, §2.1 item 11, §3 e §4) e o `docs/design-tokens.md`, todos do worktree.
Passo 2: li o diff inteiro (`git diff --cached 460bb709…`, 8 arquivos, +402) e, para contexto, o `src/api/client.ts`, o `main.css`, as classes usadas na grade e o parecer `tarefa-07-codigo-r1.md`.
Passo 3: rodei as verificações.

## Verificações
- **web, unitários:** 53/53 passaram (10 arquivos).
- **web, lint:** passou (oxlint + eslint). Os dois rodam com `--fix`, então conferi o `git status` depois: os 8 arquivos continuam como estavam no índice, sem nenhuma alteração fora dele.
- **web, build** (`VITE_API_URL=http://localhost:3000`): `vue-tsc` passou e o `vite build` também. O `LoginPage` saiu num chunk separado, ou seja, a rota é lazy.
- **api, unitários:** 69/69 passaram (13 arquivos).
- **api, e2e:** 87/87 passaram (8 arquivos). O banco estava no ar (container na porta 5432) e o `.env` aponta para `reserva_us06`. O diff não mexe na API, então isso só confirma que nada regrediu.

## O que conferi
- **Camadas (§4):** a página só chama o `auth.service`. O service é o único que fala com `@/api/client` (`apiPost`). Nenhum `fetch` nem URL fora de `src/api/`. Nenhum domínio importa de outro, e o `shared/` não importa de `features/`.
- **Login com `{ sessionExpiry: false }`:** está como a §4 manda e há teste para isso.
- **Callback de sessão expirada:**
  - `createSessionExpiredHandler(router)` está em `features/admin/session-expired.ts`, como o plano prevê.
  - Ele usa `router.replace` com `{ name: 'admin-login', query: { sessao: 'expirada' } }`. O `client.ts` continua sem conhecer o router.
  - Fica registrado no `main.ts` com `onSessionExpired`.
- **Erros:** o `auth.service` transforma `ApiError` e `NetworkError` em `LoginError` com a mensagem da API ou a de conexão. Qualquer outro erro é relançado, e a página também relança o que não for `LoginError`. Nenhuma falha é engolida, e o `finally` reabilita o botão.
- **Vue (§2):** usa `<script setup lang="ts">`, `ref`/`computed`, ids feitos com `useId()` e rota lazy com `import()`.
- **Tokens:**
  - Cores, espaçamentos e tipografia são só os do `@theme`. `h-11`, `size-4`, `rounded-*` e `border-2` são medidas que o próprio `design-tokens.md` diz não serem espaçamento, e seguem o que a grade já usa.
  - O botão bate com a tabela de estados: normal em `primaria` com letra `texto` e peso 600; hover em `primaria-escura` com letra `superficie`; foco com anel de 3px em `primaria-escura`, afastado 2px; carregando com fundo normal, spinner, rótulo "Entrando…" e botão inerte (`disabled` + `aria-busy`).
  - Os campos usam `text-corpo` (1rem), então o celular não dá zoom ao focar.
- **Segredos e ambiente:** nada escrito no código.
- **Testes:** verificam o que aparece na tela (rótulos, `role="alert"`, `role="status"`, a rota atual, o token na sessão) e não o funcionamento interno. Os testes antigos continuam passando.

## Apontamentos (bloqueiam)
(nenhum)

## Sugestões (não bloqueiam)
- **Comentário falso no teste** — `apps/web/src/features/admin/services/auth.service.spec.ts:5`. O comentário diz "As classes de erro são as de verdade", mas o mock cria cópias falsas de `ApiError` e `NetworkError`. A `NetworkError` falsa, por exemplo, nem recebe `cause`, e a mensagem "Não foi possível conectar ao servidor." está repetida no teste. Se o client mudar essa mensagem, o teste do service continua passando. A correção seria usar as classes reais (`importOriginal`/`vi.importActual`) e mockar só o `apiPost`, ou corrigir o comentário.
- **Rota `/admin` provisória** — `apps/web/src/router/index.ts:18-24`. Ela usa `Promise.resolve({ render: () => h('p', 'Painel') })` em vez de `import()`, e por isso o router passou a importar `h`. Tem um `TODO #7` dizendo que a Tarefa 9 troca isso. Basta conferir lá que a rota provisória e o import de `h` saíram.
- **Chave do storage no teste da página** — `apps/web/src/features/admin/pages/LoginPage.spec.ts:67,84`. O teste confere `sessionStorage.getItem('reserva.token')`, que é como o `useSession` funciona por dentro (já testado na Tarefa 7). Se essa chave mudar, o teste da página quebra sem motivo. Conferir `useSession().token.value` já bastaria.
- **Nome confuso** — `apps/web/src/features/admin/pages/LoginPage.vue:77`. O campo de senha aponta, pelo `aria-describedby`, para `${emailId}-erro`. Funciona, porque a mensagem de erro é uma só para os dois campos, mas o nome engana quem ler o código. Seria mais claro um `errorId = useId()` próprio.
- **Onde fica o `session-expired.ts`** — ele está solto em `features/admin/`, fora de `pages/`, `components/` e `services/` (§3). O plano aprovado previu esse lugar, então não é violação. Se outros arquivos desse tipo aparecerem, vale registrar a exceção na §3.

## Observações fora do escopo deste diff
- Os scripts `lint:oxlint` e `lint:eslint` do `apps/web` rodam com `--fix`. Assim, o `npm run lint` (inclusive no CI e quando um revisor somente leitura roda) pode reescrever arquivos em vez de só apontar problemas. Desta vez não alterou nada, mas é candidato a Issue de manutenção: separar um `lint` só de verificação de um `lint:fix`.
- A sugestão da Tarefa 7 continua aberta: se o callback lançar uma exceção, ela substitui o `ApiError` no `client.ts`. O callback desta tarefa usa `void router.replace(...)` e não lança de forma síncrona, então o risco na prática é baixo.
