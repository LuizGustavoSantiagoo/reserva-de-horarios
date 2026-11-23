# Parecer de Código: Tarefa 7 (rodada 2)

**Veredito:** APROVADO

O apontamento aceito na r1 foi corrigido e não encontrei nenhum problema bloqueante novo no diff.

## O que fiz, passo a passo
Passo 1: li `.agents/agents/revisor-codigo.md` e `docs/architecture.md` -> Passo 2: li o diff inteiro (`git diff --cached e51a540…`, sem `reviews/`), 11 arquivos, junto com os pareceres e as decisões da r1 -> Passo 3: conferi a correção do apontamento da r1 -> Passo 4: rodei todas as verificações -> Passo 5: rodei `git status` de novo e ele continua igual ao do início. Não alterei nenhum arquivo.

## Correção do apontamento da r1
A página não fala mais com o cliente HTTP:
- `apps/web/src/features/grade/pages/GradePage.vue` importa só de `../components/` e `../services/`. Não há ocorrência de `@/api` em `features/grade/pages` nem em `features/grade/components`.
- A tradução do erro mora no service: `toRefusal` em `grade.service.ts` transforma 404 em `GradeRefusal('court', …)` e 400 em `GradeRefusal('day', fields.date[0] ?? message)`; qualquer outro erro, inclusive `NetworkError`, sai como veio. Segue a §4: mudança de contrato mexe só no service.
- O `GradePage.spec.ts` não precisa mais do stub de `VITE_API_URL`; o stub ficou só em `grade.service.spec.ts`.
- O `grade-refusal.ts` separado tem motivo concreto (a página e o spec dela usam a classe sem carregar `@/api/client`).
- Os testes novos do service cobrem 404, 400 com e sem o campo `date`, 500 e erro de rede relançados.

## Verificações
- **apps/api:** `npm test` (52/52), `npm run build`, `npm run lint`, `npm run test:e2e` (26/26).
- **apps/web:** `npm run test:unit -- --run` (47/47), build com `VITE_API_URL`, `npm run lint` sem diff.
- **Banco:** o e2e pode ter deixado dados de teste no banco de dev; não conferi nem limpei.

## Apontamentos (bloqueiam)
(nenhum)

## Sugestões (não bloqueiam)
- Em `toRefusal`, todo 400 vira recusa do **dia**. Hoje está certo (só existe o campo `date`). Se a rota ganhar outro parâmetro de query, vale olhar `fields.date` em vez de só o status.

## Observações fora do escopo deste diff
- Já registradas na r1 e encaminhadas para a Tarefa 10: `void loadGrid(...)` com `throw` no `catch` faz falha de rede virar *unhandled rejection*; pedidos em sequência rápida podem disputar entre si.
