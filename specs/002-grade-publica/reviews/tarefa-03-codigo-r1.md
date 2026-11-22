# Parecer de Código — Tarefa 3 (rodada 1)

**Veredito:** APONTAMENTOS

Não alterei nenhum arquivo e não gravei este parecer em `specs/002-grade-publica/reviews/`. Quem grava é o fluxo.

**O que fiz, passo a passo:**
1. Li `.agents/agents/revisor-codigo.md`.
2. Li `docs/architecture.md` (v1.5.0), a spec, o plan, `docs/design-tokens.md` e o parecer e as decisões da Tarefa 2.
3. Li o diff inteiro de `git diff f638dab` (28 arquivos).
4. Abri os arquivos que o diff usa sem alterar: `main.ts`, `config/env.validation.ts`, `common/*`, `test/helpers/db.ts`, `api/client.ts`, `vite.config.ts`, `.env.example`, `ci.yml` e `e2e/vue.spec.ts`.
5. Rodei as verificações. Resultados:
   - **API:**
     - `npm test`: 25/25 passaram.
     - `npm run test:e2e`: na primeira execução, 2 testes do `seed.e2e-spec.ts` falharam (agenda com `weekday: 1` a mais). Nas 4 execuções seguintes, 8/8 passaram. A causa mais provável é outro processo rodando o e2e no mesmo banco ao mesmo tempo: o parecer de conformidade apareceu no disco durante a minha revisão. Detalhe nas observações.
     - `npm run build` e `npm run lint` passaram limpos.
   - **Web:**
     - `npm run test:unit -- --run`: 21/21 passaram.
     - `npm run build` e `npm run lint` (com `--fix`) passaram e não deixaram diff pendente (`git diff --stat` vazio).
     - Playwright (`CI=1`, chromium): 1/1 passou.

## Apontamentos (bloqueiam)

1. **A tela não consegue falar com a API no navegador: falta CORS.**
   - Local: `/home/santiago/Documentos/dev/faculdade/reserva-de-horarios/apps/api/src/main.ts:6-23`. Não há `app.enableCors(...)`. `/home/santiago/Documentos/dev/faculdade/reserva-de-horarios/apps/api/src/config/env.validation.ts:1-14` não conhece `CORS_ORIGIN`.
   - O consumidor que este diff cria: `/home/santiago/Documentos/dev/faculdade/reserva-de-horarios/apps/web/src/features/grade/services/grade.service.ts:28-36`, sobre `src/api/client.ts:5,55`, faz um `fetch` para outra origem (`VITE_API_URL=http://localhost:3000`). O `vite.config.ts` não tem proxy.
   - Conferi o relato do implementador e ele procede.
   - **Regra violada:** architecture §2.1 item 11 declara `CORS_ORIGIN` entre as variáveis lidas pelo `ConfigModule`. O §4 e o item 11 fixam que o front chama a API pelo endereço de `VITE_API_URL`, ou seja, em outra origem. O plan põe `apps/api/src/main.ts` entre os arquivos previstos da Tarefa 3.
   - **Prejuízo concreto:** é a primeira tarefa em que o front chama a API, e a grade não carrega em nenhum navegador (dev, preview ou produção). O preflight e a resposta são bloqueados, o `client.ts` vira `NetworkError` e, como a página ainda não trata erro (Tarefa 10), fica em "Carregando a grade…" para sempre. Só os testes com service mockado passam, então o defeito some de vista até a defesa.
   - **Correção esperada:** `enableCors` com a origem lida de `CORS_ORIGIN` pelo `ConfigModule`, validada no boot, documentada no `apps/api/.env.example` e definida no CI.

