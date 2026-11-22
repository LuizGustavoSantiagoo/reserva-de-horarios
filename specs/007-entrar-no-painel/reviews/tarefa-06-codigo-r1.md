# Parecer de Código — Tarefa 6 (rodada 1)

**Veredito:** APROVADO

Comparei com `docs/architecture.md` (§2.1 itens 5, 6 e 7) e com o bloco "Limite de tentativas" do plano; li o diff inteiro (`git diff --cached 5ec42fd…`). Testes: apps/api `npm test` 69/69, build ok, lint ok, `npm run test:e2e` 87/87; apps/web 26/26.

## Decisões conferidas
- `ThrottlerModule.forRoot` no `AuthModule`: throttler `'login'`, `ttl: 600_000`, `limit: 5`, `errorMessage` com o texto do CA4.
- `@UseGuards(ThrottlerGuard)` só no método de login; sem `APP_GUARD`; e2e confirma que `GET /courts` e `GET /users/me` seguem 200.
- 429 no formato único pelo `AllExceptionsFilter` existente; e2e confere o corpo e a ausência de token/segredo.
- `Date` falso com `useRealTimers` no `afterEach`; tentativas misturam 200, 401 e 400.
- Swagger documenta o 429; única dependência nova `@nestjs/throttler`; camadas respeitadas; sem segredo.

## Apontamentos (bloqueiam)
Nenhum.

## Sugestões (não bloqueiam)
- O `ThrottlerModule` é `@Global()`: quando US05/US03 precisarem de limites próprios, subir o registro para o `AppModule` com throttlers nomeados (e `@Throttle`/`@SkipThrottle` por rota).
- No comentário de `auth.module.ts`, dizer que o módulo é global.
