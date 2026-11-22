# Decisões da triagem — Tarefa 8, rodada 1

Triagem feita pelo usuário (aluno) sobre os pareceres `tarefa-08-conformidade-r1.md` e `tarefa-08-codigo-r1.md`.

| # | Origem | Apontamento | Decisão | Justificativa |
| --- | --- | --- | --- | --- |
| 1 | conformidade | O teste da falha de rede (`auth.service.spec.ts`) confere a mensagem escrita pelo próprio mock; nenhum teste confere o texto do CA13 ("Não foi possível conectar ao servidor.") contra o código de verdade | **aceito** | — |

Sugestões não bloqueantes do revisor de código (comentário falso no teste, rota `/admin` provisória, chave do storage no teste da página, nome do id de erro, local do `session-expired.ts`) não foram levadas à triagem como apontamento. A primeira é resolvida junto com o apontamento 1; a da rota provisória será conferida na Tarefa 9.
