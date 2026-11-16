# Parecer de Conformidade — Tarefa 2 (rodada 2)

**Veredito:** APROVADO

A Tarefa 2 atende ao que o plan pede para ela. A correção aceita na rodada 1 foi feita sem trazer nenhum comportamento que a spec não pediu.

**Passo a passo do que fiz:**
Passo 1 -> li `.agents/agents/revisor-conformidade.md` e segui o método dele.
Passo 2 -> li a spec antes de olhar o código. Depois li o plan, os dois pareceres da rodada 1 e o arquivo de decisões dela.
Passo 3 -> li o diff inteiro de `git diff 04d06def…`, com as remoções e sem a pasta `reviews/`.
Passo 4 -> conferi o `.gitignore` e onde `VITE_API_URL` aparece no código.
Passo 5 -> rodei os testes. Não alterei nenhum arquivo, e o `git status` depois mostra só o que já estava no índice.

**Testes que rodei (em `apps/web`):**
- `npm run test:unit -- --run`: 1 arquivo, 7 testes, todos passaram. Eram 5 na rodada 1; os 2 novos cobrem a variável ausente e a variável vazia.
- `npm run build`: o `vue-tsc --build` e o `vite build` passaram. Sem a variável, o build mostra o aviso "AVISO: VITE_API_URL não definida…", que é o comportamento previsto.
- `CI=1 npx playwright test --project=chromium`: 1 teste, passou.

## Critérios verificados
| Critério (da spec / tarefa) | Situação | Onde |
| --- | --- | --- |
| Teste primeiro: sucesso devolve o conteúdo de `data` | atendido | `apps/web/src/api/client.spec.ts:53-61`; `apps/web/src/api/client.ts:50-64` |
| Teste primeiro: erro vira `ApiError` com `statusCode`, `message` e `fields` | atendido. O teste confere a classe e os três campos; há também um caso de 404 sem `fields` | `client.spec.ts:63-99`; `client.ts:28-38, 66-74` |
| Teste primeiro: falha de rede vira um erro próprio | atendido. O teste exige `NetworkError` e também que o erro não seja `ApiError` | `client.spec.ts:112-119`; `client.ts:41-46, 52-56` |
| Prepara o CA10 ("falha de rede ou erro do servidor") | atendido como base. Rede, 5xx e corpo fora do formato da API (502 em HTML) chegam como erros distintos; a tela fica para tarefa futura | `client.spec.ts:101-110` |
| Prepara o CA11 (mensagem da API com o campo da data) | atendido como base. `fields.date` chega no formato `{ campo: [mensagens] }`, e o 404 traz `message` | `client.ts:19-25`; `client.spec.ts:63-82` |
| Apontamento aceito na rodada 1: sem fallback de URL, falha alta, tipagem e documentação | atendido. Sem o `?? 'http://localhost:3000'`; `requireApiUrl` lança erro quando a variável falta ou está vazia (os dois casos testados); `ImportMetaEnv` declarada; `.env.example` criado; architecture §2.1 item 11 e changelog atualizados | `client.ts:5-17`; `client.spec.ts:22-34`; `apps/web/env.d.ts:3-9`; `apps/web/.env.example`; `docs/architecture.md` (§2.1 item 11) |
| `main.css` com `@import "tailwindcss"` e `@theme` com os tokens | atendido. Não mudou desde a rodada 1 | `apps/web/src/assets/main.css` |
| `vite.config.ts` com `@tailwindcss/vite` | atendido | `apps/web/vite.config.ts:6, 28` |
| `package.json` com Tailwind 4, `@tailwindcss/vite`, `openapi-typescript` e o script `api:types` | atendido | `apps/web/package.json` |
| `router/index.ts` e `App.vue` sem o exemplo do `create-vue`; views e componentes de exemplo removidos | atendido | `apps/web/src/router/index.ts`; `apps/web/src/App.vue`; remoções no diff |
| Nada adiantado de tarefas futuras | atendido. `routes: []` com `// TODO #2`; não há `features/` nem página da grade. O cliente não é importado por nenhuma tela | `apps/web/src/router/index.ts:6-7` |
| Glossário (§5.1) | atendido. Nenhum termo do domínio aparece com nome divergente | — |

## Apontamentos

(nenhum)

**Notas (não bloqueiam e não pedem correção):**
- O plugin `warnMissingApiUrl` em `apps/web/vite.config.ts:8-24` é um arquivo a mais de comportamento, mas de infraestrutura. Ele vem do apontamento aceito e não cria comportamento visível para o cliente. Ele só **avisa** no build (não derruba), e o motivo está no comentário: o CI compila sem a variável. A falha alta acontece quando o cliente é carregado. Se isso basta como "falhar alto" é questão do revisor de código.
- O cabeçalho do `docs/architecture.md` (linha 4) continua em **Versão: 1.3.0**, e o changelog ganhou a linha 1.4.0. É uma inconsistência de documento, não da spec; fica para o revisor de código ou para você.
- O `.env.development` fica fora do Git pela regra `.env.*` do `apps/web/.gitignore:16`, e o `.env.example` está no índice. Bate com o que o architecture diz.

**Arquivos relevantes:**
- /home/santiago/Documentos/dev/faculdade/reserva-de-horarios/apps/web/src/api/client.ts
- /home/santiago/Documentos/dev/faculdade/reserva-de-horarios/apps/web/src/api/client.spec.ts
- /home/santiago/Documentos/dev/faculdade/reserva-de-horarios/apps/web/env.d.ts
- /home/santiago/Documentos/dev/faculdade/reserva-de-horarios/apps/web/.env.example
- /home/santiago/Documentos/dev/faculdade/reserva-de-horarios/apps/web/vite.config.ts
- /home/santiago/Documentos/dev/faculdade/reserva-de-horarios/docs/architecture.md

Não gravei este parecer em `specs/002-grade-publica/reviews/`; quem grava é o fluxo, como `tarefa-02-conformidade-r2.md`.
