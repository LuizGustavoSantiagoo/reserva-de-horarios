# Parecer de Conformidade — Tarefa 7

**Veredito:** APROVADO

Li a spec (CA13, CA14) e o texto da Tarefa 7; li o diff (`git diff --cached edaac845...`, 5 arquivos). apps/web 37/37 e `vue-tsc --noEmit` sem erro; apps/api 69/69.

## Critérios verificados
| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA14: com token, toda chamada leva `Authorization: Bearer <token>` | atendido | `client.ts:84-90` (`request` comum); `client.spec.ts` |
| CA14: cabeçalho num único lugar | atendido | `Authorization` e `fetch(` só em `client.ts:89` e `:94` |
| CA14: sem token, o cabeçalho não vai | atendido | `client.ts:87-90`; teste confere `has('Authorization') === false` |
| CA14: `401` numa chamada que não é o login apaga o token | atendido | `clearSession()` + callback de `onSessionExpired`; teste confere memória, `sessionStorage` e callback |
| CA14: o `401` do login não é sessão vencida | atendido | `{ sessionExpiry: false }`; teste; `403` não mexe na sessão |
| CA14: levar a `/admin/login` com o aviso | fora desta tarefa (Tarefa 8) | só o gancho `onSessionExpired` |
| CA13: recarregar mantém a sessão | atendido | `useSession.ts:8`; `useSession.spec.ts` com `vi.resetModules` |
| `clearSession` apaga memória e `sessionStorage` | atendido | `useSession.ts:15-18` e spec |
| architecture.md §4 e Histórico (1.9.0) | atendido | — |
| Nada das Tarefas 8–10 antecipado | atendido | — |

Os testes leem os cabeçalhos que chegam ao `fetch` mockado (não é mock testando mock).

Observação não bloqueante: `isAuthenticated` e o perfil guardado do `useSession` ficam para as Tarefas 9 e 10, como o plano permite.

## Apontamentos

(nenhum)
