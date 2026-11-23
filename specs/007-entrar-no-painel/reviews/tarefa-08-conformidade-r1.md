# Parecer de Conformidade — Tarefa 8

**Veredito:** APONTAMENTOS

Como revisei, passo a passo: li `.agents/agents/revisor-conformidade.md` -> li a spec (CA13 e CA14) antes do código -> li a Tarefa 8 e a seção Frontend do plano -> li os pareceres `tarefa-07-*` -> li o diff inteiro (`git diff --cached 460bb70…`, 8 arquivos) e, para conferir, `client.ts` e `useSession.ts` -> rodei os testes. Resultado: apps/web 53/53, `vue-tsc --noEmit` sem erro, apps/api 69/69. Não rodei e2e e não alterei nenhum arquivo.

## Critérios verificados
| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA13: credenciais certas -> token no `sessionStorage` e ida para `/admin` | atendido | `LoginPage.vue:27-29`; o spec confere `token`, `sessionStorage['reserva.token']` e a rota `admin` |
| CA13: recarregar a página mantém a sessão | atendido (Tarefa 7) | `useSession.ts:8`, que lê o `sessionStorage` quando o módulo carrega |
| CA13: fechar a aba exige entrar de novo | atendido no armazenamento (`sessionStorage`); a ida ao login sem token fica com o guard da Tarefa 9 (CA16) | `useSession.ts` |
| CA13: recusa `401`/`400`/`429` -> mensagem da API, sem token, continua no login | atendido | `auth.service.ts:30-32` + `LoginPage.vue:31-33`; `LoginPage.spec.ts` (it.each) e `auth.service.spec.ts` (it.each 401/400/429) |
| CA13: sem resposta -> "Não foi possível conectar ao servidor." | atendido no código, mal provado no teste (apontamento 1) | `client.ts:46` -> `auth.service.ts:30-32` -> `LoginPage.vue:32` |
| CA13: **Entrar** desabilitado durante o pedido | atendido | `LoginPage.vue:23,86`; o teste confere `disabled`, que um segundo submit não chama de novo e que o botão volta a funcionar na resposta |
| CA14: o `401` do login não é sessão vencida | atendido | `auth.service.ts:24-28` usa `{ sessionExpiry: false }`; o teste confere os argumentos do `apiPost` |
| CA14: `401` comum -> leva a `/admin/login` com "Sua sessão terminou. Entre de novo." | atendido | `session-expired.ts:11-13` (`router.replace` com `?sessao=expirada`), registrado em `main.ts:13`; aviso em `LoginPage.vue:20,52-58`; `session-expired.spec.ts` + o teste do `?sessao=expirada` |
| CA14: cabeçalho montado num único lugar | atendido (continua) | só `client.ts:89` monta `Authorization`; nada no diff monta cabeçalho |
| Termos do glossário (§5.1) | atendido | nenhum termo de domínio diverge |
| Nada das Tarefas 9 e 10 antecipado | atendido | `/admin` é provisória, sem guard, sem layout e sem `getMe` |

## Apontamentos
1. **O teste da falha de rede confere uma mensagem que vem do próprio mock, e nenhum teste confere o texto do CA13 contra o código de verdade** — `apps/web/src/features/admin/services/auth.service.spec.ts:5-20` e `:52-58`
   Critério violado: CA13, "quando a API não responde, vejo 'Não foi possível conectar ao servidor.'"
   Evidência: o `vi.mock('@/api/client')` declara um `NetworkError` falso com o texto fixo no construtor (linha 15). Assim, a asserção `toBe('Não foi possível conectar ao servidor.')` (linha 57) confere o texto que o próprio mock escreveu. O comentário da linha 6 ("As classes de erro são as de verdade") não corresponde ao código: as classes são substitutas. O `LoginPage.spec.ts:89` injeta o texto já pronto num `LoginError`. Procurei o texto em `apps/web/src` e ele só aparece em `client.ts:46`: nenhum spec fora de `features/admin` o confere (o `client.spec.ts:114-119` só confere `instanceof NetworkError`). Se alguém mudar a mensagem em `client.ts`, todos os testes continuam verdes. A parte "falha de rede vira `LoginError`" está provada; o texto que o usuário vê, não.

## Observações (não bloqueiam)
- **Rota `/admin` provisória inline** (`router/index.ts:18-24`): aceitável. O CA13 exige um destino, o `TODO #7` registra que a Tarefa 9 a troca, e ela não antecipa comportamento. Precisa ser conferida na Tarefa 9.
- **`auth.service` traduz `ApiError`/`NetworkError` em `LoginError`**: conforme ao CA13, porque a mensagem exibida continua sendo a da API. A página não conhecer status HTTP é decisão de código. A troca fez o teste de componente deixar de usar `NetworkError`, como o plano previa, e passar a usar `LoginError`; daí vem o apontamento 1.
- **`setToken` na página**: conforme ao plano ("quem guarda a sessão é a tela"). O teste prova memória e `sessionStorage`.
- **`router.replace` no callback**: é o que o plano pede (linha 185). O teste do "voltar" (`session-expired.spec.ts:30-41`) prova o efeito.
- **`novalidate`**: conforme ao CA13 ("a mensagem que a API devolveu"). Sem ele, o navegador barraria o e-mail mal formado com a mensagem dele, e o `400` da API nunca apareceria.
- **Plano x código no destino do login**: o plano fala em `router.push` para `admin` e o código usa `push`. Com o guard da Tarefa 9, voltar pelo navegador depois de entrar cai no `/admin/login` já logado. Isso não fere nenhum CA desta tarefa; fica só registrado.
- Rótulo "Entrando…", spinner e `aria-busy` detalham o estado de carregamento que o CA13 pede. Não contam como escopo inflado.
