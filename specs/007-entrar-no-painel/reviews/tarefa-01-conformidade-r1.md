# Parecer de Conformidade — Tarefa 1

**Veredito:** APROVADO

Rodada 1. História 007, branch `7-entrar-no-painel`. Não alterei nenhum arquivo.

## Critérios verificados
| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA1: com `ADMIN_EMAIL`/`ADMIN_PASSWORD` definidas, o seed cria um usuário `ADMIN` com esse e-mail, já normalizado | atendido | `apps/api/prisma/seed.ts:14,60-76`; `apps/api/prisma/admin-seed.ts:33`; e2e `apps/api/test/seed.e2e-spec.ts:41` em diante |
| CA1: o banco guarda só o hash `argon2`; a senha em claro não aparece em nenhuma coluna | atendido | `seed.ts:66`; e2e `seed.e2e-spec.ts:97` (`argon2.verify`) e o laço que confere `not.toContain` em todas as colunas |
| CA1: rodar o seed de novo não cria um segundo usuário nem troca a senha | atendido | `seed.ts:63` (`update: {}`); e2e `seed.e2e-spec.ts:117` |
| CA1: num banco em que a arena já existe, o seed cria o admin | atendido | `seedAdmin` fora do `return` antecipado (`seed.ts:75-76`); e2e `seed.e2e-spec.ts:125` |
| CA1: sem uma das variáveis, ou com senha < 8, o seed falha nomeando a variável e não cria o usuário | atendido | validação antes do banco (`seed.ts:14`); unitários em `admin-seed.spec.ts`; e2e `seed.e2e-spec.ts:148` |
| CA1: e-mail e senha do admin não aparecem em nenhum arquivo do repositório | atendido | `ci.yml` sem `ADMIN_*`; só `.env.example` versionado; testes com valores fictícios |
| CA1: `.env.example` com `JWT_SECRET`, `JWT_EXPIRES_IN`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` fictícios | atendido | `apps/api/.env.example:8-13` |
| CA1: a API não sobe sem `JWT_SECRET` | atendido | `env.validation.ts:46` + `ConfigModule.forRoot({ validate })` (`app.module.ts:16`) |
| Plano (a): `JWT_EXPIRES_IN` ausente → 28800; não inteiro ou ≤ 0 derruba | atendido | `env.validation.ts:27-40,47` |
| Plano: `JWT_SECRET` do CI gerado a cada execução | atendido | `.github/workflows/ci.yml:72` |
| Plano: `architecture.md` (§2.1 item 11, §5.1, Histórico 1.6.0) | atendido | `docs/architecture.md` |
| Nada das Tarefas 2–10 antecipado | atendido | só `argon2` como dependência nova |

## Testes
`npm test` em `apps/api`: 10 arquivos, 46 testes. O e2e não foi rodado (conferido por leitura).

## Apontamentos

Nenhum bloqueante.

Observação: no e2e, os casos "faltando" passam a variável vazia em vez de omiti-la, como o plano prescreve; a ausência de fato está coberta no unitário.
