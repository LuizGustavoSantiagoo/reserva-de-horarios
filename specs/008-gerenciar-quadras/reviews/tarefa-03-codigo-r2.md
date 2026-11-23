# Parecer de Código: Tarefa 3 (rodada 2)

**Veredito:** APROVADO

Verificações em apps/api, na ordem pedida: `npm test` passou (17 arquivos, 102 testes) -> `npm run test:e2e` passou (10 arquivos, 145 testes) -> TRUNCATE e seed no reserva_us07 rodaram sem erro -> `npm run lint` não acusou nada e não mexeu em arquivo nenhum -> `npm run build` passou. No `git status` o staged é o mesmo da rodada 1. O único arquivo novo é `specs/008-gerenciar-quadras/reviews/tarefa-03-conformidade-r2.md`, que é do outro revisor e não do lint.

## Apontamento aceito na r1: resolvido
- O `courtIdPipe` saiu, junto com o `ParseUUIDPipe` montado à mão e o `INVALID_COURT_ID`. Procurei esses nomes em `apps/api/src` e não sobrou nenhum.
- Entrou o `apps/api/src/courts/dto/court-id-param.dto.ts`. Ele tem `@ApiProperty({ format: 'uuid' })` e `@IsUUID('all', { message: 'Informe um id de quadra válido (UUID).' })`, no mesmo formato do `UserIdParamDto`.
- O controller agora recebe `@Param() params: CourtIdParamDto`. Assim o 400 sai pelo `ValidationPipe` global, como pede o architecture §2.1, item 2, e o formato do erro deixou de existir em dois lugares.
- O e2e confere `fields` igual a `{ id: ['Informe um id de quadra válido (UUID).'] }`. O teste do Swagger confere o parâmetro `id` em path com `format: uuid`, que vem do DTO, sem `@ApiParam` manual.
- A ordem de validação continua certa: o guard roda antes do pipe, então OPERATOR recebe 403 mesmo com corpo inválido ou id inexistente. Isso já estava coberto no e2e.

## Apontamentos (bloqueiam)
Nenhum. O resto do diff (service, `ensureNameAvailable` e testes) está igual ao da r1 e não traz nada novo.

## Sugestões (não bloqueiam)
- As duas da r1 continuam valendo, e nenhuma foi levada à triagem: o unitário de `rename` confere o `where`/`select` exato da consulta, e o `ADMIN_FIELDS` repete campos do `CREATED_FIELDS`.

## Observações fora do escopo deste diff
- As mesmas da r1: a mensagem de 404 de quadra aparece com duas grafias no repo, e não há índice único `(arenaId, lower(name))` no `Court`.
