# Parecer de Conformidade — Tarefa 9

**Veredito:** APROVADO

Revisão somente leitura. Testes unitários: apps/web 64/64 (7 arquivos); apps/api 52/52 (11 arquivos).

## Critérios verificados
| Critério (da spec / plan) | Situação | Onde |
| --- | --- | --- |
| CA9: "quando passam 15 segundos, então a grade se atualiza sozinha" | atendido | `GradePage.vue:136-153`; teste "depois de 15 s pede de novo a grade em exibição..." (14.999 ms → 1 chamada; 15.000 ms → 2, sem "Carregando") |
| CA9: horário selecionado que deixou de estar livre sai da seleção e o contador é atualizado | atendido | `GradePage.vue:88-93` (`showGrid`); teste "um horário selecionado que voltou como em reserva..." (1 → 0) |
| Plano: "o intervalo é limpo ao desmontar a página" | atendido | `GradePage.vue:160-162`; teste "desmontar a página limpa o intervalo" |
| Plano, Polling: "recarrega só a grade em exibição" | atendido | `GradePage.vue:137-141`; resposta atrasada após troca de quadra é descartada (teste da corrida) |
| Plano, Polling: horário selecionado em outra quadra/dia é reconferido quando a grade volta | atendido | `loadGrid` usa `showGrid` (`GradePage.vue:100`); teste correspondente |
| Abandono: "Alguém pré-reserva um horário que eu selecionei" | atendido | mesmo código e teste |
| CA10 (Tarefa 10): nada antecipado | sem antecipação | `GradePage.vue:149-153` |

## Sobre o `.catch(() => {})`
Aceitável e não antecipa a Tarefa 10: não cria aviso, estado de erro nem o texto "não foi possível atualizar"; não distingue primeira carga de polling; sem ele, a falha no polling viraria rejeição sem tratamento. O RED da Tarefa 10 continua possível. Na Tarefa 10, esse `catch` vazio precisa virar o aviso.

## Apontamentos

(nenhum)

## Observação não bloqueante
O plano diz que "como o polling traz o `today` de novo, a virada da meia-noite é percebida sem recarregar a página", mas `refreshGrid` pede sempre o `date` em exibição. Depois da meia-noite em SP, a grade do dia que acabou recebe 400 (`GradeRefusal`), o `catch` engole e o `today` nunca atualiza. Não bloqueia (nem o CA9 nem a Tarefa 9 cobrem o caso), mas vale decidir se entra na Tarefa 10 ou vira nota no plano.
