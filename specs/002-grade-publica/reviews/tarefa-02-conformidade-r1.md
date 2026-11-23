# Parecer de Conformidade — Tarefa 2

**Veredito:** APROVADO

Passo 1 -> li `.agents/agents/revisor-conformidade.md` e segui o método dele.
Passo 2 -> li a spec e o plan antes de abrir o código.
Passo 3 -> li o diff inteiro (`git diff 04d06def…`), com as remoções.
Passo 4 -> conferi o diff contra `docs/design-tokens.md` e `docs/architecture.md`: §2 (estilo e contrato), §2.1 item 5 (formato de erro), §2.2, §3, §4 e §5.1 (glossário).
Passo 5 -> rodei os testes. Não alterei nenhum arquivo.

**Testes que rodei (em `apps/web`):**
- `npm run test:unit -- --run`: 1 arquivo, 5 testes, todos passaram.
- `npm run build`: `vue-tsc --build` e `vite build` passaram, CSS gerado com 4,32 kB.
- `CI=1 npx playwright test --project=chromium`: 1 teste, passou.

## Critérios verificados
| Critério (da spec / tarefa) | Situação | Onde |
| --- | --- | --- |
| Teste primeiro: sucesso devolve o conteúdo de `data` | atendido | `apps/web/src/api/client.spec.ts:25-33`; `apps/web/src/api/client.ts:51-52` |
| Teste primeiro: erro vira `ApiError` com `statusCode`, `message` e `fields` | atendido. O teste confere a classe e os três campos; há também um caso de 404 sem `fields` | `client.spec.ts:35-73`; `client.ts:16-26, 55-61` |
| Teste primeiro: falha de rede vira um erro próprio | atendido. `NetworkError` é diferente de `ApiError`, e o teste confere as duas coisas | `client.spec.ts:86-93`; `client.ts:29-34, 40-45` |
| Prepara o CA10 ("falha de rede ou erro do servidor") | atendido como base. Rede, 5xx e corpo fora do formato (por exemplo uma página HTML 502) chegam como erros que dá para separar; a tela fica para a Tarefa 10 | `client.spec.ts:75-84`; `client.ts:55-61` |
| Prepara o CA11 (mensagem da API com o campo da data) | atendido como base. `fields.date` chega no formato `{ campo: [mensagens] }`, como pedem o plan ("Formato de erro") e a architecture §2.1 item 5 | `client.ts:7, 13` |
| `main.css` com `@import "tailwindcss"` e `@theme` com os tokens | atendido. Bati os tokens um a um com `design-tokens.md`: paleta (8), espaçamento (6, de `xs` a `2xl`), as duas fontes e tipografia (5, com tamanho e peso). Os nomes semânticos são os mesmos | `apps/web/src/assets/main.css:1-47` |
| `vite.config.ts` com `@tailwindcss/vite` | atendido | `apps/web/vite.config.ts:6, 13` |
| `package.json` com Tailwind 4, `@tailwindcss/vite`, `openapi-typescript` e o script `api:types` | atendido. O script usa `/docs-json` e grava em `src/api/schema.d.ts`, como na architecture §2.2 | `apps/web/package.json:18, 26, 43, 46` |
| `router/index.ts` e `App.vue` sem o exemplo do `create-vue` | atendido | `apps/web/src/router/index.ts`; `apps/web/src/App.vue` |
| Remoção das views e componentes de exemplo | atendido. Saíram `views/`, `components/` (com ícones e o teste do HelloWorld), `base.css` e `logo.svg` | diff (remoções) |
| Nada adiantado de tarefas futuras | atendido. Não há `features/`, `GradePage` nem rota registrada (`routes: []` com `// TODO #2` apontando a Tarefa 3); `src/` tem só `App.vue`, `main.ts`, `api/`, `assets/` e `router/` | `apps/web/src/router/index.ts:6-7` |
| Glossário (§5.1) | atendido. Nenhum termo do domínio aparece com nome diferente; `ApiError` e `NetworkError` são da infraestrutura do cliente | — |

## Apontamentos

(nenhum)

**Notas, sem bloqueio e sem pedido de correção:**
- Dois arquivos alterados não estavam na lista do plan, e os dois têm justificativa:
  - `apps/web/.gitignore` ignora `src/api/schema.d.ts`, como manda a architecture §2.2 ("não é commitado").
  - `apps/web/e2e/vue.spec.ts` deixou de procurar o `h1` "You did it!", que sumiu com o HelloWorld. Agora confere só que `#app main` montou, com `// TODO #2` para a Tarefa 3.

  Nenhum dos dois cria comportamento que a spec não pediu.
- O bloco `overrides` no `package.json` (o `typescript` do `openapi-typescript`) e o `VITE_API_URL`, que tem padrão `http://localhost:3000` em `client.ts:5`, não são questão de conformidade com a spec. Ficam para o revisor de código avaliar contra a architecture.
- Até a Tarefa 3, `/` não tem rota: o app monta só o `<main>` vazio. Isso é esperado num passo técnico e está marcado com TODO.

**Arquivos relevantes:**
- /home/santiago/Documentos/dev/faculdade/reserva-de-horarios/apps/web/src/api/client.ts
- /home/santiago/Documentos/dev/faculdade/reserva-de-horarios/apps/web/src/api/client.spec.ts
- /home/santiago/Documentos/dev/faculdade/reserva-de-horarios/apps/web/src/assets/main.css
- /home/santiago/Documentos/dev/faculdade/reserva-de-horarios/apps/web/package.json
- /home/santiago/Documentos/dev/faculdade/reserva-de-horarios/apps/web/vite.config.ts
- /home/santiago/Documentos/dev/faculdade/reserva-de-horarios/apps/web/src/router/index.ts
- /home/santiago/Documentos/dev/faculdade/reserva-de-horarios/apps/web/src/App.vue
- /home/santiago/Documentos/dev/faculdade/reserva-de-horarios/apps/web/.gitignore
- /home/santiago/Documentos/dev/faculdade/reserva-de-horarios/apps/web/e2e/vue.spec.ts
