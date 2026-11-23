# Parecer de Conformidade — Tarefa 1

**Veredito:** APROVADO

## Critérios verificados
| Critério (da spec / tarefa) | Situação | Onde |
| --- | --- | --- |
| "Assume que" #8: as quadras de exemplo (ativas e uma inativa) nascem no seed, com `// TODO #8` | atendido | `apps/api/prisma/seed.ts:24-29` ("Quadra 1" e "Quadra 2" ativas, "Quadra 3" inativa) |
| "Assume que" #9: a agenda semanal das quadras de exemplo nasce no seed, com `// TODO #9` | atendido | `apps/api/prisma/seed.ts:36-44` (0–6, das 8h às 22h) |
| Teste (a): a validação do `ConfigModule` rejeita a falta de `DATABASE_URL` | atendido | `apps/api/src/config/env.validation.spec.ts:4-6`; ligada ao boot em `apps/api/src/app.module.ts:10` |
| Teste (b): depois do seed existem a arena, duas quadras ativas, uma inativa e as regras de agenda | atendido | `apps/api/test/seed.e2e-spec.ts:27-61` (roda o `prisma db seed` de verdade depois de `resetDatabase`) |
| Seed ligado ao `prisma db seed` pelo `prisma.config.ts` e rodando no Node nativo, sem `tsx` | atendido | `apps/api/prisma.config.ts:11` (`node prisma/seed.ts`) |
| Entidades e enum do plano (`Arena`, `Court`, `ScheduleRule`, `Block`, `Purchase`, `Reservation`, `ReservationStatus`) com os nomes do glossário (architecture §5.1) | atendido | `apps/api/prisma/schema.prisma:12-83`; `createdById` e `cancelledById` ficaram de fora, como o plano adia explicitamente |
| Índice único parcial em `Reservation (courtId, startsAt)` para `HELD`/`PENDING`/`CONFIRMED` e único em `Block (courtId, startsAt)` | atendido | `apps/api/prisma/schema.prisma:55,82`; `migration.sql` com `WHERE (status IN ('HELD', 'PENDING', 'CONFIRMED'))` |
| `PrismaService` global e `ConfigModule` global | atendido | `apps/api/src/prisma/prisma.module.ts`, `apps/api/src/app.module.ts:10-11` |
| Dependência nova só da lista da §2 da architecture | atendido | só entrou `@nestjs/config` (`apps/api/package.json`), que está na lista aprovada (`docs/architecture.md:64`) |
| `apps/api/.env.example` com `DATABASE_URL` | atendido (já existia, não precisou de mudança) | `apps/api/.env.example` |
| CA1–CA11 | fora desta tarefa | Tarefa 1 é um passo técnico sem CA ligado |

Execução dos testes (em `apps/api`):
- `npm test`: 2 arquivos, 4 testes, todos passaram.
- `npm run test:e2e`: 2 arquivos, 4 testes, todos passaram, entre eles os 3 do `seed.e2e-spec.ts`.

## Apontamentos

---

Observação para a triagem (não é apontamento de conformidade, fica para o revisor de código): o diff também altera `apps/api/nest-cli.json` (`entryFile: "src/main"`), `apps/api/tsconfig.build.json` (`rootDir: "."`, inclui `generated`), `apps/api/tsconfig.json` (`rewriteRelativeImportExtensions`) e o script `start:prod` (`node dist/src/main`). Nenhum desses arquivos está nos "Arquivos previstos" da Tarefa 1. São ajustes de build para compilar o client do Prisma gerado em `generated/`. Não acrescentam comportamento que a spec não pediu, por isso não os classifiquei como escopo inflado. Mesmo assim, cabe ao revisor de código confirmar que o `start:prod` e o build continuam corretos.

Passo a passo do que fiz:
1. Li `.agents/agents/revisor-conformidade.md`.
2. Li a `spec.md` e o `plan.md`, e listei o que a Tarefa 1 deveria atender.
3. Rodei `git diff 91a9d75…` e li o diff inteiro.
4. Conferi o glossário e as dependências na `docs/architecture.md`.
5. Rodei `npm test` e `npm run test:e2e`.
6. Classifiquei cada critério.

Não alterei nenhum arquivo.
