# Parecer de Conformidade: Tarefa 8

**Veredito:** APROVADO

Como fiz a revisão: li a spec -> li o diff inteiro -> rodei os testes unitários -> conferi critério por critério.

1. Li `specs/002-grade-publica/spec.md` (status `aprovada`), lendo literalmente o CA8, o trecho "não pode ser selecionado" do CA5 e do CA6, e o "Fora de escopo". Li também o plano, Tarefas 8, 9 e 10, e o item "Seleção" (linha 81).
2. Li o diff completo (`git diff --cached 36e4e65`): 6 arquivos, todos dentro dos arquivos previstos na tarefa.
3. Testes unitários: apps/web 7 arquivos, 58 testes; apps/api 11 arquivos, 52 testes — todos passaram.

## Critérios verificados
| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA8: tocar num livre deixa marcado como selecionado | atendido | `apps/web/src/features/grade/pages/GradePage.vue` (`toggleSlot`), `components/SlotItem.vue` (botão com `aria-pressed`, estilo escuro); teste em `pages/GradePage.spec.ts`, "tocar num livre marca..." |
| CA8: tocar de novo desmarca | atendido | `GradePage.vue` `toggleSlot` (delete/add); mesmo teste |
| CA8: a tela mostra "N horários selecionados" (com "1 horário selecionado" no singular, como pede o plano) | atendido | `GradePage.vue` `selectionCount` e `data-test="selection-count"`; testes cobrem 0, 1 e 2 |
| CA8: a seleção se mantém ao trocar de quadra ou de dia | atendido | `GradePage.vue`: `selection` fica na página com chave `courtId\|startsAt` (plano, linha 81); teste "trocar de quadra e de dia mantém a seleção" |
| CA8, CA5 e CA6: em reserva, reservado, bloqueado e indisponível não reagem ao toque e não podem ser selecionados | atendido | `SlotItem.vue`: sem `<button>` fora do FREE. `GradePage.vue`: `toggleSlot` recusa o que não é `FREE`. Testes em `SlotItem.spec.ts` (`it.each` dos 4 status) e em `GradePage.spec.ts` |
| CA8: nenhum botão leva adiante para a reserva | atendido | teste "não existe botão para avançar para a reserva" |
| Nada antecipado das Tarefas 9 e 10 | atendido | não há `setInterval`, reconferência da seleção nem tratamento de erro de rede no diff |
| Fora de escopo: guardar a seleção depois de fechar a aba | respeitado | a seleção fica só em memória (`ref`) |

## Apontamentos

(nenhum)

Observação que não bloqueia: o diff traz uma legenda fixa "Claro: livre · Escuro: selecionado" (`GradePage.vue`), e o comentário diz que ela vem do protótipo (a imagem `docs/prototipo/01-grade.png`). A spec não pede essa legenda, mas também não muda comportamento nem contradiz a spec.
