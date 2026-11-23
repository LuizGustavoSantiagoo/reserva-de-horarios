# Parecer de Conformidade — Tarefa 4

**Veredito:** APROVADO

A Tarefa 4 cumpre CA7, CA8 e CA10 em `POST /users`, sem antecipar as Tarefas 5 a 10. Li a spec, o plano e o diff inteiro (`git diff --cached 663973c…`, 15 arquivos); unitários 69/69. O e2e não foi rodado nesta revisão (critérios do `users.e2e-spec.ts` conferidos pelas asserções).

## Critérios verificados
| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA7: ADMIN em `POST /users` → `201 { data: { id, email, role: "OPERATOR" } }`, sem senha/hash | atendido | `users.controller.ts` (`create`, `@Roles('ADMIN')`); `users.service.ts` (`createOperator`, `PROFILE_SELECT`); e2e com chaves exatas e `expectNoSecrets` |
| CA7: só o hash argon2 no banco | atendido | `users.service.ts` (`argon2.hash`); e2e com `startsWith('$argon2')` e `argon2.verify` |
| CA7: o novo operador entra pelo CA2 | atendido | e2e (login 200 e `/users/me` com o token) |
| CA7: o cadastro cria sempre OPERATOR | atendido | `Role.OPERATOR` fixado no service; DTO sem campo de papel |
| CA8: e-mail mal formado, senha < 8, campo faltando ou `"role": "ADMIN"` → 400 com `fields`, sem gravar | atendido | `create-user.dto.ts`; `forbidNonWhitelisted` (`validation.pipe.ts:29`); e2e `it.each` com 6 casos e contagem |
| CA8: e-mail repetido (maiúsculas/espaços) → 409, sem gravar | atendido | `@Transform(normalizeEmail)` + `P2002` → `ConflictException`; e2e com `'  BRUNO@Arena.com '` |
| CA10 (POST /users): OPERATOR → 403 "Seu perfil não tem acesso a esta operação.", nada gravado, sem dado de usuário | atendido | `roles.guard.ts`; segundo `APP_GUARD`; `roles.guard.spec.ts`; e2e com corpo exato e contagem |
| CA10 (GET /users) | fora desta tarefa (Tarefa 5) | — |
| Plano: `/docs-json` com `POST /users` e o Bearer | atendido | `swagger.e2e-spec.ts` |
| Plano: architecture §2.1 item 6 e Histórico | atendido | `docs/architecture.md` (1.8.0) |

## Antecipação das Tarefas 5 a 10
Nada antecipado.

## Arquivos fora da lista do plano
- `common/normalize-email.ts` + ajuste no `login.dto.ts`: refatoração sem comportamento novo (o `CreateUserDto` precisa da mesma regra).
- `auth-user.ts`: só a constante `ACCESS_DENIED` (texto do CA10).
- `test/helpers/error-body.ts` + `auth.e2e-spec.ts`: helper de teste, sem mudar asserção.
- O 403 antes da validação do corpo e o 403 (não 409) para e-mail repetido de um OPERATOR reforçam o CA10.

Não é escopo inflado.

## Apontamentos

(nenhum)
