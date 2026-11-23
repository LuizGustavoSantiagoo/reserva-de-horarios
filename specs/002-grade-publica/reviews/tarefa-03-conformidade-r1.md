# Parecer de Conformidade — Tarefa 3

**Veredito:** APONTAMENTOS

Revisão feita em quatro passos: li a spec e o plano, depois o diff inteiro (`git diff f638dab`, 28 arquivos), depois rodei os testes e por fim avaliei cada critério. Nenhum arquivo foi alterado.

**Testes rodados:**
- **API, unitários (`npm test`):** 7 arquivos, 25 testes, todos passando.
- **API, e2e (`npm run test:e2e`):** 3 arquivos, 8 testes, todos passando.
- **Web, unitários (`npm run test:unit -- --run`):** 5 arquivos, 21 testes, todos passando.
- **Web, build (`npm run build`):** passou. Saiu só o aviso já esperado de `VITE_API_URL` ausente.

## Critérios verificados
| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA1: lista só as quadras ativas, e a inativa não aparece | atendido (API) | `apps/api/src/courts/courts.service.ts:12-18`; e2e `apps/api/test/slots.e2e-spec.ts:69-84` |
| CA1: a primeira quadra já vem escolhida | atendido (componente) | `apps/web/src/features/grade/pages/GradePage.vue:28-32`; `GradePage.spec.ts:60-67` |
| CA1: abre no dia de hoje, em America/Sao_Paulo, segundo o servidor e inclusive às 22h de SP | atendido | `apps/api/src/slots/slots.service.ts:33-34`, `sao-paulo-time.ts:68-71`; e2e `slots.e2e-spec.ts:150-171`; `GradePage.spec.ts:42-44,69-75` (relógio do aparelho em 2030, a tela não usa ele) |
| CA1: horários de 1 h em ordem crescente | atendido | `slots.service.ts:42-49,58-66`; e2e `slots.e2e-spec.ts:114-148` (regras gravadas fora de ordem) |
| CA1: situações livre e bloqueado, e a precedência "bloqueado vence livre" | atendido | `apps/api/src/slots/slot-status.ts:16`; `slot-status.spec.ts`; `SlotItem.vue:7-10`; `GradePage.spec.ts:77-87` |
| CA1: envelope `{ data }` | atendido | e2e `slots.e2e-spec.ts:78,121` (usa o interceptor já registrado no AppModule, conforme decisão do usuário) |
| CA1 de ponta a ponta: "quando eu abro a grade, então vejo…" no navegador | **não atendido** | ver apontamento 1 |
| Situações reservado e em reserva (CA4, CA6, CA7) e indisponível (CA5) | fora desta tarefa (Tarefas 4 e 5). Não foram antecipadas: `SLOT_STATUSES` tem só `FREE`/`BLOCKED` e não existe `first-name.ts` | `slot-status.ts:2` |
| Quadra inexistente devolve `slots: []` e `date` não é validada | fora desta tarefa (Tarefa 7 / CA11). Há `TODO #2` marcando os dois | `slots.service.ts:37-40`; `slots-query.dto.ts:5` |
| DayPicker deixa voltar para antes de hoje | fora desta tarefa (Tarefa 7 / CA11) | `DayPicker.vue:34-40` |
| Quadra e dia não vão para a URL (`?quadra=&dia=`) | fora desta tarefa. O plano coloca isso na seção "Frontend" para servir o CA11 (link) e o CA8 (não remontar). O CA1 não pede URL. Ver nota no fim | `GradePage.vue:9-11` |
| Trocar quadra ou dia recarrega a grade | atendido, sem inflar o escopo. Faz parte do plano (CourtPicker/DayPicker) e é pré-condição de CA3, CA8 e CA11 | `GradePage.vue:19-26` |
| Tarefas 6, 8, 9 e 10 (lista vazia, seleção, polling, erro de rede) | fora desta tarefa. Nada foi antecipado: sem mensagem de vazio, sem `Set` de seleção, sem `setInterval`, sem tratamento de erro | `GradePage.vue`, `SlotList.vue` |
| Termos do glossário (`Court`, `Slot`, `startsAt`/`endsAt`, `status` em inglês e maiúsculas, tradução só no front) | atendido | `slot-grid.dto.ts`; `SlotItem.vue:7-10` |
| Tipos do front escritos à mão no lugar do `schema.d.ts` | fora do escopo deste revisor. É desvio de arquitetura (§4, `docs/architecture.md:241-242,318`) e cabe ao revisor de código. Os tipos batem com o contrato do plano | `grade.service.ts:1-26` |

## Apontamentos
1. **A grade não abre no navegador: a API não libera CORS, então o CA1 só vale dentro dos testes com o service mockado.** Locais: `apps/api/src/main.ts:5-24` e `apps/web/src/features/grade/pages/GradePage.vue:28-32`.
   Critério violado: CA1, "**quando** eu abro a grade, **então** vejo a lista das quadras ativas, com a primeira já escolhida e o dia de hoje, e cada horário de 1 hora daquele dia". Também a regra de fatiamento vertical (`utf-rules.md` §3): "Uma história deve entregar valor demonstrável de ponta a ponta".
   Evidência:
   - `main.ts` não chama `app.enableCors`. Nenhum arquivo em `apps/api` ou `apps/web` cita `enableCors`, `Access-Control` ou `CORS_ORIGIN` (verifiquei por grep).
   - O front chama a API direto pelo `VITE_API_URL=http://localhost:3000` (`apps/web/.env.example`), e o `vite.config.ts` não tem proxy. A página no dev server do Vite e a API ficam em origens diferentes, então o navegador bloqueia o `fetch`.
   - O `onMounted` do `GradePage.vue:28-32` não trata a rejeição. Resultado: quem abre a grade fica parado em "Carregando a grade…" para sempre.
   - Nenhum teste cruza essa fronteira. O `GradePage.spec.ts:7-10` mocka `grade.service`, e o e2e da API usa Supertest, que não aplica a política de mesma origem. Por isso os testes passam sem provar o "quando eu abro a grade".
   - A `docs/architecture.md` §2.1, item 11 (linha 210) já prevê a variável `CORS_ORIGIN`, e o `main.ts` está entre os arquivos previstos desta tarefa.
   - Fica para a triagem do usuário decidir se a correção entra nesta tarefa ou vira uma Issue de manutenção. Pelo plano, a "Fundação" lista os padrões globais desta história e não cita CORS.

**Nota sobre a URL (não bloqueante, para a triagem):** o plano decide pôr quadra e dia na query (`?quadra=<id>&dia=YYYY-MM-DD`), e o CA11 ("Dado um link para uma quadra inexistente…") depende disso. Nenhuma tarefa cita essa ligação com a URL de forma explícita. A Tarefa 7 prevê só `GradePage.vue`/`DayPicker.vue`, e o teste dela não fala em ler a quadra ou o dia da URL. Se ninguém assumir isso agora, o CA11 pode chegar sem o link que ele pressupõe. Como o CA1 não pede URL, não é apontamento desta tarefa.