2. **O `SlotsService` lê direto as tabelas de outros domínios.**
   - Local: `/home/santiago/Documentos/dev/faculdade/reserva-de-horarios/apps/api/src/slots/slots.service.ts:42-46` (`this.prisma.scheduleRule.findMany`) e `:51-54` (`this.prisma.block.findMany`).
   - **Regra violada:** architecture §2.1 item 1, "Um módulo só usa outro pelo **service que este exporta** — nunca importa controller nem acessa as tabelas do outro domínio direto". O §3 declara `schedules/` (ScheduleRule) e `blocks/` (Block) como domínios próprios, separados de `slots/`.
   - Para `Court` o diff faz certo: importa o `CourtsModule` e usa o `CourtsService` exportado. Para agenda e bloqueio, não.
   - **Prejuízo concreto:**
     - A Tarefa 4 vai somar `Reservation` e `Purchase` (domínio `purchases/`) ao mesmo service. Com isso, `slots/` passa a conhecer o formato de quatro tabelas alheias.
     - Quando a US08 (#9) criar `schedules/` e a US10 (#11) criar `blocks/`, qualquer mudança nesses models (vigência da agenda, `createdById` obrigatório etc.) também vai exigir editar `slots/`. Ninguém vai lembrar disso.
     - A regra da exclusividade de leitura existe exatamente para evitar isso.
   - **Correção esperada, decisão do usuário na triagem.** Uma de duas:
     - (a) criar o mínimo: `SchedulesModule`/`SchedulesService` e `BlocksModule`/`BlocksService`, só com o método de leitura que a grade usa, exportados e importados pelo `SlotsModule`;
     - (b) registrar na `architecture.md` uma exceção explícita para `slots/` como modelo de leitura, se for essa a intenção.
   - O implementador relatou o desvio, mas relatar não o resolve: a régua continua sendo a §2.1.

## Sugestões (não bloqueiam)

- **Tipos do front escritos à mão** (`grade.service.ts:6-26`, contra o §4, "tipados pelo `schema.d.ts`").
  - O motivo procede: o `schema.d.ts` não é commitado e o CI não o gera.
  - Mesmo assim, o desvio precisa virar decisão registrada (ADR curto ou nota no §4). Na Tarefa 4 o `SlotStatus` da API ganha `HELD`/`RESERVED`/`UNAVAILABLE` e `firstName`. Se a cópia do front não acompanhar, o type-check não acusa, e `LABELS[item.status]` em `SlotItem.vue:7-10` devolve `undefined`, deixando o horário sem rótulo.
  - Alternativa: um passo no CI que gere o schema a partir da API.
- **O e2e do Playwright dá verde falso.**
  - `/home/santiago/Documentos/dev/faculdade/reserva-de-horarios/apps/web/e2e/vue.spec.ts:7` mantém `// TODO #2: a Tarefa 3 põe a grade em /; por ora...`, e esta é a Tarefa 3.
  - No CI o build sai sem `VITE_API_URL`. O chunk da `GradePage` lança ao carregar o `client.ts`, mas o teste só confere `#app main`, que existe de qualquer jeito.
  - Vale atualizar ou remover o TODO e definir `VITE_API_URL` no `ci.yml`, o que o usuário já liberou.
- **Corrida na `GradePage`.**
  - `selectCourt`/`selectDay` (`GradePage.vue:19-26`) disparam `void loadGrid(...)` sem descartar respostas antigas. Com cliques rápidos, a grade de uma quadra ou dia anterior pode sobrescrever a atual, e `courtId` (o botão marcado) muda antes de a grade chegar.
  - O polling da Tarefa 9 piora isso. Um contador de requisição ou a comparação de `courtId`/`date` na resposta resolve.
- **Carga sem tratamento de erro.**
  - `onMounted` e `void loadGrid` (`GradePage.vue:19-32`) deixam a rejeição sem tratamento. O plan adia erro e vazio para as Tarefas 6 e 10, então não bloqueia.
  - Falta um `// TODO #2` marcando isso, como já existe em `slots-query.dto.ts:5` e `slots.service.ts:38`.
- **`clockProvider` só no `SlotsModule`** (`slots.module.ts:10`). Quando `purchases/` e o `ExpirationService` precisarem do `CLOCK`, cada módulo vai registrar o seu. Um `ClockModule` global em `common/` evita a repetição. Não é urgente.
- **Data malformada ou `courtId` não-UUID respondem 500.**
  - O filtro gera o 500 genérico e loga o detalhe, então nada é engolido. Está adiado para a Tarefa 7 com TODO.
  - Só confirme na Tarefa 7 que o 500 deixa de existir para essas entradas.

## Observações fora do escopo deste diff

- **O e2e da API roda no banco de desenvolvimento** (herdado da Tarefa 1, `test/helpers/db.ts`).
  - Dois processos rodando `npm run test:e2e` ao mesmo tempo (implementador e revisor, ou dois revisores) se atropelam. Foi o que fez a primeira execução falhar aqui.
  - Como o sequenciador do Vitest não garante ordem alfabética, o banco de dev pode terminar com os dados do `slots.e2e-spec.ts` ("Arena de Teste", datas de 2030), e não com os do seed.
  - O `fileParallelism: false` deste diff resolve só a disputa dentro de um processo.
  - É candidata a Issue de manutenção: banco ou schema próprio para o e2e.
- **Nenhum `.env.development` no `apps/web` local.** O `npm run dev` derruba a rota `/` ao carregar o cliente. É comportamento esperado pela Tarefa 2, mas vale lembrar no README (observação já registrada na Tarefa 2).

**Arquivos relevantes:**
- /home/santiago/Documentos/dev/faculdade/reserva-de-horarios/apps/api/src/main.ts
- /home/santiago/Documentos/dev/faculdade/reserva-de-horarios/apps/api/src/config/env.validation.ts
- /home/santiago/Documentos/dev/faculdade/reserva-de-horarios/apps/api/src/slots/slots.service.ts
- /home/santiago/Documentos/dev/faculdade/reserva-de-horarios/apps/api/src/slots/slots.module.ts
- /home/santiago/Documentos/dev/faculdade/reserva-de-horarios/apps/web/src/features/grade/services/grade.service.ts
- /home/santiago/Documentos/dev/faculdade/reserva-de-horarios/apps/web/src/features/grade/pages/GradePage.vue
- /home/santiago/Documentos/dev/faculdade/reserva-de-horarios/apps/web/src/features/grade/components/SlotItem.vue
- /home/santiago/Documentos/dev/faculdade/reserva-de-horarios/apps/web/e2e/vue.spec.ts
- /home/santiago/Documentos/dev/faculdade/reserva-de-horarios/apps/api/test/helpers/db.ts
