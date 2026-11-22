# Parecer de Código: Tarefa 8, rodada 2

**Veredito:** APROVADO

O apontamento aceito na r1 foi resolvido e a mudança não trouxe problema novo. Não alterei nenhum arquivo.

## Como revisei
Passo 1: li `.agents/agents/revisor-codigo.md` e os três arquivos da r1 em `/home/santiago/Documentos/dev/faculdade/reserva-us06/specs/007-entrar-no-painel/reviews/`: `tarefa-08-codigo-r1.md`, `tarefa-08-conformidade-r1.md` e `tarefa-08-decisoes-r1.md`. O único apontamento aceito é o do teste da falha de rede, que conferia o texto escrito pelo próprio mock.
Passo 2: li o diff inteiro do despacho (`git diff --cached 460bb709… -- . ':!specs/.../reviews'`, 8 arquivos). Como o diff sai inteiro, conferi que, dos arquivos da r1, só o `auth.service.spec.ts` mudou de conteúdo.
Passo 3: comparei o spec com `apps/web/src/api/client.ts`, de onde vêm o `NetworkError` real e o `requireApiUrl`, e com o jeito como o `client.spec.ts` já usa `vi.stubEnv`.
Passo 4: rodei as verificações e conferi o `git status` depois.

## Verificações
- **web, unitários (`npm run test:unit -- --run`):** 53/53 passaram, em 10 arquivos.
- **web, lint (`npm run lint`, com `--fix`):** passou. O `git status` depois do lint mostra os mesmos 8 arquivos do diff mais os 3 da r1, todos no índice. Nenhum arquivo foi modificado fora do índice e nenhum arquivo novo apareceu.
- **web, build (`VITE_API_URL=http://localhost:3000 npm run build`):** terminou com código 0. Inclui o type-check e o `vite build`. O `LoginPage` continua num chunk separado (rota lazy).
- **api (`npm test`):** 69/69 passaram, em 13 arquivos.

## O que conferi no ponto da r1
- **Classes reais do client:** `apps/web/src/features/admin/services/auth.service.spec.ts:5-11` usa `importOriginal` e mocka só o `apiPost` (`{ ...actual, apiPost: vi.fn() }`).
  - O teste da falha de rede (`:40-47`) cria um `NetworkError` real com `new NetworkError(new TypeError(...))`, já com `cause`. A mensagem vem do construtor de produção (`client.ts`).
  - Se alguém mudar o texto em `client.ts`, esse teste agora falha. O CA13 passou a ser conferido contra o código de verdade.
- **Comentário falso:** o comentário de `:8` agora diz o que o código faz.
- **`vi.stubEnv` dentro da factory:** é preciso, porque o `client.ts` lança erro ao ser carregado se não houver `VITE_API_URL` (`requireApiUrl`, architecture §2.1 item 11). O endereço é fictício e não há rede envolvida, porque o `apiPost` é falso.
  - Não há `unstubAllEnvs`, mas o Vitest isola cada arquivo de teste por padrão. Por isso a variável não vaza para outros specs, e os 53 testes passam.
- **Acoplamento:** os testes conferem a saída pública (`LoginError` e sua `message`) e os argumentos do `apiPost`. Os argumentos são o contrato da §4 (`{ sessionExpiry: false }`), não um detalhe interno.

## Apontamentos (bloqueiam)
(nenhum)

## Sugestões (não bloqueiam)
- **Desfazer o `stubEnv`:** dá para pôr `vi.unstubAllEnvs()` num `afterAll`, como o `client.spec.ts` faz no `afterEach`. Hoje não há prejuízo, porque cada arquivo roda isolado. O prejuízo só aparece se alguém ligar `isolate: false` no `vitest.config.ts`.
- **Sugestões da r1 ainda abertas:** a chave `reserva.token` conferida em `LoginPage.spec.ts:67,84`, o `${emailId}-erro` reaproveitado no campo de senha (`LoginPage.vue:77`) e a rota `/admin` provisória com `h` em `router/index.ts`. A rota provisória precisa ser conferida na Tarefa 9, como a decisão da r1 registrou.

## Observações fora do escopo deste diff
- Continua valendo o que a r1 disse: os scripts `lint:oxlint` e `lint:eslint` do `apps/web` rodam com `--fix`, então o `npm run lint` pode reescrever arquivos. É candidato a Issue de manutenção: separar um `lint` só de verificação de um `lint:fix`.
