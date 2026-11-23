# Parecer de Conformidade — Tarefa 8 (rodada 2)

**Veredito:** APROVADO

Como revisei, passo a passo: li `.agents/agents/revisor-conformidade.md` -> li o CA13 e o CA14 na spec antes do código -> li a Tarefa 8 no plano -> li os três arquivos da r1 (conformidade, código, decisões) -> li o diff do índice (8 arquivos, +392; nenhuma alteração fora do índice) e conferi `apps/web/src/api/client.ts` -> rodei os unitários. Resultado: apps/web 53/53 (10 arquivos), apps/api 69/69 (13 arquivos). Não alterei nenhum arquivo.

## Critérios verificados
| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA13: credenciais certas -> token no `sessionStorage` e ida para `/admin` | atendido (sem mudança desde a r1) | `LoginPage.vue:27-29`, `LoginPage.spec.ts` |
| CA13: recarregar mantém a sessão / fechar a aba exige entrar de novo | atendido no armazenamento (Tarefa 7); a ida ao login sem token fica com o guard da Tarefa 9 | `useSession.ts` |
| CA13: recusa `401`/`400`/`429` -> mensagem da API, sem token, continua no login | atendido | `auth.service.ts:30-32`, `auth.service.spec.ts:31-38` (it.each com o `ApiError` real), `LoginPage.spec.ts` |
| CA13: sem resposta -> "Não foi possível conectar ao servidor." | atendido, e agora provado contra o código de produção | `client.ts:46` -> `auth.service.ts:30-32`; `auth.service.spec.ts:40-47` |
| CA13: **Entrar** desabilitado durante o pedido | atendido (sem mudança) | `LoginPage.vue:23,86`, `LoginPage.spec.ts` |
| CA14: o `401` do login não é sessão vencida (`{ sessionExpiry: false }`) | atendido | `auth.service.ts:24-28`, `auth.service.spec.ts:20-29` |
| CA14: `401` comum -> `/admin/login` com "Sua sessão terminou. Entre de novo." | atendido (sem mudança) | `session-expired.ts`, `main.ts`, `LoginPage.vue`, `session-expired.spec.ts` |
| CA14: cabeçalho `Authorization` montado num único lugar | atendido | só `client.ts` monta o cabeçalho; nada no diff monta cabeçalho |
| Escopo: nada das Tarefas 9 e 10 antecipado | atendido | o diff da r2 só mexe no `auth.service.spec.ts` |

## Resolução do apontamento 1 da r1 (aceito)
Está resolvido. O arquivo `apps/web/src/features/admin/services/auth.service.spec.ts:5-11` agora usa `vi.mock('@/api/client', async (importOriginal) => ...)` e devolve `{ ...actual, apiPost: vi.fn() }`. Com isso, `ApiError` e `NetworkError` são as classes reais do client. O teste da falha de rede (linhas 40-47) cria `new NetworkError(new TypeError('fetch failed'))` sem passar nenhum texto, e a asserção `toBe('Não foi possível conectar ao servidor.')` confere a mensagem que vem do construtor de produção (`client.ts:46`). Se esse texto mudar no `client.ts`, o teste quebra, que era justamente o que faltava na r1. O comentário falso apontado pelo revisor de código também foi corrigido (linha 8). O `vi.stubEnv('VITE_API_URL', ...)` dentro da factory só serve para o client carregar e não interfere no que é testado.

## Apontamentos
(nenhum)

## Observações (não bloqueiam)
- Continuam abertas, como registrado na r1 e nas decisões: a rota `/admin` provisória (`router/index.ts:18-24`) precisa ser conferida na Tarefa 9, e as sugestões não bloqueantes do revisor de código (chave do storage no `LoginPage.spec.ts`, nome do id de erro) não foram tratadas porque não foram levadas à triagem.
