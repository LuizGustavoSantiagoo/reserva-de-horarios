# Parecer de Código: Tarefa 3, rodada 2

**Veredito:** APROVADO

Não alterei nenhum arquivo e não gravei este parecer em `specs/002-grade-publica/reviews/`. Quem grava é o fluxo.

**Passo a passo do que fiz:**
1. Li `.agents/agents/revisor-codigo.md` e `docs/architecture.md` (v1.5.0). Li também `docs/design-tokens.md`, o `main.css` com o `@theme`, o parecer de código e as decisões da r1.
2. Li o diff inteiro de `git diff --cached f638dab`, sem `specs/.../reviews/`. Abri o que o diff usa: `app.module.ts`, `main.ts`, `common/`, `test/helpers/db.ts`, `src/api/client.ts`, `ci.yml`, `e2e/vue.spec.ts` e `playwright.config.ts`.
3. Conferi os dois apontamentos aceitos na r1 e as decisões que o implementador declarou para a r2.
4. Rodei as verificações:
   - **API:**
     - `npm test`: 29/29 passaram.
     - `npm run build` e `npm run lint` passaram limpos.
     - `CORS_ORIGIN=http://localhost:4173 npm run test:e2e`: 4 arquivos, 11/11 passaram.
   - **Web:**
     - `npm run test:unit -- --run`: 21/21 passaram.
     - `VITE_API_URL=http://localhost:3000 npm run build`, com `vue-tsc` e `vite build`, passou.
     - `npm run lint` (com `--fix`) passou e não deixou diff pendente: `git diff --stat` saiu vazio.

**O que conferi das decisões do implementador:**
- **Apontamento 1 da r1 (CORS): resolvido.**
  - `apps/api/src/common/cors.ts` lê `CORS_ORIGIN` pelo `ConfigService<Env, true>`.
  - `env.validation.ts` exige a variável no boot e recusa valor vazio, com testes em `env.validation.spec.ts`.
  - A variável está no `apps/api/.env.example` e no `env` do job do CI.
  - O `main.ts` e o `cors.e2e-spec.ts` chamam a mesma função `enableCors`.
  - Não existe token `APP_*` para CORS no Nest, então a função compartilhada é a forma de o e2e exercitar a mesma configuração do `main.ts`. Isso segue o espírito do §2.1 item 2.
  - Com `origin: [CORS_ORIGIN]` em lista, outra origem fica sem o cabeçalho. O teste "não libera outra origem" prova isso.
- **Apontamento 2 da r1 (camadas): resolvido pela saída (a).**
  - O `SlotsService` não toca mais no Prisma. Usa `CourtsService`, `SchedulesService.listForWeekday` e `BlocksService.listBlockedStarts`, todos exportados pelos seus módulos e importados pelo `SlotsModule`.
  - `schedules/` e `blocks/` têm só module e service, sem controller e sem `dto/`. É a decisão do usuário ("mínimos"), registrada em comentário que aponta a US08 (#9) e a US10 (#11).
- **Outros pontos do §2.1 e do §4:**
  - Swagger documentado nas duas rotas, com o envelope `{ data }`.
  - `CourtDto` público só com `id` e `name` (RN06).
  - `CLOCK` injetado, nenhuma `new Date()` na regra.
  - No front: só service fala com a API, props e emits tipados, rota lazy, cores e espaçamentos dos tokens.

## Apontamentos (bloqueiam)

Nenhum.

## Sugestões (não bloqueiam)

- **Os testes unitários dos services novos conferem o formato exato da consulta ao Prisma.**
  - Onde: `apps/api/src/schedules/schedules.service.spec.ts:21-25` e `apps/api/src/blocks/blocks.service.spec.ts:16-19`. Ambos conferem o argumento inteiro de `findMany` (`where`, `orderBy`, `select`).
  - Efeito: trocar `startsAt: { in: [...] }` por um intervalo `gte/lt`, ou acrescentar `priceCents` ao `select`, quebra o teste sem mudar o comportamento.
  - Não bloqueia porque o comportamento real já está coberto pelo `slots.e2e-spec.ts`, contra o banco: faixas gravadas fora de ordem e bloqueio em outra quadra.
  - Saída possível: conferir só o `where` (o filtro por quadra) e o resultado.
- **O comentário do `CORS_ORIGIN` no CI conta só metade da história** (`.github/workflows/ci.yml:35-36`).
  - Ele cita o `vite preview` do Playwright, mas no CI o Playwright não sobe a API.
  - O que torna a variável obrigatória nesse job é o boot da API nos e2e: sem ela, o `validateEnv` derruba as 4 suítes.
  - Uma linha a mais no comentário evita que alguém a remova achando que é enfeite.

## Observações fora do escopo deste diff

- **O banco de dev ficou com dados de teste depois do e2e.** Uma consulta só de leitura mostrou:
  - `Arena`: "Arena de Teste";
  - `Court`: "Quadra 1" e "Quadra 2", ambas ativas.

  Foi o `slots.e2e-spec.ts` que rodou por último, e não o seed. Não mexi. Para voltar ao estado do seed, o usuário precisa re-semear. É a mesma causa já registrada na r1: o e2e roda no banco de dev. Segue candidata a Issue de manutenção (banco ou schema próprio para o e2e).
- **`apps/api/.env` local sem `CORS_ORIGIN`:** até o usuário acrescentar a variável, `npm run api` e `npm run test:e2e` sem a variável no ambiente caem no boot. É o comportamento esperado da validação.
- **`apps/api/src/main.ts:26` usa `process.env.PORT ?? 3000`.** Isso fere o §2.1 item 11 ("Nenhum `process.env` fora do módulo de configuração"). A linha é anterior a este diff, que não a tocou. É candidata a manutenção: pôr `PORT` no `Env` e ler pelo `ConfigService`.

**Arquivos relevantes:**
- /home/santiago/Documentos/dev/faculdade/reserva-de-horarios/apps/api/src/common/cors.ts
- /home/santiago/Documentos/dev/faculdade/reserva-de-horarios/apps/api/src/config/env.validation.ts
- /home/santiago/Documentos/dev/faculdade/reserva-de-horarios/apps/api/src/main.ts
- /home/santiago/Documentos/dev/faculdade/reserva-de-horarios/apps/api/src/slots/slots.service.ts
- /home/santiago/Documentos/dev/faculdade/reserva-de-horarios/apps/api/src/slots/slots.module.ts
- /home/santiago/Documentos/dev/faculdade/reserva-de-horarios/apps/api/src/schedules/schedules.service.spec.ts
- /home/santiago/Documentos/dev/faculdade/reserva-de-horarios/apps/api/src/blocks/blocks.service.spec.ts
- /home/santiago/Documentos/dev/faculdade/reserva-de-horarios/apps/api/test/cors.e2e-spec.ts
- /home/santiago/Documentos/dev/faculdade/reserva-de-horarios/.github/workflows/ci.yml
