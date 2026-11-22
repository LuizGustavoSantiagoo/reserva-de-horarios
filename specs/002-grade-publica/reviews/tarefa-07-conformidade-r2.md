# Parecer de Conformidade — Tarefa 7 (rodada 2)

**Veredito:** APROVADO

Como fiz a revisão, passo a passo:
1. Li `.agents/agents/revisor-conformidade.md`.
2. Li a spec `specs/002-grade-publica/spec.md` (CA11), o texto da Tarefa 7 no `plan.md` e os três arquivos da r1 (`tarefa-07-codigo-r1.md`, `tarefa-07-conformidade-r1.md`, `tarefa-07-decisoes-r1.md`).
3. Li o diff inteiro do índice contra `e51a540`, sem a pasta `reviews/`.
4. Rodei só os testes unitários. Todos passaram: na API, 11 arquivos e 52 testes; no web, 7 arquivos e 47 testes (eram 43 na r1). Não rodei o e2e. Por isso, os casos da API abaixo foram conferidos lendo o código e o e2e, e não executando o e2e.
5. Não alterei nenhum arquivo. O `git status` mostra o mesmo índice do início.

## Critérios verificados
| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA11: quadra inexistente e quadra inativa respondem igual, `404` "quadra não encontrada", sem dizer qual das duas é. O plano inclui também o id que não é UUID. | atendido. O id que não é UUID nem chega a ser buscado no banco. O e2e compara os três corpos de resposta, sem `path` e `timestamp`. | `apps/api/src/slots/slots.service.ts` (findGrid, `isUUID` + `NotFoundException`); `apps/api/test/slots.e2e-spec.ts` (describe "link inválido (CA11)", primeiro `it`) |
| CA11: data mal formada ou impossível responde `400` apontando o campo da data | atendido. O `@ValidateBy(isCalendarDate)` no DTO confere a data pela volta no `Date.UTC`. O e2e testa 6 datas ruins e exige que a única chave de `fields` seja `date`. | `apps/api/src/slots/dto/slots-query.dto.ts`; e2e `it.each` |
| CA11: dia passado responde `400` apontando o campo da data | atendido. A regra é `day < today`, com o `today` de São Paulo vindo do `CLOCK`. O e2e confere o corpo exato e também o caso das 22h em São Paulo, quando em UTC já é o dia seguinte. | `slots.service.ts`; e2e (dois últimos `it`) |
| CA11: a tela mostra a mensagem e a opção de voltar para hoje | atendido. Aparece um bloco `role="alert"` com a mensagem e o botão "Voltar para hoje", que pede a grade sem `date`. Se a recusa foi da quadra, volta para a primeira quadra ativa; se foi do dia, fica na mesma quadra. | `apps/web/src/features/grade/pages/GradePage.vue` (`loadGrid`, `backToToday`, template); `GradePage.spec.ts` (describe "link inválido") |
| CA11: o seletor de dia não deixa ir para antes de hoje, usando o `today` da API e não o relógio do aparelho | atendido. Ficam desabilitados o botão "Dia anterior" e os cards de dias anteriores ao `today`. Há testes com o relógio do aparelho num dia diferente, tanto no componente quanto na página. | `apps/web/src/features/grade/components/DayPicker.vue` (`isPast`, `canGoBack`); `DayPicker.spec.ts`; `GradePage.spec.ts` (último teste) |
| Apontamento aceito na r1: a página não pode importar do cliente HTTP nem interpretar o contrato de erro; quem traduz é o service | atendido. Nenhum arquivo de `pages/` importa de `@/api/client`. A tradução de 404 para `court` e de 400 para `day` (usando a mensagem de `fields.date`) fica em `toRefusal`, no service. Outros erros saem do jeito que vieram, com testes no `grade.service.spec.ts`. A página usa só o `GradeRefusal` (`reason`, `message`), que está em `services/`. | `apps/web/src/features/grade/services/grade.service.ts` (`toRefusal`); `apps/web/src/features/grade/services/grade-refusal.ts`; `GradePage.vue` |
| Decisão prévia: quadra e dia na URL | atendido, sem desvio (`?quadra=&dia=`) | `GradePage.vue` (`queryText`, `writeQuery`, `onMounted`); describe "quadra e dia na URL" |
| Nada das Tarefas 8 a 10 adiantado | atendido. Não há seleção, contador nem polling. Falha de rede ou do servidor é relançada e um comentário diz que fica para a Tarefa 10. | `GradePage.vue` (`catch` de `loadGrid`) |

## Apontamentos

(nenhum)

Observação que não bloqueia: o arquivo novo `grade-refusal.ts` não estava entre os "Arquivos previstos". Ele está em `services/` e é consequência direta do apontamento aceito na r1, então não é escopo inflado.
