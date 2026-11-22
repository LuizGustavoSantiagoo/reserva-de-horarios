# Parecer de Conformidade — Tarefa 10

**Veredito:** APROVADO

Não alterei nenhum arquivo. Usei o shell só para `git diff`, `git status`, `grep` e os testes unitários. O `git status` no fim mostra só os 11 arquivos do diff, todos no índice.

Como revisei: passo 1 -> li o agente `revisor-conformidade.md`, o `spec.md` (CA14 a CA17 e a seção "Abandono no meio"), a seção Frontend e a Tarefa 10 do `plan.md` e os pareceres `tarefa-09-*` -> passo 2 -> li o diff inteiro (`git diff --cached a9d2594`, 11 arquivos, todos em `apps/web`) e o código em volta dele: `api/client.ts`, `main.ts`, `session-expired.ts` e o `users.service.ts` da API -> passo 3 -> rodei os testes: `apps/web` com 14 arquivos e 90 testes, todos verdes; `apps/api` com 13 arquivos e 69 testes, todos verdes. Não rodei e2e -> passo 4 -> classifiquei cada critério.

## Critérios verificados
| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA17: envio válido mostra "Operador <e-mail> cadastrado." e limpa o formulário | atendido | `CadastrarOperadorPage.vue:232-234,258-264`; spec "no envio válido…" (confere o texto em `role="status"` e os dois campos vazios) |
| CA17: no `400`, a mensagem aparece embaixo de cada campo que falhou | atendido | `users.service.ts` (`messagesByField`); `CadastrarOperadorPage.vue:237,276-293`; o teste da página liga a mensagem ao campo pelo `aria-describedby`; os testes do service cobrem o `fields` da API, inclusive com várias mensagens no mesmo campo |
| CA17: no `409`, "Já existe uma conta com este e-mail." aparece embaixo do e-mail | atendido | `users.service.ts` (`statusCode === 409 → { email: error.message }`); a API devolve exatamente esse texto (`apps/api/src/users/users.service.ts:30,107`); o teste da página confere a mensagem no e-mail e nada na senha |
| CA17: em nenhum caso a senha digitada aparece na tela depois do envio | atendido | `CadastrarOperadorPage.vue:240-243` (`finally` esvazia a senha); os testes de sucesso, `400`, `409` e rede conferem o campo vazio e, nos três primeiros, que o texto da senha não aparece na tela |
| CA16: sem token, `/admin/operadores/novo` leva a `/admin/login` | atendido | a rota é filha de `/admin` (`router/index.ts:656-662`) e herda o `requiresAuth`; `guards.spec.ts`, "sem token…", sobre o `createAppRouter` real, que também confere que o `getMe` não é chamado |
| CA16: um `OPERATOR` que abre `/admin/operadores/novo` direto volta a `/admin` | atendido | `guards.ts:625-631` com `meta.roles: ['ADMIN']`; testes do `OPERATOR` buscando o perfil pelo `getMe` e com o perfil já guardado |
| CA16: o `ADMIN` entra no cadastro | atendido | `guards.spec.ts`, "o ADMIN entra…" |
| CA16: a recusa `403` da API, mesmo que a chamada chegue lá | fora desta tarefa | o plano diz que isso já foi provado na Tarefa 4; a tela mostra a mensagem da API em `role="alert"` (teste do service com 403) |
| CA15: falha de rede no perfil leva ao erro com **Tentar de novo**, sem apagar a sessão (guard) | atendido | `guards.ts:639-645`; `guards.spec.ts`, "se o getMe falhar por rede…", confere a rota `/admin` e que o token continua guardado |
| Pendência da Tarefa 9: o link aponta para a rota pelo nome | atendido | `AdminLayout.vue:57` (`:to="{ name: 'admin-novo-operador' }"`); o `AdminLayout.spec.ts` usa um caminho diferente no router de teste, o que prova que o link segue o nome e não um caminho escrito à mão |
| Pendência da Tarefa 9: a rota filha de `/admin` herda o `requiresAuth` | atendido | ver a linha do CA16 sem token |
| Pendência da Tarefa 9: o `useSession` guarda o perfil para o guard de papel (plano, Frontend) | atendido | `useSession.ts` (`profile`, `setProfile`, apagado no `clearSession` e no `setToken`, fica fora do `sessionStorage`); 4 testes no `useSession.spec.ts` |

## Apontamentos
(nenhum)

## Observações sobre as decisões do implementador (nenhuma reprova)
- **Arquivos fora do previsto (`useSession.ts`, `AdminLayout.vue` e specs):** conformes. O `useSession` guardar o perfil está no texto do plano ("Guarda também o perfil…") e ficou pendente desde a Tarefa 9. O link por nome também é pendência da Tarefa 9. Não é escopo inflado.
- **Guard assíncrono com `getMe` e `meta.roles`:** é o que o plano descreve, ponto por ponto.
- **`401` no `getMe` do guard:** a descrição "admin → login" não bate exatamente com o que acontece, mas o resultado está conforme. Pelo que li no código, o client chama `clearSession()` e o handler do `main.ts`, que faz `router.replace({ name: 'admin-login', query: { sessao: 'expirada' } })` antes de o guard devolver `{ name: 'admin' }`. A navegação nova cancela a que estava pendente, o redirecionamento para `/admin` é descartado e a pessoa cai no login com o aviso do CA14. Em qualquer ordem ela termina no login, porque o token foi apagado. Nenhum teste cobre esse caminho do guard: o `guards.spec.ts` não registra o handler. Como o `401` do client já foi provado nas Tarefas 7 e 8, não aponto. Se quiserem cobrir o caso de sessão expirada da spec também por esse caminho, cabe um teste que registre o handler e confira `/admin/login?sessao=expirada`.
- **`CreateOperatorError` com `fields`:** conforme. O `409` vai para o e-mail com o texto da API, que é idêntico ao do CA17 (`apps/api/src/users/users.service.ts:30`). O texto do critério depende da API, não está fixo no front. O teste da página usa um mock com esse texto, e o teste do service prova o encaminhamento ao campo. Juntos eles cobrem o critério. Recusa sem campo (rede, 500, 403) aparece em `role="alert"`: o CA17 não pede isso, mas é o mínimo para não engolir a falha.
- **Botão "Cadastrando…" desabilitado:** o CA17 não pede, mas não conto como escopo inflado. Repete o padrão do CA13 e evita cadastro em dobro. O teste prova que o segundo envio não sai.
- **Confirmação com o e-mail devolvido pela API:** conforme. Mostra o e-mail já normalizado (sem espaços nas pontas e em minúsculas), que é o que de fato foi gravado.
- **Senha sempre esvaziada:** é a leitura direta de "em nenhum caso".
- **`AdminLayout` continua chamando `getMe` (duas buscas ao abrir a URL direto):** não fere nenhum critério, mas não cumpre tudo o que o plano pretendia ("para o guard de navegação não buscar duas vezes"). Também acontece no sentido contrário: o layout não chama `setProfile`, então quem abre `/admin` e depois clica em **Cadastrar operador** gera um segundo `GET /users/me`, agora pelo guard. É uma questão de desempenho e organização, então é do revisor de código. Registro aqui só para a triagem.
