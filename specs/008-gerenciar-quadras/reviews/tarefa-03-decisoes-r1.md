# Decisões da triagem — Tarefa 3, rodada 1

Triagem feita pelo usuário (aluno) sobre os pareceres `tarefa-03-conformidade-r1.md` (aprovado, sem apontamento) e `tarefa-03-codigo-r1.md`.

| # | Origem | Apontamento | Decisão | Justificativa / orientação |
| --- | --- | --- | --- | --- |
| 1 | código | O `:id` de `PATCH /courts/:id` é validado por `ParseUUIDPipe` com o erro escrito à mão no controller, e não por DTO (architecture §2.1, item 2) | **aceito** | Corrigir com um `CourtIdParamDto` com `@IsUUID`, como o `UserIdParamDto` já faz, para o 400 sair pelo `ValidationPipe` global. O plano pedia `ParseUUIDPipe`; prevalece a arquitetura. |

As sugestões não bloqueantes (teste unitário preso à consulta, `ADMIN_FIELDS` repetido) não foram levadas à triagem.
