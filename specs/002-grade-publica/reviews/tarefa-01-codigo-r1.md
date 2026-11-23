# Parecer de Código: Tarefa 1 (rodada 1)

**Veredito:** APONTAMENTOS (1 bloqueante)

## O que eu verifiquei
1. Li `.agents/agents/revisor-codigo.md` e `docs/architecture.md`, que é o critério fixo.
2. Rodei `git diff 91a9d75b525c0194c55e88aa9fd052f40a42f6da` e li o diff inteiro. No lockfile, conferi só os pacotes que entraram.
3. Rodei as verificações em `apps/api`:
   - `npm test`: 4/4 passaram.
   - `npm run test:e2e`: 4/4 passaram, com o seed real pelo `npx prisma db seed`.
   - `npm run lint`: terminou com código 0, sem avisos.
   - `npm run build`: terminou com código 0.
4. Conferi o que o implementador alegou sobre os arquivos fora da lista do plano:
   - O build gera `dist/src/` e `dist/generated/prisma/`.
   - No JS compilado, os imports do client gerado saem como `.js`, então o `rewriteRelativeImportExtensions` está funcionando.
   - `node dist/src/main` sobe a API até "Nest application successfully started", com ConfigModule e PrismaModule inicializados.
   - Os ajustes têm motivo: o `architecture.md` §2.1 item 11 manda gerar o client em `apps/api/generated/prisma`, fora de `src`, e o seed roda no Node nativo, que exige imports `.ts` (`importFileExtension = "ts"`).
   - Nenhuma outra referência a `dist/main` ficou desatualizada no repo. O `apps/api/README.md` só chama `npm run start:prod`, e o CI não usa esse script.
   - Não entrou dependência nova fora da §2: só `@nestjs/config`, mais `dotenv`, `dotenv-expand` e `es-toolkit`, que vêm junto com ele.

## Apontamentos (bloqueiam)

1. **O seed grava em três tabelas sem transação, e a proteção contra rodar duas vezes olha só a Arena. Uma falha no meio deixa o banco pela metade, e rodar o seed de novo não conserta: ele sai com código 0 dizendo que não há nada a fazer.** `apps/api/prisma/seed.ts:15-47`
   - Regra violada: `architecture.md` §2.1 item 3: "Operação que muda mais de uma tabela (...) roda em `prisma.$transaction`". O mesmo item diz que "A arena única (RN21) e o primeiro administrador nascem no **seed**", ou seja, o seed também roda em produção (Neon).
   - Como o código está:
     - O `arena.create` (linha 20) é uma operação.
     - Cada quadra com a sua agenda é outro `court.create` (linhas 31-47), um por vez, em sequência.
     - Antes disso, a linha 15 faz `if ((await prisma.arena.count()) > 0) { console.log('Seed já aplicado...'); return; }`.
   - Prejuízo concreto:
     - Se a conexão cair depois do `arena.create` e antes das quadras, fica gravada uma Arena sem quadras ou com só parte delas. Isso é plausível com o pooler do Neon ou com o banco hibernado.
     - Rodar o seed de novo cai no `return` da linha 15. O comando termina com sucesso e o erro fica escondido.
     - A grade passa a mostrar "nenhuma quadra disponível" (CA2) sem nenhum sinal de que o seed falhou, e o único conserto é limpar o banco na mão.
   - Uma única criação aninhada a partir da Arena (`arena.create({ data: { courts: { create: [...] } } })`), que o Prisma já executa de forma atômica, ou um `$transaction`, atende à regra. A correção fica com o implementador.

## Sugestões (não bloqueiam)
- **O seed cria o `PrismaClient` com `new` em `apps/api/prisma/seed.ts:10-12`.** O `architecture.md` §2.1 item 1 diz que o `PrismaService` "é o único lugar que instancia o `PrismaClient`".
  - Pelo contexto, a regra vale para o código da aplicação, e o seed é um script de CLI fora do Nest. Não vejo prejuízo concreto além de montar o adapter `PrismaPg` em dois lugares.
  - Vale decidir uma das duas coisas e deixar escrito: registrar no `architecture.md` que o seed é exceção, ou fazer o seed usar o `PrismaService` por `NestFactory.createApplicationContext`.
  - Ler a URL pelo `prisma.config.ts` (linha 3) respeita o item 11, que proíbe `process.env` fora dali. Isso está bom.
