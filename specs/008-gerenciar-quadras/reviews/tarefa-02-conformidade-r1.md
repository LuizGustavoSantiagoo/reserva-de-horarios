# Parecer de Conformidade — Tarefa 2

**Veredito:** APROVADO

Passo 1: li a spec e a Tarefa 2 do plano. Passo 2: li o diff inteiro (`git diff --cached b88ef50`). Passo 3: rodei os unitários (`npm test` em apps/api): 17 arquivos, 99 testes, todos passando. Passo 4: comparei cada critério com o código.

## Critérios verificados
| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| Definições: nome guardado sem espaços nas pontas, de 1 a 60 caracteres, só espaços conta como vazio | atendido | `apps/api/src/courts/dto/court-name.dto.ts` (Transform trim + IsNotEmpty + MaxLength 60) |
| Definições: na resposta do cadastro vêm só `id`, `name`, `isActive` e `arenaId` | atendido | `courts.service.ts` (`CREATED_FIELDS`); e2e confere as chaves exatas |
| CA2: 201 com `arenaId` da arena única e nome sem espaços nas pontas; a quadra aparece em GET /arena, GET /courts e a grade responde 200 sem horários | atendido | `courts.service.ts` `create`, `courts.controller.ts` `@Post()`; `test/courts-admin.e2e-spec.ts` |
| CA2/CA3: `arenaId` ou `isActive` no corpo dá 400 (campo não declarado) | atendido | o DTO não declara esses campos; o ValidationPipe global tem `forbidNonWhitelisted: true`; casos cobertos no e2e |
| CA3: sem name, vazio, só espaços, 61 caracteres, não texto: 400 com `fields`, nada gravado | atendido | `court-name.dto.ts`; e2e `it.each` com `expectCourtCount(2)` |
| CA4 (cadastro): mesmo nome de quadra ativa ou inativa, sem diferenciar maiúsculas nem espaços: 409 "Já existe uma quadra com este nome.", nada gravado | atendido | `courts.service.ts` (`mode: 'insensitive'`, sem filtro de `isActive`); unitário e e2e |
| CA6 (POST): OPERATOR recebe 403 também com corpo inválido, nada gravado | atendido | `@Roles('ADMIN')` no `@Post()`; e2e com corpo válido e com corpo inválido, conferindo que não vem `fields` |
| CA7 (POST): sem token ou com token inválido, 401 "Autenticação necessária.", nada executado | atendido | e2e no bloco "sem autenticação válida" |
| CA7: GET /courts continua público | atendido | `@Public()` mantido; Bearer posto por rota, não na classe |
| CA8 (POST): exige Bearer, DTOs de entrada e saída documentados, 400/401/403/404/409 declarados | atendido | `courts.controller.ts` (`@ApiBearerAuth` e `@ApiResponse` de 201 a 500); `test/swagger.e2e-spec.ts` |
| Decisão do implementador: `ArenaService.findId()` dá 404 "arena não encontrada" sem arena | de acordo com o CA1 (mesma mensagem) | `apps/api/src/arena/arena.service.ts`; unitários no `arena.service.spec.ts` e em `courts.service.spec.ts` |

## Apontamentos

(nenhum)

Observações, que não reprovam a tarefa:
- Os e2e (`courts-admin.e2e-spec.ts` e `swagger.e2e-spec.ts`) não rodaram, porque o despacho pediu só os unitários. A cobertura de CA2, CA3, CA6, CA7 e CA8 descrita acima vem da leitura dos testes, não de uma execução.
- O teste do Swagger confere que POST /courts declara 201/400/401/403/409, mas não confere o 404. O controller declara o 404, então o CA8 é cumprido; o que falta é só o teste provar isso.
- O `apps/api/src/arena/arena.module.ts` estava nos arquivos previstos, mas não precisou mudar: ele já exportava o `ArenaService`.
