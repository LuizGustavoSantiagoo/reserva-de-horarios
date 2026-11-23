# Parecer de Código — Tarefa 2

**Veredito:** APONTAMENTOS

Encontrei um apontamento bloqueante: o endereço do servidor local ficou escrito no código como valor padrão. A base está correta no resto: testes, build, lint e E2E passam.

**Passo a passo do que fiz:** li `.agents/agents/revisor-codigo.md` → li `docs/architecture.md` e `docs/design-tokens.md` → li o diff inteiro de `git diff 04d06de` (o lockfile só pela árvore de dependências) → rodei a verificação → compilei o `main.css` em memória para ver como o Tailwind resolve as classes → rodei o `openapi-typescript` com TS 6 num schema de exemplo, que entrou pela entrada padrão e saiu na saída padrão, sem gravar arquivo.

**Resultado da verificação (em `apps/web`):**
- `npm run test:unit -- --run`: 5/5 passaram.
- `npm run build`: o type-check (`vue-tsc --build`) e o `vite build` passaram. Ele grava `dist/`, que já está no `.gitignore`.
- Lint: rodei `npx oxlint .` e `npx eslint .` sem `--fix`, para não alterar arquivo. Os dois terminaram com exit 0 e sem nenhum aviso, então o `--fix` não teria o que mudar. Conferi o `git status` depois: nada fora do índice. O `git diff --exit-code` do CI não vai acusar nada.
- E2E: `CI=1 npx playwright test --project=chromium` passou (1/1).
- O que o implementador informou e eu conferi:
  - O `openapi-typescript@7.13.0` declara mesmo `peerDependencies: { typescript: '^5.x' }`, e o projeto resolve `typescript@6.0.3`. Com o override, a geração funciona com TS 6 (exit 0, `paths` e `components` gerados certos). O override se justifica.
  - As dependências novas (`tailwindcss`, `@tailwindcss/vite`, `openapi-typescript`) estão todas na §2 do architecture.
  - O script `api:types` aponta para o `/docs-json` local, como manda a §2.2, e o `schema.d.ts` está no `.gitignore`.
  - Os tokens do `@theme` batem um a um com `docs/design-tokens.md`.

## Apontamentos (bloqueiam)

1. **O endereço do servidor local ficou fixo no código como padrão, e a variável não está documentada em lugar nenhum.** Está em `/home/santiago/Documentos/dev/faculdade/reserva-de-horarios/apps/web/src/api/client.ts:5`:
   ```ts
   const BASE_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
   ```
   **Regra violada:**
   - Critério de reprovação deste revisor: "segredo, chave ou URL de ambiente escrita no código".
   - `architecture.md` §2.1 item 11 (ID17): configuração vem do ambiente, com validação que "derruba … na subida, não no meio de uma requisição", e as variáveis são registradas pelo nome.
   - `architecture.md` §4: "Só `src/api/` conhece URL".

   **Prejuízo concreto:**
   - Se o deploy de produção (ID19) for feito sem `VITE_API_URL`, o build passa sem aviso e o bundle chama `http://localhost:3000` no celular do cliente.
   - Toda tela mostra "Não foi possível conectar ao servidor.", e o erro de configuração vira falha de rede em tempo de execução, quando deveria aparecer no build.
   - Além disso, `VITE_API_URL` não aparece em nenhum `.env.example` (não existe `apps/web/.env.example`), nem no `architecture.md`, nem no README.
   - Como não há declaração em `env.d.ts`, o tipo dela é `any`. A anotação `: string` esconde isso.

   **Caminho sugerido (a decisão é sua):**
   - Versionar `apps/web/.env.development` (ou `.env.example`) com `VITE_API_URL=http://localhost:3000`.
   - Tirar o fallback e falhar alto quando a variável faltar.
   - Declarar `VITE_API_URL` em `ImportMetaEnv` no `env.d.ts`.
   - Registrar o nome da variável no `architecture.md`.

## Sugestões (não bloqueiam)

- **Armadilha nos nomes de espaçamento do Tailwind (a mais importante).** Compilei o `main.css` em memória: com `--spacing-xs/sm/md/lg/xl/2xl` no `@theme`, o Tailwind 4 passa a resolver as classes de tamanho por esses tokens, e não pelos `--container-*` padrão:
  - `max-w-md` vira `max-width: var(--spacing-md)` (0.75rem, e não 28rem). O mesmo vale para `max-w-xs`, `max-w-sm`, `max-w-lg`, `max-w-xl` e `max-w-2xl`, e para `w-md` e `size-lg`.
  - O implementador seguiu a regra do "mesmo nome semântico", então não há violação.
  - Só que quem usar `max-w-md` como contêiner na Tarefa 3 (mobile first) vai ter uma coluna de 12px, sem nenhum erro.
  - Fica a seu critério: no mínimo, um comentário no `@theme` avisando e indicando `max-w-(--container-md)`. Se preferir, registre isso no `architecture.md` / `design-tokens.md`.
- **JSON inválido numa resposta de sucesso escapa sem tratamento.** Em `client.ts:52`, se uma resposta 2xx vier sem JSON (por exemplo, o host do front devolvendo `index.html` por causa de URL ou rota errada), o `response.json()` lança `SyntaxError` cru. Esse erro não é `ApiError` nem `NetworkError`. A falha não é engolida, mas a Tarefa 10 (falha de rede) vai ter que tratar um terceiro tipo de erro. Vale decidir o tratamento antes dela.
- **A fonte Roboto não é carregada.** Em `main.css`, Roboto e Roboto Mono aparecem só no `@theme`. No iOS e no desktop sem a fonte instalada, a página cai em `system-ui`, então o `design-tokens.md` não é cumprido de fato. O `codigo` continua monoespaçado pelo `ui-monospace`, então `0` e `O` seguem distinguíveis. Se a fonte for carregada por pacote (por exemplo `@fontsource`), ele precisa entrar antes na §2 do architecture.
- **Elemento `<main>` duplicado no futuro.** `App.vue` já envolve o `RouterView` em `<main>`. As páginas da Tarefa 3 não devem abrir outro `<main>`, para não duplicar essa marcação de acessibilidade.
- **E2E temporário.** `e2e/vue.spec.ts` depende de `#app main` (marcado com TODO #2). Está aceitável como provisório, desde que a Tarefa 3 o substitua por um teste da grade, como diz o próprio TODO.

## Observações fora do escopo deste diff

- `apps/web/README.md` ainda é o texto padrão do `create-vue` e não explica `api:types` nem as variáveis do front. É candidato a Issue de manutenção, e pode ser resolvido junto com o apontamento 1 se você preferir.

**Arquivos relevantes:**
- /home/santiago/Documentos/dev/faculdade/reserva-de-horarios/apps/web/src/api/client.ts
- /home/santiago/Documentos/dev/faculdade/reserva-de-horarios/apps/web/src/api/client.spec.ts
- /home/santiago/Documentos/dev/faculdade/reserva-de-horarios/apps/web/src/assets/main.css
- /home/santiago/Documentos/dev/faculdade/reserva-de-horarios/apps/web/package.json
- /home/santiago/Documentos/dev/faculdade/reserva-de-horarios/apps/web/env.d.ts
- /home/santiago/Documentos/dev/faculdade/reserva-de-horarios/docs/architecture.md

Não alterei nenhum arquivo do projeto e não gravei este parecer em `specs/002-grade-publica/reviews/`. Quem grava é o fluxo. O arquivo `specs/002-grade-publica/reviews/tarefa-02-conformidade-r1.md`, que não está no Git, já existia e não é meu.
