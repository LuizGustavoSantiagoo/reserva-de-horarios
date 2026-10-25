# Plano — Issue #2

## Decisões técnicas

**Fundação (primeira história do projeto).** O scaffold do `/utf-setup` não tem nenhum
dos padrões globais da `docs/architecture.md` §2.1. Esta história monta só os que ela
usa: `ConfigModule` com validação no boot, `PrismaService` global, `ValidationPipe`,
filtro de exceção, interceptor `{ data }` e Swagger em `/docs`. O `AuthGuard` global
com `@Public()` **não** entra agora: não há rota protegida até a US06 (#7), que o cria.

**Entidades novas** (`apps/api/prisma/schema.prisma`, uma migration `grade_publica`):

| Model | Campos | Observação |
| --- | --- | --- |
| `Arena` | `id`, `name`, `address` | linha única, criada no seed |
| `Court` | `id`, `arenaId`, `name`, `isActive` | |
| `ScheduleRule` | `id`, `courtId`, `weekday` (0–6), `startHour`, `endHour`, `priceCents` | |
| `Block` | `id`, `courtId`, `startsAt`, `reason` | único em `(courtId, startsAt)`; o `createdById` entra com o `AdminUser` na US10 (#11) — a tabela nasce vazia, então a coluna obrigatória pode ser acrescentada sem migrar dados |
| `Purchase` | `id`, `customerName?`, `customerPhone?`, `status`, `totalCents`, `cancelCodeHash?`, `holdExpiresAt`, `createdAt` | a grade lê só o `customerName` (CA4) |
| `Reservation` | `id`, `purchaseId`, `courtId`, `startsAt`, `priceCents`, `status`, `cancelReason?`, `cancelledAt?` | índice **único parcial** em `(courtId, startsAt)` para `HELD`/`PENDING`/`CONFIRMED` (§2.1, item 4); `cancelledById` entra com o `AdminUser` na US11 (#12) |

Enum `ReservationStatus` (`HELD`, `PENDING`, `CONFIRMED`, `EXPIRED`, `CANCELLED`),
usado por `Reservation.status` e `Purchase.status`. `Payment`, `PaymentEvent` e
`AdminUser` ficam para as histórias que os usam: a grade confia só no status gravado
da reserva e não lê prazo nenhum (CA7; `architecture.md` §2.1, item 9, versão 1.3.0).

**Seed** (`apps/api/prisma/seed.ts`, ligado ao `prisma db seed` pelo
`prisma.config.ts`): arena, "Quadra 1" e "Quadra 2" ativas, "Quadra 3" inativa, e
agenda de seg a dom das 8h às 22h. Duas marcações, `// TODO #8` (quadras) e
`// TODO #9` (agenda), como pede o "Assume que" da spec. O seed roda com o Node nativo
(*type stripping* do Node 22.18+). **Se exigir `tsx` ou outra dependência fora da
§2, o implementador para e escala:** dependência nova muda a `architecture.md`.

**Relógio injetável.** Provider `CLOCK` em `src/common/clock.ts` (`now(): Date`), usado
pelo service da grade. Os testes trocam o relógio; ninguém chama `new Date()` direto
na regra.

**Fuso e dia.** Helper em `src/slots/sao-paulo-time.ts` com `Intl.DateTimeFormat`
(sem biblioteca nova): converte `YYYY-MM-DD` + hora de `America/Sao_Paulo` em instante
UTC, diz qual é o "hoje" e o dia da semana.

**Situação do horário: uma função pura.** `src/slots/slot-status.ts` recebe o horário,
o bloqueio, o status gravado da reserva ativa e o `now`, e devolve a situação na ordem
da spec. `HELD` e `PENDING` dão "em reserva" independentemente de prazo; `EXPIRED` e
`CANCELLED` não ocupam o horário. `src/slots/first-name.ts` extrai o primeiro nome. As duas têm teste unitário; o
service só monta os dados e chama as duas.

**Contrato da API** (as duas rotas públicas; o Swagger documenta os DTOs):

- `GET /courts` → `{ data: [{ id, name }] }` — só quadras ativas, ordenadas por nome.
  Módulo `courts/`, com `CourtsService` exportado.
- `GET /courts/:courtId/slots?date=YYYY-MM-DD` →
  `{ data: { courtId, date, today, slots: [{ startsAt, endsAt, status, firstName? }] } }`.
  **O "hoje" é sempre o do servidor:** `date` é opcional e, sem ela, a API usa o dia
  de hoje em `America/Sao_Paulo`; `today` vem em toda resposta. A tela nunca calcula
  o dia com o relógio do aparelho.
  `status`: `FREE` | `HELD` | `RESERVED` | `BLOCKED` | `UNAVAILABLE`. A tradução para
  "livre", "em reserva", "reservado", "bloqueado" e "indisponível" é só do front.
  `firstName` só existe em `RESERVED`. Módulo `slots/`, que usa o `CourtsService` para
  achar a quadra ativa (§2.1, item 1).
  - `courtId` que não é UUID, que não existe ou que é de quadra inativa → `404`
    "Quadra não encontrada", resposta idêntica nos três casos.
  - `date` mal formada (inclusive data impossível, como `2026-02-30`) → `400`
    do `ValidationPipe`, `fields.date`. `date` antes de hoje → `400` do service, mesmo
    formato.
  - A consulta das reservas usa `select` explícito **sem** `customerPhone`: o telefone
    não sai nem do banco nesta rota.

**Formato de erro.** `fields` sai como `{ "<campo>": ["mensagem"] }`.

**Frontend.**
- Rota `/` → `features/grade/pages/GradePage.vue` (lazy), com a quadra e o dia na
  query (`?quadra=<id>&dia=YYYY-MM-DD`). Assim o link do CA11 existe, e trocar de
  quadra ou de dia não remonta a página, o que mantém a seleção (CA8).
- Sem `dia` na URL, a página pede a grade sem `date` e preenche o `dia` com o `date`
  da resposta. O `DayPicker` usa o `today` da última resposta como o limite de "antes
  de hoje" (CA11). Como o polling traz o `today` de novo, a virada da meia-noite é
  percebida sem recarregar a página.
- Componentes: `CourtPicker`, `DayPicker`, `SlotList`, `SlotItem`. Acesso à API por
  `features/grade/services/grade.service.ts` sobre `src/api/client.ts`.
- Seleção: um `ref<Set<string>>` na página, com chave `courtId|startsAt`.
- Polling: `setInterval` de 15 s que recarrega só a grade **em exibição**. Um horário
  selecionado em outra quadra ou dia é reconferido quando aquela grade volta à tela.
- Testes de componente com Vitest + `@vue/test-utils`, service mockado e timers falsos
  (`vi.useFakeTimers`) para o polling. Esta história não traz teste Playwright.

**Testes da API.** E2E com Supertest contra o PostgreSQL do Docker. O helper
`test/helpers/db.ts` limpa as tabelas e insere quadras, agenda, bloqueios, compras e
reservas direto pelo Prisma: nenhuma rota cria reserva ainda. O relógio é
sobrescrito no `TestingModule`.

## Tarefas

- [ ] **Tarefa 1 — Montar a persistência da API**
  - Cobre: passo técnico (destrava todas as outras; prepara o "Assume que" da spec)
  - Teste primeiro: (a) unitário: a validação do `ConfigModule` rejeita a falta de `DATABASE_URL`; (b) e2e: depois do seed, existem a arena, duas quadras ativas, uma inativa e as regras de agenda. Os dois falham porque nem módulo nem schema existem.
  - Arquivos previstos: `apps/api/src/config/`, `apps/api/src/prisma/prisma.module.ts`, `apps/api/src/prisma/prisma.service.ts`, `apps/api/prisma/schema.prisma`, `apps/api/prisma/migrations/`, `apps/api/prisma/seed.ts`, `apps/api/prisma.config.ts`, `apps/api/src/app.module.ts`, `apps/api/test/helpers/db.ts`, `apps/api/test/seed.e2e-spec.ts`, `apps/api/.env.example`, `apps/api/package.json`

- [ ] **Tarefa 2 — Montar a base do frontend**
  - Cobre: passo técnico (destrava as tarefas de tela)
  - Teste primeiro: unitário de `src/api/client.ts`: sucesso devolve o conteúdo de `data`; erro devolve um `ApiError` com `statusCode`, `message` e `fields`; falha de rede vira erro próprio. Falha porque o cliente não existe.
  - Arquivos previstos: `apps/web/src/api/client.ts`, `apps/web/src/api/client.spec.ts`, `apps/web/src/assets/main.css` (`@import "tailwindcss"` + `@theme` com os tokens de `docs/design-tokens.md`), `apps/web/vite.config.ts`, `apps/web/src/router/index.ts`, `apps/web/src/App.vue`, `apps/web/package.json` (Tailwind 4, `@tailwindcss/vite`, `openapi-typescript`, script `api:types`), remoção das views e componentes de exemplo do `create-vue`

- [ ] **Tarefa 3 — Mostrar a grade de hoje com horários livres e bloqueados**
  - Cobre: CA1 — lista de quadras ativas, primeira já escolhida, dia de hoje e horários em ordem, nas situações livre e bloqueado. As situações reservado e em reserva chegam na Tarefa 4; indisponível, na Tarefa 5.
  - Teste primeiro: e2e de `GET /courts` (só as ativas) e de `GET /courts/:id/slots` (horários de 1 h na ordem da agenda, um `BLOCKED` onde há bloqueio, envelope `{ data }`; sem `date`, devolve a grade do dia de hoje em São Paulo segundo o `CLOCK`, com `today` preenchido, inclusive às 22h de São Paulo, quando em UTC já é o dia seguinte); unitário de `slot-status.ts` (bloqueado vence livre); componente `GradePage` (lista as quadras, escolhe a primeira, abre no dia que a API devolveu e mostra "livre" e "bloqueado"). Falham porque não existem rota, função nem página.
  - Arquivos previstos: `apps/api/src/main.ts` (pipe, filtro, interceptor, Swagger), `apps/api/src/common/` (filtro, interceptor, `clock.ts`), `apps/api/src/courts/`, `apps/api/src/slots/` (módulo, controller, service, `dto/`, `slot-status.ts`, `sao-paulo-time.ts`), `apps/api/test/slots.e2e-spec.ts`, `apps/web/src/features/grade/` (`pages/GradePage.vue`, `components/CourtPicker.vue`, `components/DayPicker.vue`, `components/SlotList.vue`, `components/SlotItem.vue`, `services/grade.service.ts` e specs)

- [ ] **Tarefa 4 — Mostrar o que as reservas ocupam, sem expor o cliente**
  - Cobre: CA4, CA6, CA7
  - Teste primeiro: unitários de `first-name.ts` (`"  maria  da Silva "` → `"Maria"`, `"JOÃO"` → `"João"`) e de `slot-status.ts` (confirmada → `RESERVED`; `HELD` ou `PENDING` → `HELD`, inclusive com `holdExpiresAt` já vencido; `EXPIRED` ou `CANCELLED` → `FREE`); e2e verificando que o corpo de `GET /courts/:id/slots` não contém o telefone nem o sobrenome; componente mostrando "reservado · Maria" e "em reserva" sem nome. Falham porque a função ainda ignora reservas.
  - Arquivos previstos: `apps/api/src/slots/first-name.ts`, `apps/api/src/slots/slot-status.ts`, `apps/api/src/slots/slots.service.ts`, `apps/api/src/slots/dto/`, `apps/api/test/slots.e2e-spec.ts`, `apps/web/src/features/grade/components/SlotItem.vue` e spec

- [ ] **Tarefa 5 — Marcar como indisponível o horário que já começou**
  - Cobre: CA5
  - Teste primeiro: unitário de `slot-status.ts` com relógio fixo: início igual ou anterior ao `now`, livre ou em reserva → `UNAVAILABLE`; reservado ou bloqueado mantém a situação; e2e com o `CLOCK` sobrescrito; componente mostrando "indisponível". Falham porque a função não olha o relógio.
  - Arquivos previstos: `apps/api/src/slots/slot-status.ts`, `apps/api/test/slots.e2e-spec.ts`, `apps/web/src/features/grade/components/SlotItem.vue` e spec

- [ ] **Tarefa 6 — Mostrar mensagens de grade vazia**
  - Cobre: CA2, CA3
  - Teste primeiro: e2e de `GET /courts` → `[]` sem quadra ativa e de `GET /courts/:id/slots` → `slots: []` num dia sem agenda; componente mostrando "nenhuma quadra disponível" (sem seletor de dia) e a mensagem de dia sem horários. Falham porque a página não trata lista vazia.
  - Arquivos previstos: `apps/api/test/slots.e2e-spec.ts`, `apps/web/src/features/grade/pages/GradePage.vue`, `apps/web/src/features/grade/components/SlotList.vue` e specs

- [ ] **Tarefa 7 — Recusar link de quadra ou dia inválido**
  - Cobre: CA11
  - Teste primeiro: e2e: `courtId` inexistente, inativo e não-UUID respondem o **mesmo** `404`; data mal formada, impossível ou passada responde `400` com `fields.date`; componente: a mensagem da API aparece com o botão "voltar para hoje", que pede a grade sem `date`; o `DayPicker` não navega para antes do `today` devolvido pela API, mesmo com o relógio do aparelho num dia diferente. Falham porque a rota ainda não valida e a página não trata o erro.
  - Arquivos previstos: `apps/api/src/slots/` (controller, service, `dto/`), `apps/api/src/common/` (filtro), `apps/api/test/slots.e2e-spec.ts`, `apps/web/src/features/grade/pages/GradePage.vue`, `apps/web/src/features/grade/components/DayPicker.vue` e specs

- [ ] **Tarefa 8 — Selecionar horários livres**
  - Cobre: CA8
  - Teste primeiro: componente: tocar num livre marca e o contador mostra "1 horário selecionado"; tocar de novo desmarca; trocar de quadra e de dia mantém a seleção; tocar em em reserva, reservado, bloqueado ou indisponível não muda nada; não existe botão de avançar. Falha porque a seleção não existe.
  - Arquivos previstos: `apps/web/src/features/grade/pages/GradePage.vue`, `apps/web/src/features/grade/components/SlotItem.vue`, `apps/web/src/features/grade/components/SlotList.vue` e specs

- [ ] **Tarefa 9 — Atualizar a grade a cada 15 segundos**
  - Cobre: CA9
  - Teste primeiro: componente com timers falsos: depois de 15 s o service é chamado de novo; um horário selecionado que voltou como `HELD` sai da seleção e o contador cai; o intervalo é limpo ao desmontar a página. Falha porque não há polling.
  - Arquivos previstos: `apps/web/src/features/grade/pages/GradePage.vue` e spec

- [ ] **Tarefa 10 — Tratar falha de rede na grade**
  - Cobre: CA10
  - Teste primeiro: componente: falha na primeira carga mostra o erro e "Tentar de novo", e o botão recarrega; falha no polling mantém a última grade e a seleção, e mostra "não foi possível atualizar"; o aviso some na próxima atualização bem-sucedida. Falha porque a página não distingue as duas falhas.
  - Arquivos previstos: `apps/web/src/features/grade/pages/GradePage.vue` e spec

## Critérios sem tarefa

