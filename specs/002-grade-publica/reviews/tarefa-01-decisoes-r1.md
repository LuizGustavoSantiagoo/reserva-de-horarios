# Decisões — Tarefa 1, rodada 1

| # | Apontamento (resumo) | Parecer | Decisão | Justificativa |
| --- | --- | --- | --- | --- |
| 1 | O seed grava arena, quadras e agenda em operações separadas, sem `$transaction` (architecture §2.1 item 3); uma falha no meio deixa o banco pela metade e a guarda `arena.count() > 0` esconde a falha numa nova execução | código | recusado | O seed roda uma vez, de forma manual e acompanhada; se falhar no meio, quem rodou vê o erro na hora e limpa o banco. A regra do item 3 mira as operações de negócio da API (criar compra, confirmar pagamento), não o script de carga inicial. |

Sugestões não bloqueantes do parecer de código (a–f): nenhuma promovida a apontamento.
