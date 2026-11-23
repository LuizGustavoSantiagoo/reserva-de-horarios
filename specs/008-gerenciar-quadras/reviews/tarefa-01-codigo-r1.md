# Parecer de Código — Tarefa 1

**Veredito:** APROVADO

Revisei só o diff `git -C /home/santiago/Documentos/dev/faculdade/reserva-us07 diff --cached 6ee273f -- apps/api` (8 arquivos, +367/-1), com `/home/santiago/Documentos/dev/faculdade/reserva-us07/docs/architecture.md` como régua. Não alterei nenhum arquivo.

## Verificações
Passo 1: suíte unitária. `npm test` passou, 16 arquivos e 94 testes.
Passo 2: suíte e2e. `npm run test:e2e` passou, 9 arquivos e 109 testes. Depois esvaziei as tabelas com o TRUNCATE e rodei `prisma db seed`; os dois terminaram sem erro e o banco `reserva_us07` voltou a ter os dados de exemplo.
Passo 3: lint. `npm run lint` (oxlint) não mostrou nenhum aviso, e o `git status` de apps/api continuou igual, sem arquivo novo ou alterado.
Passo 4: build. `npm run build` passou, e o `git status` também continuou igual.

## O que está de acordo com a arquitetura
- **Camadas (§2.1 item 1):** o módulo `arena/` tem module, controller, service e `dto/`. O controller só repassa a chamada. O acesso ao banco fica só no `ArenaService`, pelo `PrismaService`. O `ArenaService` é exportado.
- **Formato de resposta e erro (§2.1 item 5):** quando não há arena, o service lança `NotFoundException('arena não encontrada')`. Nada de `res.status` no controller. O envelope `data` vem do interceptor global, e o e2e confere esse formato no 200, no 404 e no 401.
- **Autenticação (§2.1 item 6):** a rota não tem `@Public()` nem `@Roles`, então o AuthGuard global protege e qualquer usuário logado entra (ADMIN e OPERATOR). Está de acordo com a regra de que rota sem `@Roles` vale para qualquer autenticado.
- **Swagger (§2.2):** `@ApiBearerAuth()` está no controller, os DTOs de saída têm `@ApiProperty`, e as respostas 200, 401, 404 e 500 estão documentadas. O teste do `/docs-json` cobre a exigência do Bearer.
- **Dados (§5.1):** os campos usados batem com o glossário (`Arena`: id, name, address; `Court`: id, name, isActive). As quadras vêm na mesma consulta, pelo include da relação 1:N.
- **Duplicação:** procurei e não há outra leitura de `prisma.arena` em `src/`. O único `findFirst` de arena que existe é um helper de teste em `test/slots.e2e-spec.ts`.
- Não há segredo nem URL escrita no código, e nenhum erro é engolido.

## Apontamentos (bloqueiam)
Nenhum.

## Sugestões (não bloqueiam)
- O teste unitário `apps/api/src/arena/arena.service.spec.ts:25-32` compara o argumento exato passado ao `findFirst` (include, orderBy, select). Isso prende o teste ao formato da consulta: trocar `include` por um `select` equivalente quebraria o teste sem mudar o comportamento. Como a ordem e os campos já são conferidos de verdade no e2e, essa checagem é aceitável, mas pode virar ruído numa refatoração.
- O teste do Swagger em `apps/api/test/swagger.e2e-spec.ts` (o caso novo de `GET /arena`) usa `toEqual` sobre `Object.keys(...)`, o que também prende a ordem de declaração das propriedades nos DTOs. `expect.arrayContaining` ou ordenar as chaves antes de comparar evitaria isso.

## Observações fora do escopo deste diff
- Nenhuma.
