# Parecer de Código — Tarefa 2 (rodada 2)

**Veredito:** APROVADO

O apontamento aceito na rodada 1 foi resolvido. Os testes, o build, o lint e o E2E passam. Não encontrei nada novo que bloqueie. Não alterei nenhum arquivo e não gravei este parecer em `specs/002-grade-publica/reviews/`: quem grava é o fluxo.

**Passo a passo do que fiz:**
1. Li `.agents/agents/revisor-codigo.md`.
2. Li `docs/architecture.md`.
3. Li o parecer e as decisões da rodada 1.
4. Li o diff inteiro de `git diff 04d06de` (o lockfile ficou de fora; os arquivos de `reviews/` foram ignorados).
5. Conferi o `.gitignore`, o `playwright.config.ts`, o `tsconfig.app.json` e o `ci.yml` da `main`.
6. Rodei as verificações em `apps/web`. Os resultados estão logo abaixo.

**Resultados da verificação (em `apps/web`):**
- **Testes unitários** (`npm run test:unit -- --run`): 7/7 passaram. Entraram 2 testes novos para a variável ausente e para a variável vazia.
- **Build** (`npm run build`) sem `VITE_API_URL`: o type-check e o `vite build` passaram e o aviso `AVISO: VITE_API_URL não definida…` aparece.
- **Build** com `VITE_API_URL=https://api.exemplo.test`: o aviso não aparece. O plugin se comporta como o implementador descreveu.
- **Lint** (`npm run lint`, com `--fix`): passou. O `git status` mostrou tudo no índice, sem modificação pendente nem arquivo novo fora dele, então o `git diff --exit-code` do CI não acusaria nada.
- **E2E** (`CI=1 npx playwright test --project=chromium`): 1/1 passou.

## Como ficou o apontamento 1 da rodada 1 (fallback `'http://localhost:3000'`)

Está resolvido nos três pontos que o usuário aceitou:
- **Falhar alto.** Em `apps/web/src/api/client.ts:5-17`, `requireApiUrl` lança um erro que cita `VITE_API_URL` quando a variável está ausente ou vazia. Não existe mais endereço padrão. Os testes `client.spec.ts:27-33` cobrem os dois casos.
- **Tipar.** `apps/web/env.d.ts` declara `readonly VITE_API_URL?: string` em `ImportMetaEnv`. Por ser opcional, o TypeScript obriga a passar pela guarda. O `env.d.ts` está no `include` do `tsconfig.app.json`.
- **Documentar.**
  - `apps/web/.env.example` foi criado e é o único `.env*` que o Git aceita. Conferi com `git check-ignore`: o `.gitignore` da raiz ignora `apps/web/.env` e `apps/web/.env.development`.
  - `docs/architecture.md` ganhou o texto no §2.1, item 11, e a linha 1.4.0 no Histórico.
- O prejuízo concreto que motivou o apontamento acabou: um build sem a variável não chama mais `localhost` no celular do cliente. Agora ele avisa no build e o app cai com um erro de configuração explícito.

**Sobre o aviso no lugar da falha no build:** a justificativa do implementador procede. O job `testes` do `ci.yml` da `main` roda `npm run build` e o E2E do web sem definir `VITE_API_URL`, então falhar o build deixaria o CI vermelho. A arquitetura, já atualizada neste diff, registra esse comportamento, então não há violação.

## Apontamentos (bloqueiam)

Nenhum.

## Sugestões (não bloqueiam)

- **O CI vai quebrar na Tarefa 3 se nada mudar.** É a sugestão mais importante.
  - No CI, o Playwright sobe o `npm run preview` (`playwright.config.ts:106`) em cima de um build feito sem `VITE_API_URL`.
  - Hoje nenhuma rota importa o client, por isso o E2E passa.
  - Quando a `GradePage` (lazy) importar um service que usa `client.ts`, o chunk da rota `/` vai lançar ao carregar e o E2E da grade vai falhar no CI.
  - A branch saiu de `fa54052`, antes do merge do CI, então o `ci.yml` só vai aparecer aqui quando a branch for atualizada com a `main`.
  - Vale decidir já, para a Tarefa 3: definir `VITE_API_URL` no `env` do job do `ci.yml` (apontando para o que o E2E da grade usar, mock ou API local) e, se quiser, trocar o aviso por falha no build.
- **Cabeçalho do `architecture.md` desatualizado.** O Histórico ganhou a versão 1.4.0 (linha 504), mas o cabeçalho continua com `**Versão:** 1.3.0` e `**Última atualização:** 2026-10-25` (linhas 4-5). A convenção anterior mantinha os dois iguais.
- **Pequena imprecisão no texto novo do §2.1, item 11:**
  - O texto diz "lida só em `src/api/client.ts`", mas o `vite.config.ts:16` também lê a variável (`config.env.VITE_API_URL`) para emitir o aviso.
  - O texto diz "o app cai ao carregar o cliente", mas, como as rotas são lazy, isso só acontece quando a primeira rota que usa a API é aberta, e não na abertura do app.
  - Nenhum dos dois pontos muda o comportamento; ajustar o texto evita uma pergunta na defesa.
- **Barra no fim da URL (detalhe).** `requireApiUrl` não normaliza a URL. Com `VITE_API_URL=http://localhost:3000/`, as chamadas sairiam como `//courts`. Dá para resolver com um `replace(/\/+$/, '')` ou com uma nota no `.env.example`.

As sugestões a–e da rodada 1 não foram promovidas pelo usuário e não foram repetidas aqui.

## Observações fora do escopo deste diff

- Continua valendo a observação da rodada 1: o `apps/web/README.md` ainda tem o texto padrão do `create-vue` e não explica o `.env.example` nem o `api:types`. É candidata a Issue de manutenção.

**Arquivos relevantes:**
- /home/santiago/Documentos/dev/faculdade/reserva-de-horarios/apps/web/src/api/client.ts
- /home/santiago/Documentos/dev/faculdade/reserva-de-horarios/apps/web/src/api/client.spec.ts
- /home/santiago/Documentos/dev/faculdade/reserva-de-horarios/apps/web/env.d.ts
- /home/santiago/Documentos/dev/faculdade/reserva-de-horarios/apps/web/.env.example
- /home/santiago/Documentos/dev/faculdade/reserva-de-horarios/apps/web/vite.config.ts
- /home/santiago/Documentos/dev/faculdade/reserva-de-horarios/apps/web/playwright.config.ts
- /home/santiago/Documentos/dev/faculdade/reserva-de-horarios/docs/architecture.md
