# Parecer de Conformidade: Tarefa 3, rodada 2

**Veredito:** APROVADO

Rodei os testes unitários (`npm test` em `/home/santiago/Documentos/dev/faculdade/reserva-us07/apps/api`): 17 arquivos e 102 testes, todos passaram. Os testes e2e não foram rodados, como você pediu. O que eles provam na tabela abaixo saiu da leitura do diff, não de execução.

## Critérios verificados
| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| Decisão 1 da r1, aceita: o `:id` é validado por `CourtIdParamDto` com `@IsUUID`, sem `ParseUUIDPipe` | atendido | `apps/api/src/courts/dto/court-id-param.dto.ts`; `courts.controller.ts` (`@Param() params: CourtIdParamDto`). O `courtIdPipe` e o erro escrito à mão saíram do controller |
| CA4: renomear para o nome de outra quadra, ativa ou inativa, sem diferenciar maiúsculas nem espaços, dá `409` "Já existe uma quadra com este nome." e nada é gravado | atendido | `courts.service.ts` (`rename` → `ensureNameAvailable` com `NOT: { id }`); e2e com os dois casos de 409; unitário |
| CA4: renomear para o próprio nome, trocando maiúsculas ou espaços, dá `200` | atendido | e2e "renomear para o próprio nome trocando maiúsculas e espaços" |
| CA5: `200` com `{ data: { id, name, isActive } }`, nome sem espaços nas pontas e `isActive` sem mudar, para quadra ativa e inativa | atendido | `ADMIN_FIELDS` no service; e2e cobre as duas quadras |
| CA5: o nome novo aparece em `GET /arena` e em `GET /courts` (só se a quadra estiver ativa) | atendido | e2e confere as duas rotas |
| CA5: `name` inválido dá `400` com `fields` e nada muda | atendido | `CourtNameDto` com o pipe global; e2e com 6 casos |
| CA5: id que não existe dá `404` "quadra não encontrada" | atendido | service; e2e e unitário |
| CA5: id que não é UUID dá `400` apontando o campo | atendido | e2e confere `fields` igual a `{ id: ['Informe um id de quadra válido (UUID).'] }`, o que só sai pelo `ValidationPipe` global |
| CA6: `OPERATOR` no `PATCH` recebe `403`, também com corpo inválido ou id inexistente, e nada muda | atendido | `@Roles('ADMIN')`. O guard roda antes do pipe, então a troca para DTO não altera a ordem 403 antes de 400; o e2e cobre os 3 casos |
| CA7: `PATCH` sem token ou com token inválido dá `401` e nada muda | atendido | e2e "sem autenticação válida" |
| CA8: `PATCH /courts/{id}` exige Bearer, documenta os DTOs de entrada e saída e as respostas 400, 401, 403, 404 e 409 | atendido | decorators no controller. Em `apps/api/test/swagger.e2e-spec.ts`, o parâmetro `id` tem `format: uuid`, que agora vem do `@ApiProperty` do DTO |
| Escopo: nada além de `PATCH /courts/:id` | atendido | o diff traz só os 6 arquivos previstos mais o DTO novo |

## Apontamentos

Nenhum. Nenhum critério regrediu em relação à rodada 1.
