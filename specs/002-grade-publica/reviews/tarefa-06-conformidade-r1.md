# Parecer de Conformidade — Tarefa 6

**Veredito:** APROVADO

## Critérios verificados
| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA2: sem nenhuma quadra ativa, a tela mostra "nenhuma quadra disponível", e não uma tela em branco nem um seletor de dia vazio | atendido | `apps/web/src/features/grade/pages/GradePage.vue:59-62`. Teste em `GradePage.spec.ts` (novo caso "sem nenhuma quadra ativa…"): mostra a mensagem, não mostra "Carregando", não há `select` nem botão "Próximo dia" e `getSlots` não é chamado. O e2e `GET /courts` devolve `{ data: [] }` quando só existe quadra inativa (`apps/api/test/slots.e2e-spec.ts`, linhas ~88-96) |
| CA3: quadra sem agenda no dia escolhido mostra mensagem de que não há horários nesse dia, e não uma tela em branco | atendido | `apps/web/src/features/grade/components/SlotList.vue:10-15`. Testes em `SlotList.spec.ts` (novo, com mensagem e sem `ul`) e em `GradePage.spec.ts` (os seletores continuam, aparece a mensagem, nenhum `[data-test="slot"]`). O e2e de `GET /courts/:id/slots?date=2030-06-04` devolve `slots: []`. A terça não tem regra no `beforeEach`, que só cria regras para weekday 0 e 1 |

## Apontamentos

(nenhum)

## Notas da verificação
- Passo 1: li a spec antes do diff. A Tarefa 6 deve cobrir só o CA2 e o CA3.
- Passo 2: li o diff inteiro do índice contra d6941c5. São 5 arquivos, todos previstos no plano: `slots.e2e-spec.ts`, `GradePage.vue`, `SlotList.vue` e as specs deles.
- Passo 3: rodei os testes unitários. A api passou com 52/52 testes e a web com 33/33. Não rodei o e2e, como você pediu. Por isso os dois casos e2e novos só foram lidos, não executados. O código não muda nada no backend, então eles dependem do comportamento que já existia.
- Passo 4: conferi se alguma tarefa seguinte foi antecipada. Não achei nada da Tarefa 7 (404/400 e voltar para hoje), da Tarefa 8 (seleção e contador), da Tarefa 9 (atualização a cada 15 s) nem da Tarefa 10 (erro com "Tentar de novo" e aviso de falha na atualização). A troca de `courts` para `undefined`/`[]` só separa "carregando" de "lista vazia". Não é um tratamento de erro.
- Observação que não bloqueia: os textos ficaram "Nenhuma quadra disponível." (com maiúscula e ponto final) e "Não há horários neste dia.". O CA2 cita "nenhuma quadra disponível" entre aspas, e a única diferença é de caixa e pontuação. O CA3 não fixa o texto. Não considero divergência.
