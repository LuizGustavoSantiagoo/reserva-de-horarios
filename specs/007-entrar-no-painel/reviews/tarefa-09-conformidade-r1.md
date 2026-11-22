# Parecer de Conformidade — Tarefa 9

**Veredito:** APROVADO

A Tarefa 9 atende ao que a spec pede para CA15 e CA16 dentro do recorte do plano. Não alterei nenhum arquivo. Usei o shell só para `git diff`, `git status`, `grep` e os testes unitários.

Passo 1 -> li o `spec.md`, o `plan.md` (seção Frontend e Tarefas 9 e 10) e os pareceres `tarefa-08-*`. Passo 2 -> li o diff inteiro do índice contra `0d6c22e`: 8 arquivos, todos no índice, sem nada fora dele. Passo 3 -> rodei os testes: `apps/web` com 13 arquivos e 68 testes verdes; `apps/api` com 13 arquivos e 69 testes verdes. Passo 4 -> classifiquei cada critério abaixo.

## Critérios verificados
| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA15: o painel mostra o e-mail e o papel em português ("Administrador"/"Operador"), lidos de `GET /users/me` | atendido | `AdminLayout.vue:11-14,47-50`; `users.service.ts:25-34` (`apiGet('/users/me')`); `AdminLayout.spec.ts` (dois primeiros testes); `users.service.spec.ts` (confere o caminho `/users/me`) |
| CA15: **Cadastrar operador** aparece só para o `ADMIN` | atendido | `AdminLayout.vue:55-62` (`v-if="user?.role === 'ADMIN'"`); os testes conferem o `href` para o ADMIN e a ausência do link para o OPERATOR |
| CA15: **Sair** apaga o token do `sessionStorage` e da memória e leva a `/admin/login` | atendido | `AdminLayout.vue:32-35`; o teste confere `token.value`, `sessionStorage`, `replace({ name: 'admin-login' })` e a rota final |
| CA15: voltar com o botão do navegador não reabre o painel | atendido | `replace` em `AdminLayout.vue:34` + guard em `guards.ts:18-23`; `guards.spec.ts`, último teste (`router.back()` e depois `push('/admin')` caem no login, e o e-mail some da tela) |
| CA15: se `GET /users/me` falhar por rede ou erro do servidor, aparece a mensagem com **Tentar de novo**, sem apagar a sessão | atendido | `users.service.ts:28-33` (`ApiError`/`NetworkError` viram `ProfileError`); `AdminLayout.vue:21-29,73-85`; `AdminLayout.spec.ts` (`it.each` rede/500 mantém o token e a rota; **Tentar de novo** chama o `getMe` 2 vezes); `users.service.spec.ts` confere o texto de produção com as classes reais do client |
| CA16: sem token, `/admin` leva a `/admin/login` sem mostrar o painel | atendido | `router/index.ts` (rota `/admin` com `meta.requiresAuth`, `beforeEach(requireSession)`); `guards.spec.ts` ("sem token, /admin vai para /admin/login"), rodando sobre o `createAppRouter` real |
| CA16: sem token, `/admin/operadores/novo` leva ao login | fora desta tarefa | A rota só nasce na Tarefa 10. Como o filho fica dentro de `/admin`, o `meta` herdado já vai cobrir esse caminho |
| CA16: um OPERATOR em `/admin/operadores/novo` volta a `/admin` | fora desta tarefa | Tarefa 10 |
| CA16: a grade (`/`) abre sem login, com ou sem token | atendido | `router/index.ts` (rota `grade` sem `meta`); `guards.spec.ts` (`it.each` com e sem token) |
| A rota `/admin` provisória sai nesta tarefa (pendência dos pareceres `tarefa-08-*`) | atendido | O diff remove a rota inline com `Promise.resolve({ render: () => h(...) })` e o `import { h }`; o `grep` não acha mais `h(` em `router/` |
| Nada da Tarefa 10 adiantado (página de cadastro, `createOperator`, regra de papel no guard) | atendido | O diff não tem `CadastrarOperadorPage`, `createOperator` nem `meta.roles` |

## Apontamentos
(nenhum)

## Observações sobre as decisões do implementador (nenhuma reprova)
- **Link por caminho `"/admin/operadores/novo"` antes da rota existir:** aceitável. O CA15 pede o item visível só para o ADMIN, e a rota chega na Tarefa 10 desta mesma história. Até lá, clicar no link não encontra rota e a tela fica vazia. Na Tarefa 10 vale conferir que esse caminho cai no filho de `/admin` e herda o `requiresAuth`.
- **`ProfileError` no `users.service`:** conforme. É o que separa "rede ou servidor" (mensagem com Tentar de novo, sessão mantida) do `401`, que o client já trata limpando a sessão e chamando o callback (CA14). Num `401`, o layout ainda mostra por um instante a mensagem da API antes do `replace` para o login. Isso não fere nenhum critério.
- **Rótulos dos papéis no `AdminLayout`:** conforme o plano ("rótulos de papel só no front") e a spec.
- **Sair sempre visível e página filha só depois do perfil:** conforme. O Sair visível durante o carregamento e o erro não contraria nada, e esconder a filha até o perfil chegar evita mostrar o painel sem saber quem entrou.
- **"Carregando o painel…":** não conto como escopo inflado. É o mínimo para a tela não ficar vazia enquanto o `getMe` não responde, e não cria nenhum comportamento novo.
- **O `useSession` não guarda o perfil:** é um desvio do texto do plano ("Guarda também o perfil..."), mas não fere nenhum critério desta tarefa, porque o perfil só tem consumidor no guard de papel da Tarefa 10. Fica registrado para ser cobrado lá.
- **"Voltar a /admin" provado com `push('/admin')` depois do Sair:** aceitável e, na prática, mais forte que o `router.back()` sozinho. Como o Sair usa `replace`, o `back()` no histórico em memória cai em outra entrada `/admin/login` e não passa por `/admin`. Quem prova que `/admin` não reabre é o `push('/admin')` seguido da confirmação de que o e-mail sumiu da tela. O teste faz as duas coisas.
- **Glossário:** o tipo do front se chama `User`, enquanto a entidade no glossário (`docs/architecture.md` §5.1) é `AdminUser`. O termo segue o `UserDto` e a pasta `users/` da API, já aprovados nas Tarefas 3 a 5, então não aponto. Fica a registrar caso o revisor de código queira uniformizar.
