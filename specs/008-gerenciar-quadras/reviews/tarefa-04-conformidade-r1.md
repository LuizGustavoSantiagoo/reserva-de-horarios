# Parecer de Conformidade — Tarefa 4

**Veredito:** APROVADO

Fiz assim: li a spec e a Tarefa 4 do plano -> li o diff inteiro de `apps/web` (`git diff --cached 6ee273f -- apps/web`) -> rodei `npm run test:unit -- --run` em apps/web: 17 arquivos e 168 testes, todos passando -> comparei cada critério com o código. Não alterei nenhum arquivo.

## Critérios verificados
| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA9: item de menu **Quadras** para ADMIN e OPERATOR, levando a `/admin/quadras` | atendido | `apps/web/src/features/admin/pages/AdminLayout.vue:58-63`; teste `AdminLayout.spec.ts:91-100` |
| CA9: nome e endereço da arena, quadras por nome com "Ativa"/"Inativa", vindas de `GET /arena` | atendido | `QuadrasPage.vue` (bloco `data-test="arena"` e `li data-test="court"`); `courts.service.ts` `getArena` -> `apiGet('/arena')`; testes `QuadrasPage.spec.ts:142-151`, `courts.service.spec.ts:541-555` |
| CA9: estado de carregando | atendido | `QuadrasPage.vue` ("Carregando as quadras…"); `QuadrasPage.spec.ts:153-160` |
| CA9: falha de rede ou 500 mostra a mensagem com **Tentar de novo**, que chama de novo | atendido | `QuadrasPage.vue` (`role="alert"` + botão chamando `loadArena`); `QuadrasPage.spec.ts:162-183`; conversão `ApiError`/`NetworkError` -> `ArenaError` testada com as classes reais do client (`courts.service.spec.ts:557-573`) |
| CA9: sem quadras, "Nenhuma quadra cadastrada." | atendido | `QuadrasPage.spec.ts:185-192` |
| CA9: sem token, `/admin/quadras` leva a `/admin/login` | atendido | `apps/web/src/router/index.ts:40-45` (rota filha de `admin/`, sem `roles`); `guards.spec.ts:832-838` |
| CA10: cadastro válido mostra "Quadra <nome> cadastrada.", a quadra entra como "Ativa" no lugar certo da ordem e o campo é limpo | atendido | `QuadrasPage.vue` `submit()` + `byName`; `QuadrasPage.spec.ts:221-257` |
| CA10: 400/409 mostram a mensagem embaixo do campo e nada entra na lista | atendido | `courts.service.ts` `nameMessage` (409 -> `fields.name`; 400 -> `fields.name` juntado); mensagem ligada ao campo por `aria-describedby`; `QuadrasPage.spec.ts:259-272`, `courts.service.spec.ts:591-611` |
| CA10: sem resposta da API, "Não foi possível conectar ao servidor." e o nome continua no campo | atendido | `QuadrasPage.spec.ts:274-285`; `courts.service.spec.ts:622-629` |
| CA10: **Cadastrar** desabilitado enquanto o pedido está em andamento | atendido | `QuadrasPage.vue` (`:disabled="submitting"` e guarda no início de `submit`); `QuadrasPage.spec.ts:305-324` (testa também o segundo envio sendo ignorado) |
| CA10: o OPERATOR não vê o formulário **Nova quadra** | atendido | `QuadrasPage.vue` (`v-if="isAdmin"`, lido do perfil que o `AdminLayout.vue:28` grava na sessão); `QuadrasPage.spec.ts:194-202` |
| Pedido do usuário no plano: link "Entrar no painel" na grade pública levando a `admin-login` | atendido (consta no plano aprovado, então não é escopo inflado) | `apps/web/src/features/grade/pages/GradePage.vue:781-786`; `GradePage.spec.ts:745-752` |
| Abandono: rede caindo no meio do cadastro, o nome fica no campo | atendido | já coberto pelo teste de rede do CA10 |
| Abandono: dois toques em Cadastrar | atendido | já coberto pelo teste de botão desabilitado |
| Abandono: sessão expira (401 leva ao login) | atendido (delegado ao client da US06, como a spec prevê) | comentário em `QuadrasPage.vue` `loadArena`; não há teste novo, porque o tratamento é do `src/api/client.ts` |
| CA1–CA8 (API) | fora desta tarefa | Tarefa 1, com outro revisor |

## Apontamentos

