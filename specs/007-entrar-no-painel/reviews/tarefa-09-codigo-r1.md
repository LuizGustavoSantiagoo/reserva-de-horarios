# Parecer de Código: Tarefa 9 (história #7, branch 7-entrar-no-painel)

**Veredito:** APROVADO

Não alterei nenhum arquivo. Usei o shell só para `git diff`, `git status` e para rodar as verificações.

## Como revisei
Passo 1: li `/home/santiago/Documentos/dev/faculdade/reserva-us06/.agents/agents/revisor-codigo.md`, `docs/architecture.md` (v1.9.0), `docs/design-tokens.md` (v1.2.0), a Tarefa 9 do `plan.md` e os CA15 e CA16 do `spec.md`.
Passo 2: li o diff inteiro (`git diff --cached 0d6c22e`). São 8 arquivos, todos em `apps/web`.
Passo 3: comparei o diff com o código que ele usa: `src/api/client.ts`, `features/admin/services/auth.service.ts`, `LoginPage.vue`, `features/admin/session-expired.ts`, `main.ts` e `assets/main.css`. Li também o parecer `tarefa-08-codigo-r2.md`, onde ficou pendente conferir a rota provisória `/admin` com `h`.
Passo 4: rodei as verificações e conferi o `git status` depois do lint.

## Verificações
- **web, unitários (`npm run test:unit -- --run`):** 68 de 68 passaram, em 13 arquivos.
- **web, lint (`npm run lint`, com `--fix`):** passou. Depois dele, o `git status` mostra só os 8 arquivos do diff, todos no índice. O lint não mexeu em nenhum arquivo.
- **web, build (`VITE_API_URL=http://localhost:3000 npm run build`):** passou (vue-tsc e vite). `AdminLayout` e `PainelPage` saíram em chunks separados, então o lazy loading por rota está valendo.
- **api (`npm test`):** 69 de 69 passaram, em 13 arquivos. O e2e não foi rodado: o diff não mexe na API.

## O que conferi contra a régua
- **Camadas (§4):** nenhuma página chama `fetch`. O `AdminLayout` usa o `users.service`, e o service usa o `apiGet` do client. O token só é lido pelo `useSession` (`shared/composables/`). Nenhum domínio importa de outro: `grade` aparece só no mock do `guards.spec.ts`.
- **Rota provisória:** saiu. O `h` não é mais importado e não sobrou componente inline. As três rotas são lazy (§2), e `/admin` virou rota-mãe com `meta.requiresAuth` e a filha `admin` apontando para a `PainelPage`.
- **Guard (§4):** `requireSession` é uma função pura, ligada com `router.beforeEach`. O comentário deixa claro que o guard é conforto de UX e que quem protege é a API. A tipagem de `RouteMeta` é feita por *module augmentation*, sem `any`. O `/` não tem `meta`, então abre com ou sem token.
- **Tratamento de erro:** nada é engolido. O `getMe` converte só `ApiError` e `NetworkError` em `ProfileError` e relança o resto. O `loadProfile` também relança o que não for `ProfileError`. O `401` continua com o client (limpa a sessão e chama o handler do `main.ts`), sem lógica duplicada no layout.
- **Segredos e URL:** nada escrito no código. O `http://api.test` dos specs é fictício e é preciso porque o client exige `VITE_API_URL` ao ser carregado (§2.1, item 11).
- **Tokens:** cores, espaçamentos e tipografia são todos utilitários do `@theme`. `rounded-*`, `h-11` e `max-w-(--container-6xl)` não são espaçamento pelo `design-tokens.md` e repetem o que `GradePage` e `LoginPage` já usam. O botão "Tentar de novo" segue os estados normal, hover e foco do token, e o texto de erro usa `text-perigo`.
- **Vue (§2):** usa `<script setup lang="ts">`, `ref` para o estado local e `useRouter`, sem Options API.
- **Testes:** conferem o que se vê na tela (texto, `href`, `role="alert"`) e o estado da sessão. O `users.service.spec.ts` já usa as classes de erro reais do client via `importOriginal`, como pediu a r1 da Tarefa 8. O `guards.spec.ts` testa o router de verdade (`createAppRouter`) sobre um histórico em memória, e não uma cópia das rotas.

## Apontamentos (bloqueiam)
(nenhum)

## Sugestões (não bloqueiam)
- **O `router.back()` do `guards.spec.ts` não prova o `replace`** (`apps/web/src/router/guards.spec.ts:84-86`). Mesmo trocando `replace` por `push` no `signOut`, o teste passaria: voltar cairia em `/admin`, e o guard mandaria para o login, porque não há mais token. Hoje quem garante o `replace` é o spy do `AdminLayout.spec.ts:96-104`, que é o que o plano pede. Vale um comentário dizendo que o `back()` testa a soma de guard e Sair, e não o `replace`, para ninguém achar que dá para apagar o spy.
- **`ProfileError` repete o `LoginError`** (`users.service.ts:17-34` e `auth.service.ts:13-36`): mesma classe, mesma conversão de `ApiError | NetworkError` para a mensagem da tela. Com dois usos ainda não compensa abstrair. Se a Tarefa 10 (`createOperator`) trouxer um terceiro, vale um helper comum no service ou em `shared/`.
- **Classes de botão copiadas:** o botão primário do `AdminLayout.vue:77` repete a lista de classes do `LoginPage.vue:89`. A §3 prevê "componentes base (botão…)" em `shared/`. Com a Tarefa 10 vindo aí, extrair um botão base evita que um estado do token (hover, foco) mude numa tela e fique velho em outra. O "Sair" (`:65`) é uma variante secundária (fundo `superficie` com borda) que o `design-tokens.md` não descreve. As cores são tokens, mas vale registrar a variante no doc quando o botão base nascer.
- **Chave `reserva.token` nos specs** (`AdminLayout.spec.ts:102,121`): a mesma sugestão da Tarefa 8, agora em outro arquivo. Se a chave mudar, os testes quebram sem que o comportamento tenha mudado. Daria para conferir pelo `useSession` ou por uma constante exportada.
- **`router/index.ts:44` cria o router com `createWebHistory` ao ser importado.** O `guards.spec.ts` importa o arquivo por causa do `createAppRouter` e acaba montando também o router padrão no jsdom. Hoje não faz mal. Se incomodar, o `createAppRouter` pode ir para outro módulo, e o `index.ts` fica só com o `export default`.

## Observações fora do escopo deste diff
- Continua aberto o que as r1 e r2 da Tarefa 8 já disseram: os scripts `lint:oxlint` e `lint:eslint` do `apps/web` rodam com `--fix`, então o `npm run lint` pode reescrever arquivos. É candidato a Issue de manutenção (separar `lint` de `lint:fix`). Desta vez nenhum arquivo mudou.
- `LoginPage.vue:77` continua usando `${emailId}-erro` no `aria-describedby` do campo de senha, como já foi sugerido na Tarefa 8. O diff não tocou nesse arquivo.
