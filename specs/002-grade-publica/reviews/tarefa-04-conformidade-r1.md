# Parecer de Conformidade — Tarefa 4

**Veredito:** APROVADO

Passo 1: li a spec (CA4, CA6, CA7 e a ordem de precedência). Depois li o plan.md e o glossário da `docs/architecture.md` §5.1.
Passo 2: li o diff inteiro com `git diff --cached f6b8a45`, que tem 15 arquivos.
Passo 3: rodei só os testes unitários. Na API (`npm test`) passaram 11 arquivos e 38 testes. No web (`npm run test:unit -- --run`) passaram 6 arquivos e 28 testes. Não rodei o e2e, como foi pedido.
Passo 4: classifiquei cada critério, como mostra a tabela abaixo.

## Critérios verificados
| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| Precedência: bloqueado → reservado → (indisponível, fica para a T5) → em reserva → livre | atendido | `apps/api/src/slots/slot-status.ts:20-30`; teste "bloqueado vence reservado" em `slot-status.spec.ts` |
| CA4: confirmada aparece como reservado com o primeiro nome (`"  maria  da Silva "` → `"Maria"`) | atendido | `apps/api/src/slots/first-name.ts`; `first-name.spec.ts` (dois casos, inclusive `"JOÃO"` → `"João"`); `slots.service.ts` (o `firstName` só é preenchido em `RESERVED`) |
| CA4: a rota pública nunca contém o telefone nem o nome completo | atendido | `apps/api/src/purchases/purchases.service.ts`: `select` explícito sem `customerPhone`, travado em `purchases.service.spec.ts`. O e2e `slots.e2e-spec.ts` procura no corpo os telefones, "Silva", "maria  da" e os nomes de quem não confirmou |
| CA4 na tela: "reservado · Maria" | atendido | `apps/web/src/features/grade/components/SlotItem.vue:35-39`; `SlotItem.spec.ts` |
| CA6: pré-reserva ou reserva pendente aparece como em reserva, sem nome | atendido | `slot-status.ts` (`HELD`/`PENDING` → `HELD`); o e2e cobre o 10h `PENDING` com "Pedro Alves" sem nome no corpo; `SlotItem.spec.ts` confere o rótulo exato "em reserva" |
| CA6: "não pode ser selecionado" | fora desta tarefa | a seleção ainda não existe, ela chega na Tarefa 8 |
| CA7: prazo vencido continua em reserva enquanto o status gravado não muda | atendido | `slotStatus` não recebe prazo nenhum e `listActiveReservations` filtra só por status (spec unitária). O e2e cobre `HELD` e `PENDING` com `holdExpiresAt` já vencido segundo o `CLOCK` |
| CA7: expirada ou cancelada aparece como livre | atendido | `slot-status.spec.ts` (`it.each` para EXPIRED e CANCELLED); e2e nos horários de 11h e 12h, e no de 13h, onde uma reserva expirada convive com uma `HELD` nova |
| Glossário (`HELD`/`PENDING`/`CONFIRMED`/`EXPIRED`/`CANCELLED`, `customerName`, `Purchase`/`Reservation`) | atendido | os termos batem com a architecture §5.1 |
| Nada das Tarefas 5 a 10 foi antecipado | atendido | não há `UNAVAILABLE` nem uso do `now` no `slotStatus`. Também não há seleção, polling, mensagens de vazio, validação ou tratamento de erro novos |

## Apontamentos

(nenhum)

Duas observações que não bloqueiam a aprovação:
- O plano pede o unitário de `slot-status.ts` "inclusive com `holdExpiresAt` já vencido". A função não recebe prazo, o que já estava decidido no plan.md ("a grade confia só no status gravado"). Por isso esse caso é provado de duas formas: pela assinatura da função, junto com a asserção do `where` em `purchases.service.spec.ts`, e pelo e2e com prazo vencido. Não vejo descumprimento do critério.
- O `PurchasesModule` e o `purchases.service(.spec).ts` estão fora dos arquivos previstos. Eles seguem a decisão do usuário registrada em `reviews/tarefa-03-decisoes-r1.md` e expõem só a leitura que a grade usa. Não contam como escopo inflado.

Arquivos relevantes:
- /home/santiago/Documentos/dev/faculdade/reserva-de-horarios/apps/api/src/slots/slot-status.ts
- /home/santiago/Documentos/dev/faculdade/reserva-de-horarios/apps/api/src/slots/first-name.ts
- /home/santiago/Documentos/dev/faculdade/reserva-de-horarios/apps/api/src/slots/slots.service.ts
- /home/santiago/Documentos/dev/faculdade/reserva-de-horarios/apps/api/src/purchases/purchases.service.ts
- /home/santiago/Documentos/dev/faculdade/reserva-de-horarios/apps/api/test/slots.e2e-spec.ts
- /home/santiago/Documentos/dev/faculdade/reserva-de-horarios/apps/web/src/features/grade/components/SlotItem.vue
