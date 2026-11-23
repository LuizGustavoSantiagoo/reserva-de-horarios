# Parecer de Conformidade — Tarefa 6

**Veredito:** APROVADO

## Critérios verificados
| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA4: depois de 5 tentativas da mesma origem em 10 min, certas ou erradas, a 6ª recebe `429` | atendido | `auth.module.ts` (`ThrottlerModule.forRoot`, `ttl: 600_000`, `limit: 5`); `auth.e2e-spec.ts` (`spendAttempts`: 200, 401, 401, 400, 200) |
| CA4: mensagem "Muitas tentativas de login. Tente de novo em alguns minutos." | atendido | `auth.module.ts` (`errorMessage`); e2e confere o corpo inteiro no formato único |
| CA4: recusa mesmo com a senha certa, sem emitir token | atendido | e2e (6ª tentativa com a senha certa; sem `accessToken`; `expectNoSecrets`) |
| CA4: passados os 10 minutos, volta a poder tentar | atendido | e2e com `vi.useFakeTimers({ toFake: ['Date'] })` + `advanceTimersByTime(10 min)` → `200` |
| CA4: o limite vale só para a rota de login | atendido | `auth.controller.ts` (`@UseGuards(ThrottlerGuard)` só em `login`, sem `APP_GUARD`); e2e: `GET /courts` e 6× `GET /users/me` → `200` |
| "certas ou erradas" inclui corpo inválido | atendido | a tentativa `400` entra na contagem |
| Formato de erro e ausência de senha/hash | atendido | e2e |
| Fora de escopo respeitado (sem `trust proxy`, sem bloqueio por conta) | atendido | — |
| Nada das Tarefas 7–10 antecipado | atendido | só `apps/api` no diff |

Li a spec, o plano e o diff (`git diff --cached 5ec42fd`); única dependência nova `@nestjs/throttler` ^6.8.0, prevista. Unitários 69/69. O e2e não foi rodado nesta revisão. O 429 tem anotação Swagger (documentação, sem escopo inflado).

## Apontamentos

(nenhum)