- **`apps/api/test/helpers/db.ts:5`:**
  - Usa `$executeRawUnsafe` com uma string fixa. O `$executeRaw` com template literal elimina o risco de alguém interpolar valor ali no futuro.
  - O `RESTART IDENTITY` não faz nada, porque todas as chaves são UUID.
  - A lista de tabelas é mantida à mão e vai precisar crescer junto com o schema. Hoje o `CASCADE` cobre as tabelas que dependem dessas, mas tabelas novas sem chave estrangeira para elas, como `AdminUser`, ficarão de fora sem ninguém perceber.
- **`apps/api/test/seed.e2e-spec.ts:15-17`:** sobe a aplicação HTTP inteira (`createNestApplication().init()`) só para pegar o `PrismaService`. Um `moduleRef.get(PrismaService)` depois de `compile()` basta, porque o teste não faz nenhuma requisição.
- **`apps/api/test/seed.e2e-spec.ts:41-61`:** o teste da agenda passa mesmo sem nenhuma quadra, porque o `for` simplesmente não roda. O teste anterior já protege contra isso, mas um `expect(courts).toHaveLength(3)` dentro deste deixa o teste valendo sozinho.
- **O script de lint (`oxlint --type-aware src/ test/`) não passa pelo `prisma/seed.ts`.** O seed é código que roda em produção. Vale incluir `prisma/` no lint.
- **`apps/api/src/config/env.validation.ts`:** a validação feita à mão serve para uma variável só. Quando entrarem `JWT_SECRET`, `PORT` e as outras do item 11, vale trocar por uma estrutura declarativa (por exemplo, uma classe com `class-validator`, que já está na stack) antes que a função vire uma sequência de `if`.

## Observações fora do escopo deste diff
Candidatas a Issue de manutenção:
- **`apps/api/src/main.ts:6`** usa `process.env.PORT ?? 3000`, o que viola o `architecture.md` §2.1 item 11: "Nenhum `process.env` fora do módulo de configuração e do `prisma.config.ts`". O código é anterior a este diff. Agora que o `ConfigModule` existe, o `PORT` deveria passar por ele. A Tarefa 3 já mexe no `main.ts`, então pode corrigir ali.
- **`apps/api/prisma.config.ts`** (o bloco `datasource`, que este diff não tocou) usa só `DATABASE_URL`. O `architecture.md` §5.3 diz que o `prisma migrate deploy` de produção usa a `DATABASE_URL_UNPOOLED` (conexão direta). Do jeito que está, a migration de produção passaria pelo endpoint `-pooler` do Neon.
- **O `test:e2e` usa o mesmo banco que o desenvolvimento.** O e2e roda contra a mesma `DATABASE_URL` do `apps/api/.env` e, com o `resetDatabase`, apaga os dados locais a cada execução. O §5.3 não prevê um banco separado para teste, então isso não viola a arquitetura, mas vale considerar um banco de teste próprio.

Arquivos relevantes:
- /home/santiago/Documentos/dev/faculdade/reserva-de-horarios/apps/api/prisma/seed.ts
- /home/santiago/Documentos/dev/faculdade/reserva-de-horarios/apps/api/test/helpers/db.ts
- /home/santiago/Documentos/dev/faculdade/reserva-de-horarios/apps/api/test/seed.e2e-spec.ts
- /home/santiago/Documentos/dev/faculdade/reserva-de-horarios/apps/api/src/config/env.validation.ts
- /home/santiago/Documentos/dev/faculdade/reserva-de-horarios/apps/api/src/main.ts
- /home/santiago/Documentos/dev/faculdade/reserva-de-horarios/apps/api/prisma.config.ts
- /home/santiago/Documentos/dev/faculdade/reserva-de-horarios/docs/architecture.md

Não alterei nenhum arquivo do repositório. O `npm run build` regenerou `apps/api/dist/` e o `tsbuildinfo`, que estão no `.gitignore`, e o `test:e2e` limpou e re-semeou o banco local, como o despacho previa.
