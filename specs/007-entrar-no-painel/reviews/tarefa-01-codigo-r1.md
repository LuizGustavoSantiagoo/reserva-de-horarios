# Parecer de Código — Tarefa 1 (história 007, rodada 1)

**Veredito:** APROVADO

## Como revisei
1. Li `.agents/agents/revisor-codigo.md` e `docs/architecture.md`.
2. Li a Tarefa 1 no `plan.md` e o CA1 no `spec.md`.
3. Li o diff inteiro de `git diff --cached 685c8b8…`: 15 arquivos.
4. Rodei os testes e conferências só de leitura (`prisma migrate status`, `prisma migrate diff`, `tsc --noEmit`, contagem por `SELECT`, carga do argon2). Nenhum arquivo alterado.

## Testes
- `apps/api npm test`: 46/46; `npm run build` ok; `npm run lint` sem avisos; `npm run test:e2e`: 18/18.
- `apps/web npm run test:unit -- --run`: 26/26.
- `npx tsc --noEmit -p tsconfig.json`: sem erro (cobre `prisma/seed.ts` e `admin-seed.ts`).
- Banco `reserva_us06` depois do e2e: migrations em dia; sobraram dados do último e2e (Arena 1, Court 2, ScheduleRule 4, AdminUser 0).

## Decisões do implementador
- **Migration escrita à mão:** correta; o `migrate diff` só mostra o DROP/CREATE de `Reservation_courtId_startsAt_key` (artefato do preview `partialIndexes`); `AdminUser` e `Role` batem com o schema.
- **Export nomeado `adminSeedEnv`:** de acordo com o §2.1 item 11; `src/` não importa o `prisma.config.ts`.
- **argon2 no CI:** risco baixo — o pacote 0.45.2 traz o binário Linux x64 glibc, carregado pelo `node-gyp-build` no load; testado com o script bloqueado. Efeito colateral: `cross-env`/`cross-spawn` viram dependências de produção.
- **Seed lança antes de criar o `PrismaClient`:** correto; nada é gravado.
- **Senha só de espaços com ≥ 8 aceita:** não bloqueia (spec deixa política de senha de fora).
- **`argon2.hash` mesmo com admin existente:** não bloqueia (um hash por execução manual).

## Apontamentos (bloqueiam)
Nenhum.

## Sugestões (não bloqueiam)
- `seed.ts`: "Seed do administrador aplicado." aparece também quando nada mudou; usar o padrão "já existente, etapa pulada".
- `seed.e2e-spec.ts`: passar `timeout` ao `spawnSync`.
- Tarefas 2 e 5: a normalização do e-mail vai se repetir no `LoginDto` e no `UsersService`; manter o comentário em `admin-seed.ts` apontando as cópias.

## Fora do escopo (candidatas a manutenção)
- `apps/api/src/main.ts:26` usa `process.env.PORT` fora do `ConfigModule` (já existia).
- Lint e build não cobrem `apps/api/prisma/*.ts` (já existia).
