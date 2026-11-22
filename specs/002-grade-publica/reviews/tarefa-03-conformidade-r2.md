# Parecer de Conformidade — Tarefa 3 (rodada 2)

**Veredito:** APROVADO

Fiz a revisão em cinco passos, sem alterar nenhum arquivo:
1. Li a spec, o plano e os arquivos da rodada 1 (os dois pareceres e as decisões).
2. Li o diff inteiro: `git diff --cached f638dab`, 41 arquivos, sem contar `specs/…/reviews/`.
3. Rodei os testes unitários:
   - API (`npm test`): 9 arquivos, 29 testes, todos passaram.
   - Web (`npm run test:unit -- --run`): 5 arquivos, 21 testes, todos passaram.
4. Não rodei o e2e da API, como você pediu. Li o código dos testes e2e. O `CORS_ORIGIN` agora é obrigatório no boot, então o e2e local só sobe depois que o usuário acrescentar essa variável ao `apps/api/.env`. No CI ela já está definida.
5. Abri o print `/tmp/claude-1000/-home-santiago-Documentos-dev-faculdade-reserva-de-horarios/782f36bd-8a02-4009-ae76-7b0c3955e79d/scratchpad/grade-r2-bloqueado.png`. Ele mostra a Quadra 1 escolhida, "domingo, 22/11" e os horários de 08:00 a 22:00 em ordem, com 19:00–20:00 "bloqueado" e os demais "livre".

## Critérios verificados
| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA1: lista só as quadras ativas, por nome; a inativa não aparece | atendido | `apps/api/src/courts/courts.service.ts:11-17`; e2e `apps/api/test/slots.e2e-spec.ts:69-85` |
| CA1: a primeira quadra já vem escolhida | atendido | `apps/web/src/features/grade/pages/GradePage.vue:28-32`; `GradePage.spec.ts` ("lista as quadras ativas, com a primeira já escolhida") |
| CA1: abre no dia de hoje em America/Sao_Paulo, pelo `CLOCK` do servidor, inclusive às 22h de SP | atendido | `apps/api/src/slots/slots.service.ts:34-36`, `sao-paulo-time.ts` (`saoPauloDate`); e2e `slots.e2e-spec.ts:153-173`; unitário `sao-paulo-time.spec.ts`; `GradePage.spec.ts` (relógio do aparelho em 2030, a tela abre no `date` da API) |
| CA1: horários de 1 h em ordem crescente | atendido | `slots.service.ts:44-47`, `schedules.service.ts` (`orderBy: startHour asc`); e2e `slots.e2e-spec.ts:117-151` (regras gravadas fora de ordem) |
| CA1: situações livre e bloqueado; bloqueado vence livre | atendido | `apps/api/src/slots/slot-status.ts:15-17`; `slot-status.spec.ts`; `SlotItem.vue` (tradução só no front); `GradePage.spec.ts` ("livre" e "bloqueado") |
| CA1: bloqueio de outra quadra não afeta esta | atendido | `blocks.service.ts` (filtra por `courtId`); e2e `slots.e2e-spec.ts` (bloqueio na Quadra 2, no mesmo instante, não aparece) |
| CA1: envelope `{ data }` | atendido | e2e `slots.e2e-spec.ts:69-85,117-151`, pelo interceptor já registrado no AppModule (decisão prévia do usuário) |
| Aceito na r1, item 1: CORS, "quando eu abro a grade" no navegador | atendido | `apps/api/src/main.ts:10` chama `enableCors(app)`; `apps/api/src/common/cors.ts:13` libera só `[CORS_ORIGIN]`; `config/env.validation.ts` exige `CORS_ORIGIN` no boot (architecture §2.1, item 11); `.env.example`; e2e `apps/api/test/cors.e2e-spec.ts:30-56` (libera a origem certa, responde o preflight e não libera outra origem); print do Chromium real |
| Aceito na r1, item 2: saída (a), `SchedulesModule` e `BlocksModule` mínimos | atendido | `apps/api/src/schedules/` e `apps/api/src/blocks/` (só provider e export, sem controller); `slots.module.ts:11` importa os dois; `slots.service.ts` não toca mais no Prisma |
| Escopo: a saída (a) não inflou | atendido | Cada service tem um único método de leitura, com teste unitário. Os dois módulos dizem nos comentários que o cadastro fica para #9 e #11 |
| Reservado e em reserva (CA4, CA6, CA7) e indisponível (CA5) | fora desta tarefa (Tarefas 4 e 5). Não foram antecipados | `slot-status.ts:2` (só `FREE`/`BLOCKED`); `grade.service.ts` (`SlotStatus` igual) |
| 404 de quadra e validação de `date` (CA11); `DayPicker` deixa voltar para antes de hoje | fora desta tarefa (Tarefa 7). Os `TODO #2` foram mantidos | `slots.service.ts:40`; `slots-query.dto.ts:5`; `DayPicker.vue` |
| Lista vazia, seleção, polling e erro de rede (CA2, CA3, CA8, CA9, CA10) | fora desta tarefa. Nada foi antecipado | `GradePage.vue`, `SlotList.vue` |
| Termos do glossário (`Court`, `Slot`, `startsAt`/`endsAt`, `status` em maiúsculas, tradução só no front) | atendido | `slot-grid.dto.ts`; `SlotItem.vue` |
| Ajustes de infraestrutura que o usuário já liberou (`VITE_API_URL`/`CORS_ORIGIN` no `ci.yml`, `fileParallelism: false`) | dentro do combinado | `.github/workflows/ci.yml`; `apps/api/vitest.config.e2e.ts` |

## Apontamentos

(nenhum)

**Observação (não bloqueante, fora do diff, para a triagem se o usuário quiser):** o arquivo `/home/santiago/Documentos/dev/faculdade/reserva-de-horarios/apps/web/e2e/vue.spec.ts` ainda tem o comentário `// TODO #2: a Tarefa 3 põe a grade em \`/\`…`. A grade já está em `/` (`apps/web/src/router/index.ts`), então o TODO ficou desatualizado. Não fere nenhum critério da spec, porque o plano não traz teste Playwright nesta história.
