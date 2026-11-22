# Parecer de Conformidade — Tarefa 7

**Veredito:** APROVADO

Revisei o diff do índice contra e51a540. Os testes unitários passam: API com 11 arquivos e 52 testes, web com 7 arquivos e 43 testes. O e2e eu não rodei, como você pediu. Por isso os casos de API abaixo estão verificados pela leitura do código e do e2e, não por execução.

## Critérios verificados
| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA11: quadra inexistente e quadra inativa respondem igual, `404` "quadra não encontrada", sem revelar qual é (o plano inclui o id que não é UUID) | atendido. O service dispara `NotFoundException('Quadra não encontrada')`, e o id que não é UUID nem chega ao banco. O e2e compara os três corpos, sem `path` e `timestamp`, e exige que sejam idênticos. | `apps/api/src/slots/slots.service.ts` (findGrid, cerca da l.49-57); `apps/api/test/slots.e2e-spec.ts:151-175` |
| CA11: data mal formada responde `400` apontando o campo da data | atendido. O `ValidateBy` com `isCalendarDate` passa pelo `ValidationPipe` global, que devolve `fields.date`. O e2e cobra 4 formatos ruins e exige `Object.keys(fields) == ['date']`. | `apps/api/src/slots/dto/slots-query.dto.ts:6-35`; `apps/api/src/common/validation.pipe.ts`; e2e l.177-194 |
| CA11: data impossível (`2030-02-30`, mês 13) responde `400` com `fields.date` | atendido. A validação faz a volta pelo `Date.UTC`. | mesmos arquivos; e2e l.182-183 |
| CA11: dia já passado responde `400` com `fields.date`, no mesmo formato | atendido. A comparação é `day < today`, com o `today` em São Paulo vindo do `CLOCK`. O e2e cobre o corpo exato e o caso das 22h de São Paulo, quando em UTC já é o dia seguinte. | `slots.service.ts` (cerca da l.60-66); e2e l.196-218 |
| CA11: a tela mostra a mensagem com a opção de voltar para hoje | atendido. Há um bloco `role="alert"` com a mensagem e o botão "Voltar para hoje". No 400 aparece a mensagem de `fields.date`. "Voltar para hoje" pede a grade sem `date` e tira o `dia` da URL. | `apps/web/src/features/grade/pages/GradePage.vue:53-84` e o template; `GradePage.spec.ts` (describe "link inválido") |
| CA11: o seletor de dia não navega para antes de hoje, usando o `today` da API e não o relógio do aparelho | atendido. O `DayPicker` recebe `today` e desabilita "Dia anterior" e os cards anteriores a ele. Os testes simulam o relógio do aparelho em outro dia, tanto no `DayPicker` quanto na página. | `apps/web/src/features/grade/components/DayPicker.vue:34-40, 72-96`; `DayPicker.spec.ts`; `GradePage.spec.ts` (último teste) |
| Quadra e dia na URL (`?quadra=&dia=`), que a seção Frontend do plano já decide (decisão prévia do usuário) | atendido, sem desvio | `GradePage.vue:19-34, 95-100`; describe "quadra e dia na URL" |
| Nada das Tarefas 8 a 10 antecipado | atendido. Não há seleção, contador nem `setInterval`. Erros que não são 400 nem 404 são relançados, e o comentário diz que ficam para a Tarefa 10. | `GradePage.vue:60-72` |

## Decisão do implementador avaliada
No 404, "Voltar para hoje" vai para a **primeira quadra ativa** sem `date`. No 400, mantém a quadra. A considero conforme, por três motivos:
- A CA11 diz só "a opção de voltar para hoje", e o plano diz "pede a grade sem `date`". As duas coisas são cumpridas nos dois casos.
- Depois de um 404, pedir a mesma quadra daria o mesmo 404, e a opção nunca levaria a "hoje".
- Ir para a primeira quadra é o mesmo estado de "abrir a grade" da CA1 (primeira quadra escolhida, dia de hoje).

O teste cobre os dois ramos: `toHaveBeenLastCalledWith('q1', undefined)` no 404 e `('q2', undefined)` no 400.

## Apontamentos

(nenhum)
