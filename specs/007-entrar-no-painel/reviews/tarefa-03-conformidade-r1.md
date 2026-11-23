# Parecer de Conformidade — Tarefa 3

**Veredito:** APROVADO

CA5, CA6 e a parte do CA12 desta tarefa (`/users/me` e as rotas públicas) estão atendidos. Nada das Tarefas 4 a 10 foi antecipado. Li a spec, o plano e o diff inteiro (`git diff --cached 42b64f2…`, 23 arquivos, todos previstos); unitários `npm test` 63/63.

## Critérios verificados
| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA5: sem `Authorization` → `401` "Autenticação necessária." | atendido | `auth.guard.ts`; `users.e2e-spec.ts` |
| CA5: valor que não é `Bearer <token>` → `401` | atendido | regex `BEARER` em `auth.guard.ts`; unitário (sem prefixo, `Basic`, só `Bearer`, minúsculas); e2e |
| CA5: token de outro segredo → `401` | atendido | `verifyAsync` em try/catch; `helpers/auth.ts` (`invalidAuthorizations`) |
| CA5: `role` adulterado com a assinatura original → `401` | atendido | `helpers/auth.ts` (`tampered`); e2e |
| CA5: token expirado → `401` | atendido | `helpers/auth.ts` (`iat` 8h01 atrás); unitário e e2e |
| CA5: mesma mensagem nos cinco casos, formato único, nada executado | atendido | constante `AUTHENTICATION_REQUIRED` (`common/auth/auth-user.ts`); e2e compara o corpo sem o `timestamp` |
| CA5: rotas públicas respondem como antes, sem token ou com token inválido | atendido | `@Public()` em `app`, `courts`, `slots`, `auth` controllers; `public-routes.e2e-spec.ts` |
| CA6: token válido de `ADMIN`/`OPERATOR` → `200 { data: { id, email, role } }` | atendido | `users.controller.ts` (`me`); `users.service.ts` (`findMe`, `PROFILE_SELECT`); `user.dto.ts`; e2e |
| Nenhuma resposta contém senha ou hash | atendido | `expectNoSecrets` em `users.e2e-spec.ts` |
| CA12: `/docs-json` com esquema Bearer; `/users/me` exige; públicas não | atendido (recorte da T3) | `common/swagger.ts`; `@ApiBearerAuth()`; `swagger.e2e-spec.ts` |
| CA12: botão **Authorize** em `/docs` | fora desta revisão | conferência manual, anotar no PR |
| Plano: preflight de CORS pedindo `authorization` | atendido (teste escrito) | `cors.e2e-spec.ts` |
| Nada das Tarefas 4–10 antecipado | atendido | — |

## Apontamentos

(nenhum)

## Pontos que não bloqueiam
- Os e2e não foram rodados nesta revisão (julgados por leitura).
- Token válido de usuário que não existe mais → `401` em `/users/me`: definido explicitamente no plano aprovado; não é inchaço.
- `docs/architecture.md` §3: a linha `users/` na árvore perdeu a indentação.
