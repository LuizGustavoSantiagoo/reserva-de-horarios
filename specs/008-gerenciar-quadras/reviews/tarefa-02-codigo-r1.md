# Parecer de Código — Tarefa 2

**Veredito:** APROVADO

O caminho foi este: leitura do `revisor-codigo.md` -> leitura do `docs/architecture.md` (v1.11.0) do worktree -> diff `--cached b88ef50` lido inteiro (10 arquivos) -> busca no repositório por duplicações -> testes, lint e build.

## Apontamentos (bloqueiam)
Nenhum.

Itens conferidos contra a §2.1 do `architecture.md`:
- **Camadas (item 1):** o controller só recebe a requisição, valida pelo DTO e repassa a chamada. O Prisma fica só nos services. O `CourtsModule` chega à arena pelo `ArenaService`, que o `ArenaModule` já exportava, por isso o `arena.module.ts` não mudou. Não criou dependência circular.
- **Validação (item 2):** o `CourtNameDto` usa `class-validator`, com `@Transform` de trim antes de `@IsString`, `@IsNotEmpty` e `@MaxLength(60)`. `arenaId` e `isActive` são recusados pelo `forbidNonWhitelisted` do pipe global, e o e2e prova isso.
- **Erros (item 5):** o nome repetido gera `ConflictException` com mensagem em português. A falta de arena repassa o 404 do `ArenaService`. Nada engole erro e não há `res.status` manual.
- **Acesso (item 6):** `@Roles('ADMIN')` está certo. O e2e confirma o 403 antes da validação do corpo.
- **Swagger (§2.2):** `@ApiBearerAuth()` está na rota, e não na classe, porque o `GET /courts` é público (o comentário no código explica). Os DTOs de entrada e saída têm `@ApiProperty`, e as respostas 201, 400, 401, 403, 404, 409 e 500 estão documentadas.
- **Segredos:** nenhum segredo, chave ou URL no código.

## Sugestões (não bloqueiam)
- **DTO duplicado:** `AdminCourtDto` (`apps/api/src/courts/dto/admin-court.dto.ts:4`) é igual ao `ArenaCourtDto` (`apps/api/src/arena/dto/arena.dto.ts:4`): mesmos campos `id`, `name` e `isActive`, mesmos decorators e quase o mesmo comentário. O plano prevê o nome `AdminCourtDto`, então não bloqueia. O prejuízo concreto é o Swagger mostrar dois schemas para a mesma quadra administrativa, e os dois podem divergir com o tempo. Vale decidir com o usuário se um dos dois passa a ser a fonte única.
- **Testes unitários presos à consulta:** `apps/api/src/courts/courts.service.spec.ts:41-52` e `apps/api/src/arena/arena.service.spec.ts:54` conferem o objeto exato passado ao Prisma (`where`, `select`). Uma refatoração da consulta que não muda o comportamento quebra esses testes. É o padrão que o repositório já usa (`arena`, `schedules`, `blocks`, `purchases`), e o comportamento já está coberto pelo e2e, por isso fica só como observação.

## Observações fora do escopo deste diff
- O 409 por nome repetido depende só da checagem no service: não existe índice único no banco para `(arenaId, lower(name))`. O plano aceitou a janela de corrida porque só o ADMIN cadastra quadra, e o comentário no código registra isso. Se no futuro mais perfis puderem cadastrar quadra, isso pode virar uma Issue de manutenção.

## Verificação (em `apps/api`)
- `npm test`: 17 arquivos, 99 testes passando.
- `npm run test:e2e` (banco `reserva_us07`, confirmado no `.env`): 10 arquivos, 126 testes passando. Depois rodei o TRUNCATE e o `prisma db seed`, os dois com sucesso, então os dados de exemplo voltaram para a API de dev.
- `npm run lint`: o oxlint não mostrou nenhum aviso.
- `npm run build`: concluiu sem erro.
- `git status` antes e depois de lint e build: igual, só os arquivos já no stage.
