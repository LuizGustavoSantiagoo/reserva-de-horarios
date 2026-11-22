# Parecer de Código: Tarefa 2 (Entrar com e-mail e senha), rodada 1

**Veredito:** APROVADO

Revisei o diff `git diff --cached 777efe5` inteiro (12 arquivos) contra `docs/architecture.md` (v1.6.0) e o texto da Tarefa 2. No lockfile só entram `@nestjs/jwt` e as transitivas dele. Nenhum arquivo alterado.

## Decisões do implementador
- **`JwtModule.registerAsync` global:** segredo e expiração do `ConfigService<Env, true>`; HS256 na assinatura e na verificação; sem segredo no código (item 11).
- **`UsersService.findCredentialsByEmail`:** único `select` com `passwordHash` em `src/`; `UsersModule` exporta o service; `AuthService` não toca no Prisma (item 1).
- **`AuthService`:** a mesma `UnauthorizedException('E-mail ou senha inválidos.')` para usuário inexistente e senha errada (item 6); token só com `sub` e `role`.
- **`LoginDto`:** `@Transform` (trim + minúsculas) antes do `@IsEmail`; mensagens em pt-BR; Swagger.
- **Controller:** só delega; `@HttpCode(200)`; Swagger no padrão dos outros controllers.
- **e2e:** JWT verificado por HMAC próprio; uma app por teste; `createUser` grava pelo Prisma com argon2.

## Apontamentos (bloqueiam)
Nenhum.

## Sugestões (não bloqueiam)
- `normalizeEmail` em `login.dto.ts` e a mesma regra no seed: na Tarefa 4 (`CreateUserDto`) vale subir para `src/common/`.
- O comentário em `auth.module.ts` cita um guard que só nasce na Tarefa 3.

## Fora do escopo
- `apps/api/src/main.ts:26` usa `process.env.PORT` (anterior; contraria o item 11).

## Testes
apps/api: `npm test` 46/46, build ok, lint sem avisos, `npm run test:e2e` 25/25; apps/web: 26/26. O banco `reserva_us06` ficou com os dados do último e2e.
