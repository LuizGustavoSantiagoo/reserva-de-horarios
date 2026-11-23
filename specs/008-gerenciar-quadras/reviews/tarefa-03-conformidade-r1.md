# Parecer de Conformidade — Tarefa 3

**Veredito:** APROVADO

Os testes unitários (`npm test` em `apps/api`) passaram: 17 arquivos, 102 testes. Os testes e2e não foram rodados, como você pediu. Por isso, o que eles provam abaixo saiu da leitura do código, não de execução.

## Critérios verificados
| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA4: renomear para o nome de outra quadra, ativa ou inativa, sem diferenciar maiúsculas nem espaços nas pontas, dá `409` "Já existe uma quadra com este nome." e nada é gravado | atendido | `apps/api/src/courts/courts.service.ts` (`rename` → `ensureNameAvailable` com `NOT: { id }`); e2e `it.each` dos dois casos de 409 em `apps/api/test/courts-admin.e2e-spec.ts`; unitário em `courts.service.spec.ts` |
| CA4: renomear para o próprio nome, trocando maiúsculas ou espaços, dá `200` | atendido | `NOT: { id: exceptId }` no service; e2e "renomear para o próprio nome trocando maiúsculas e espaços" |
| CA5: `200` com `{ data: { id, name, isActive } }`, nome sem espaços nas pontas e `isActive` sem mudar (quadra ativa e inativa) | atendido | `ADMIN_FIELDS`/`update` no service; e2e cobre quadra ativa e inativa |
| CA5: o nome novo aparece em `GET /arena` e em `GET /courts` (só se a quadra estiver ativa) | atendido | e2e confere as duas rotas; a quadra inativa fica fora de `GET /courts` |
| CA5: `name` inválido (sem name, vazio, só espaços, 61 caracteres, não é texto, campo não declarado) dá `400` com `fields` e nada muda | atendido | reaproveita o `CourtNameDto` e o pipe global; e2e `it.each` com 6 casos |
| CA5: id inexistente dá `404` "quadra não encontrada" | atendido | `NotFoundException` no service; e2e + unitário |
| CA5: id que não é UUID dá `400` apontando o campo `id` | atendido | `courtIdPipe` em `apps/api/src/courts/courts.controller.ts`: a mensagem "Dados inválidos." é a mesma do `ValidationPipe` global e a resposta traz `fields.id`; e2e confere |
| CA6: `OPERATOR` no `PATCH` recebe `403` com a mensagem da US06, também com corpo inválido ou id inexistente, e nada muda | atendido | `@Roles('ADMIN')`; e2e `it.each` com os três casos |
| CA7: `PATCH` sem token ou com token inválido dá `401` "Autenticação necessária." e nada muda | atendido | guard global; e2e "sem autenticação válida" |
| CA8: `PATCH /courts/{id}` exige Bearer, documenta os DTOs de entrada (`CourtNameDto`) e de saída (`AdminCourtDto`) e declara `400`, `401`, `403`, `404` e `409` | atendido | decorators no controller; teste novo em `apps/api/test/swagger.e2e-spec.ts` |
| Respostas sem dados de reserva, de cliente nem de pagamento | atendido | `select` limitado a `id`, `name` e `isActive` |
| Fora de escopo: nenhuma rota de status, `PUT /arena` ou `DELETE` foi acrescentada | atendido | o diff só traz `PATCH /courts/:id` |

## Apontamentos

Nenhum.

Duas observações, que não são apontamentos:
- O CA5 também diz que "a grade" passa a mostrar o nome novo. Nenhum teste confere isso, e o plano também não pediu esse teste. Como a grade lê o nome da mesma tabela, não vejo descumprimento.
- O `@ApiResponse` com `500` segue o padrão que as outras rotas de `courts.controller.ts` e `arena.controller.ts` já usam. Não conta como escopo inflado.
