# Parecer de Conformidade — Tarefa 5

**Veredito:** APROVADO

## Critérios verificados
| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| Precedência: bloqueado → reservado → indisponível → em reserva → livre | atendido | `apps/api/src/slots/slot-status.ts:31-35` (BLOCKED, depois CONFIRMED→RESERVED, depois `startsAt <= now`→UNAVAILABLE, por fim o switch HELD/PENDING) |
| "Já começou" = início igual ou anterior ao instante atual | atendido | `slot-status.ts:33` usa `<=`. Testado com início igual ao `now` e anterior a ele (`slot-status.spec.ts:66-112`, `describe.each` com NOW e PAST) |
| CA5: horário livre que já começou aparece **indisponível** | atendido | unitário `slot-status.spec.ts:72-83` (livre, EXPIRED, CANCELLED); e2e `apps/api/test/slots.e2e-spec.ts` (11h UTC → UNAVAILABLE às 9h de SP; 11h expirada que começa no `now` → UNAVAILABLE) |
| CA5: horário em reserva que já começou aparece **indisponível** | atendido | unitário `slot-status.spec.ts:85-92` (HELD e PENDING); e2e com 9h HELD e 10h PENDING → UNAVAILABLE às 11h |
| CA5: reservado que já começou continua reservado, com o primeiro nome | atendido | unitário `slot-status.spec.ts:94-101`; e2e: 8h CONFIRMED → `RESERVED`, `firstName: 'Maria'` às 11h |
| CA5: bloqueado que já começou continua bloqueado | atendido | unitário `slot-status.spec.ts:103-111`; e2e: o bloqueado que começa exatamente no `now` → BLOCKED |
| CA5 / CA1: a tela mostra "indisponível" | atendido | `apps/web/src/features/grade/components/SlotItem.vue:12`; spec `SlotItem.spec.ts:68-83` |
| CA5: "não pode ser selecionado" | fora desta tarefa | a seleção não existe ainda. O plano põe esse caso na Tarefa 8 ("tocar em ... indisponível não muda nada") |
| Contrato da API: `status` inclui `UNAVAILABLE` (plan.md, "Contrato da API") | atendido | `slot-status.ts:4-10`. O DTO do Swagger lê `SLOT_STATUSES` (`dto/slot-grid.dto.ts:21`) |

## Testes
- `apps/api`, `npm test`: 11 arquivos, 52 testes passando.
- `apps/web`, `npm run test:unit -- --run`: 6 arquivos, 29 testes passando.
- E2E não rodado, como pedido no despacho. Li os casos novos e os resultados esperados batem com os dados de teste (`at(h)` = h+3 UTC; o `now` foi sobrescrito pela variável do `CLOCK`).

## Arquivos alterados fora da lista prevista
- `apps/api/src/slots/slots.service.ts`: é consequência necessária, não escopo inflado. A assinatura da função pura passou a pedir `startsAt` e `now`, como diz o plan.md ("recebe o horário, o bloqueio, o status gravado da reserva ativa e o `now`"). O único lugar que a chama é o service. A mudança só lê o `clock.now()` uma vez e repassa o valor, sem regra nova.
- `apps/web/src/features/grade/services/grade.service.ts`: é consequência necessária. O `Record<SlotStatus, string>` de `SlotItem.vue` exige o membro `UNAVAILABLE` no tipo, e o contrato do plano já lista `UNAVAILABLE`. Só o tipo da union mudou.
- Renomear `UNAVAILABLE_STYLE` para `DISABLED_STYLE` em `SlotItem.vue` é organização interna e cabe ao revisor de código. Não muda comportamento.

## Nada antecipado das Tarefas 6 a 10
O diff não traz handler de clique nem estado de seleção (Tarefa 8). Também não traz mensagem de lista vazia (6), validação de 404/400 (7), polling (9) nem tratamento de falha de rede (10).

## Apontamentos

(nenhum)
