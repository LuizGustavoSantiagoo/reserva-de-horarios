# Parecer de Conformidade — Tarefa 11

**Veredito:** APROVADO

Revisei o diff contra o CA11 e o texto da Tarefa 11. Unitários: web 72/72, API 52/52. O e2e não foi rodado.

## Critérios verificados
| Critério | Situação | Onde |
| --- | --- | --- |
| CA11 — quadra que some com a grade aberta: a atualização automática mostra a recusa com "Voltar para hoje", não o aviso | atendido | `GradePage.vue:119-124` (`showRefusal`), `:202-206` (`refreshGrid`) |
| Teste de componente do item acima | atendido; asserções fortes (antes da correção falharia) | `GradePage.spec.ts:514-537` |
| e2e deixa de ser provisório (h1 "Escolha seus horários" em `/`, sem `TODO #2`) | atendido; título estático, não depende da API | `apps/web/e2e/vue.spec.ts:4-7`; `GradePage.vue:229` |
| Nenhum `TODO #2` restante | atendido | busca no repositório |
| architecture §2.1 item 2: exceção do param validado no service com 404 | atendido; bate com `slots.service.ts:51-56` | `docs/architecture.md:130-133` |
| architecture §6: linha da US01 | atendido | `docs/architecture.md:499` |
| architecture: Histórico e versão 1.6.0 | atendido | `docs/architecture.md:4`, `:514` |
| Fechamento: prd.md US01 → `🟢 Live` | atendido (segue `utf-issue.md:56`) | `docs/prd.md:81` |
| Fechamento: specs/README.md 002 → `implementada` | atendido | `specs/README.md:5` |
| Escopo | atendido | — |

## Apontamentos

(nenhum)

## Observações (não bloqueantes)
- O `prd.md` diz que `Live` vale "quando o PR da história mescla"; o workflow manda trocar no commit de fechamento, antes do PR.
- Se a quadra que sumiu for a primeira da lista, "Voltar para hoje" pede a mesma quadra (a lista não é recarregada) e recebe o mesmo 404 — fora da spec; candidata a Issue.
