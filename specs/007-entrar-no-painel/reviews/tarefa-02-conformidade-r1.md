# Parecer de Conformidade — Tarefa 2

**Veredito:** APROVADO

## Critérios verificados
| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA2: `POST /auth/login` com credenciais certas (`ADMIN` e `OPERATOR`) responde `200 { data: { accessToken } }` | atendido | `apps/api/src/auth/auth.controller.ts:19-49` (`@HttpCode(200)`); `apps/api/test/auth.e2e-spec.ts:110-140` |
| CA2: token assinado com `JWT_SECRET`, `sub` = id, `role` = papel | atendido | `auth.service.ts:26-29`; `auth.module.ts:12-24` (segredo do `ConfigService`, HS256); o teste verifica o HMAC-SHA256 por conta própria (`auth.e2e-spec.ts:33-46`) |
| CA2: `exp − iat = 28800`, só `sub`, `role`, `iat`, `exp` | atendido | `auth.module.ts:20`; `env.validation.ts:12,28-34`; teste `auth.e2e-spec.ts:126-135` |
| E-mail normalizado: mesma conta | atendido | `login.dto.ts:7-19`; teste `auth.e2e-spec.ts:142-152` |
| CA3: senha errada e e-mail inexistente → `401` "E-mail ou senha inválidos.", corpos iguais fora o `timestamp`, sem token | atendido | `auth.service.ts:8,21-23`; teste `auth.e2e-spec.ts:155-181` |
| CA3: e-mail mal formado ou senha vazia → `400` com `fields` | atendido | `login.dto.ts:18-24`; testes `auth.e2e-spec.ts:184-216` |
| Nenhuma resposta contém a senha nem o hash | atendido | `users.service.ts:20-25`; `expectNoSecrets` (`auth.e2e-spec.ts:97-107`) |
| Arquivos previstos | atendido | os 12 arquivos do diff estão na lista |
| Nada das Tarefas 3–10 antecipado | atendido | sem `AuthGuard`, `@Public()`, `RolesGuard`, `/users`, throttler, Swagger setup nem frontend |

## Apontamentos

(nenhum)

## Como verifiquei
Li a spec e o plano, o diff inteiro (`git diff --cached 777efe5`), conferi `JWT_EXPIRES_IN` em `env.validation.ts` e rodei os unitários (46/46). O e2e não foi rodado nesta revisão (fica com o revisor de código).
