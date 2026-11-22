# Parecer de Código — Tarefa 5

**Veredito:** APROVADO

## Como revisei
1. Li o `.agents/agents/revisor-codigo.md` e o `docs/architecture.md`, que serviu de régua.
2. Li o diff inteiro com `git diff --cached abfb8ef`. São 7 arquivos: `slot-status.ts` e spec, `slots.service.ts`, `slots.e2e-spec.ts`, `SlotItem.vue` e spec, `grade.service.ts`.
3. Procurei outros usos de `SLOT_STATUSES` e `SlotStatus` e conferi a precedência na spec (linhas 22-23 e CA5).
4. Rodei as verificações, todas passaram:
   - **apps/api:** `npm test` (52/52), `npm run build`, `npm run lint` e `npm run test:e2e` (15/15).
   - **apps/web:** `npm run test:unit -- --run` (29/29), `VITE_API_URL=http://localhost:3000 npm run build` e `npm run lint`.
   - O `git status` depois do lint mostra só os 7 arquivos já no índice. Não ficou nada pendente fora do índice.

## Apontamentos (bloqueiam)
Nenhum.

O que conferi contra a arquitetura:
- **Camadas (§2.1 item 1).** A regra continua numa função pura, `slotStatus(facts, now)`. O `now` sai do `CLOCK` injetado no `SlotsService` e é lido uma vez só por requisição, em `slots.service.ts:38`, que também calcula o `today`. Assim o "hoje" e o "já começou" usam o mesmo instante. O controller não foi alterado e nada novo acessa o banco.
- **Contrato (§2.2).** `UNAVAILABLE` entrou em `SLOT_STATUSES`. Como o `@ApiProperty({ enum: SLOT_STATUSES })` do `slot-grid.dto.ts:21` lê dessa lista, o Swagger fica certo sem duplicar nada no backend.
- **Precedência.** A ordem bloqueado → reservado → indisponível → em reserva → livre (`slot-status.ts:31-33`) bate com a spec. A comparação `<=` cobre o caso "início igual ao now".
- **Tempo (§2.1 item 12).** A comparação é feita sobre instantes (`getTime()`), sem nenhuma conta de fuso nova.
- **Frontend (§2 e §4).** O componente continua sem acessar a API. O novo status reaproveita o estilo `desabilitado`, que vem dos tokens, sem cor nova. Os dois `Record<SlotStatus, …>` obrigam o compilador a cobrir o status novo.
- **Testes.** O unitário usa relógio fixo e cobre os dois lados da fronteira (`NOW` e `PAST`) para cada situação. Os dois e2e sobrescrevem o `CLOCK` e verificam pelo HTTP o que a resposta mostra, sem depender de detalhes internos.

## Sugestões (não bloqueiam)
- O teste do `SlotItem.spec.ts` verifica as classes `bg-desabilitado` e `.bg-sucesso`. Quebra se o visual mudar, mas são utilitários dos tokens e o padrão já existia nos testes anteriores. Não trato como acoplamento a implementação.
- Em `slot-status.spec.ts`, o caso "bloqueado continua bloqueado, mesmo com reserva" tem dois `expect` num mesmo `it`. Se separar em dois casos, uma falha aponta direto qual dos dois quebrou.

## Observações fora do escopo deste diff
- O `SlotStatus` do web (`apps/web/src/features/grade/services/grade.service.ts:11`) é uma união escrita à mão, e não um tipo derivado do `schema.d.ts` gerado pelo `openapi-typescript` (§2 "Contrato da API no frontend" e §2.2). O diff só acrescentou `UNAVAILABLE` a ela, mas a duplicação já existia e obriga a atualizar os dois lados a cada status novo. Fica como candidata a Issue de manutenção.
- Banco de dev: o e2e terminou sem erro. Não verifiquei se sobraram dados de teste no banco, porque isso exigiria consultá-lo fora do diff.
