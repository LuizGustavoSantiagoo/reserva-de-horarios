# Parecer de Código: Tarefa 10

**Veredito:** APROVADO

Revisei o diff `git diff --cached 7d30f9f` (`GradePage.vue` e `GradePage.spec.ts`) contra `docs/architecture.md`, principalmente o §4; olhei também `grade.service.ts`, `grade-refusal.ts` e `src/api/client.ts`.

**Verificações (todas passaram):** apps/web `npm run test:unit -- --run` 71/71 (7 novos); build com `VITE_API_URL`; `npm run lint` sem nada fora do índice; apps/api `npm test` 52/52.

## Apontamentos (bloqueiam)
Nenhum.

**Conferido contra a arquitetura:**
- **Camada de dados (§4):** a página chama só `getSlots`/`listCourts` do service do domínio.
- **Estados assíncronos com a mensagem do formato padrão (§4):** `loadError` mostra a mensagem do `ApiError`/`NetworkError`; carregando, erro e vazio distintos.
- **Polling (§4):** o `.catch(() => {})` da Tarefa 9 saiu; a falha vira estado (`refreshFailed`).
- **Vue (§2) e tokens:** `<script setup>`, `ref`, classes dos tokens.

**Decisões verificadas:**
- `loadError` / `refreshFailed` separam bem falha sem grade (erro + "Tentar de novo") e com grade (aviso); carga bem-sucedida limpa os dois.
- `loadGrid` não rejeita mais: o `void loadGrid(...)` de `selectCourt`/`selectDay` deixou de gerar rejeição sem tratamento (fecha a observação da Tarefa 9).
- `loadPage` faz a primeira carga e o "Tentar de novo"; testes cobrem os três caminhos.
- Troca de quadra/dia que falha com grade na tela: a grade fica e o `courtId` volta para o da grade; testado.
- Meia-noite: `GradeRefusal('day')` no polling recarrega sem `date` e grava o novo dia; testado.
- Nenhuma rejeição sem tratamento no intervalo nem nas trocas.

## Sugestões (não bloqueiam)
- **Corrida com duas trocas rápidas** (q2 falha, q3 dá certo): o seletor pode marcar q1 sobre a grade de q3; um contador de pedidos resolveria (o mesmo sugerido na Tarefa 9).
- **Quadra desativada durante o polling:** `GradeRefusal('court')` no `refreshGrid` vira o aviso para sempre; talvez tratar como recusa (CA11) ou registrar no plano.
- **`errorMessage`** aceita qualquer `Error`; um erro de programação mostraria mensagem técnica.
- **Classes repetidas** dos botões "Tentar de novo" e "Voltar para hoje": se surgir um terceiro, vale um botão base em `shared/`.

## Observações fora do escopo
- `loadGrid` não descarta respostas fora de ordem em trocas rápidas (já existia): candidata a Issue de manutenção junto com o contador de pedidos.
