# Decisões — Tarefa 3, rodada 1

| # | Apontamento (resumo) | Parecer | Decisão | Justificativa |
| --- | --- | --- | --- | --- |
| 1 | Falta CORS: `main.ts` sem `enableCors` e `CORS_ORIGIN` fora do `ConfigModule`; a grade não carrega em nenhum navegador e o CA1 ("quando eu abro a grade, então vejo...") só vale nos testes com service mockado (architecture §2.1 item 11; fatia vertical) | conformidade e código | aceito | — |
| 2 | `SlotsService` lê `scheduleRule` e `block` direto pelo Prisma, tabelas dos domínios `schedules/` e `blocks/` (architecture §2.1 item 1, §3) | código | aceito, com a saída (a) | Criar `SchedulesModule`/`SchedulesService` e `BlocksModule`/`BlocksService` mínimos, só com a leitura que a grade usa, exportados e importados pelo `SlotsModule`. |

Sugestões não bloqueantes do parecer de código (a–f) e a nota do parecer de conformidade sobre a URL: nenhuma promovida a apontamento.
