# Decisões — Tarefa 7, rodada 1

| # | Apontamento (resumo) | Parecer | Decisão | Justificativa |
| --- | --- | --- | --- | --- |
| 1 | `GradePage.vue` importa `ApiError` de `@/api/client` e interpreta o contrato de erro da API (`statusCode` 404/400, `fields.date`); a tela passa a conhecer status HTTP e o nome do campo do DTO (architecture §3/§4: página usa só `components/` e `services/` do domínio; mudança de contrato nunca mexe nas telas) | código | aceito | — (o usuário autorizou alterar o front no que for preciso) |

Sugestões não bloqueantes do parecer de código: nenhuma promovida a apontamento.
