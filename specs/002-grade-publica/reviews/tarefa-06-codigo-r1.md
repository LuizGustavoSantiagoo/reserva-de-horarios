# Parecer de Código — Tarefa 6

**Veredito:** APROVADO

Como cheguei aqui: li `.agents/agents/revisor-codigo.md` → li `docs/architecture.md` (§2.1, §3, §4 e a regra dos tokens em §2) → rodei `git diff --cached d6941c518ea70b6e1ab6622e8aea8fb9bd7568be` e li o diff inteiro (5 arquivos) → conferi CA2/CA3 na spec, as Tarefas 7 e 10 no plano, o `grade.service.ts` e os tokens → rodei as suítes. Não alterei nenhum arquivo.

## Apontamentos (bloqueiam)
Nenhum.

O que conferi:
- **Camadas do front (§4):** `GradePage.vue` e `SlotList.vue` continuam sem `fetch` e sem URL. A página só chama `listCourts`/`getSlots` do service do domínio. Nenhum import de outro domínio.
- **Três estados (§4):** a tarefa cobre o estado vazio nos dois níveis. "Nenhuma quadra disponível" aparece sem seletor e sem chamar `getSlots`. "Não há horários neste dia" aparece dentro do `SlotList`, com os seletores mantidos. O carregando passou a separar `courts === undefined` de `courts === []`, e há comentário explicando isso. O estado de erro ainda não existe, mas o plano o deixa para as Tarefas 7 e 10, então não conta contra esta.
- **Tokens (§2, Estilo):** só usa `text-legenda` e `text-texto-suave`, que existem em `docs/design-tokens.md` e já eram a classe da mensagem de carregando. Nenhuma cor ou tamanho solto.
- **Padrões Vue:** `<script setup lang="ts">`, props tipadas com `defineProps<...>()`, estado em `ref`.
- **API:** o diff não toca em código de produção da API, só no e2e. Os dois testes novos conferem o envelope `{ data: ... }` (§2.1 item 5). O caso de terça usa a agenda do `beforeEach`, que só tem domingo e segunda, e há comentário dizendo isso.
- **Sem duplicação:** os dois textos aparecem uma única vez no repositório.
- **Sem abstração nova** e sem tratamento de erro que esconda falha.

Resultado das suítes:
- **apps/api:** `npm test` 52/52, `npm run build` ok, `npm run lint` sem avisos, `npm run test:e2e` 17/17 (4 arquivos).
- **apps/web:** `npm run test:unit -- --run` 33/33 (7 arquivos), `VITE_API_URL=http://localhost:3000 npm run build` ok, `npm run lint` sem avisos e sem deixar diff pendente. O `git status` depois de tudo mostra só os 5 arquivos no índice.
- **Banco de dev:** o e2e roda `resetDatabase` antes de cada teste, então o banco de dev ficou com os dados do último teste. Só estou relatando, não mexi.

## Sugestões (não bloqueiam)
- `apps/web/src/features/grade/components/SlotList.spec.ts:27`: `wrapper.find('ul').exists()` depende da tag usada na lista. Para combinar com o teste vizinho, que usa `[data-test="slot"]`, dá para verificar `findAll('[data-test="slot"]')` com tamanho 0, ou usar um `data-test` na lista. Assim o teste não quebra se a lista virar outro elemento.
- `apps/web/src/features/grade/pages/GradePage.vue:59-62`: as três ramificações (vazio / carregando / grade) dependem de `courts` ser `undefined` ou `[]`. Quando a Tarefa 10 incluir o erro, vale avaliar um estado explícito (por exemplo `status: 'loading' | 'empty' | 'error' | 'ready'`) para o template não virar uma cadeia de `v-else-if` com condições combinadas. Não é necessário agora.

## Observações fora do escopo deste diff
- O `onMounted` de `GradePage.vue` não trata falha de `listCourts`/`getSlots`. Isso já está no plano (Tarefas 7 e 10), então não precisa de Issue de manutenção.
