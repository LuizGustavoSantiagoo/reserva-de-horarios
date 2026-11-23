# Reserva de Horários em Quadras de Areia

Chega de administrar quadra pelo direct: aqui o cliente vê a grade, escolhe o
horário, paga no Pix e sai com a reserva confirmada — sem ninguém do outro lado
respondendo mensagem. Para donos de arena de areia e para quem quer jogar.

## Autores

- Luiz Gustavo de Oliveira Santiago — [@LuizGustavoSantiagoo](https://github.com/LuizGustavoSantiagoo)

## Protótipo

- Telas navegáveis: <https://deer-quilt-67996631.figma.site/>

## Stack

- **Backend:** NestJS, Prisma e PostgreSQL
- **Frontend:** Vue e Tailwind CSS
- **Pagamento:** AbacatePay (Pix, ambiente de testes)

## Em produção

⏳ A partir da Entrega 3.

## Quick Start

Pré-requisitos: **Node 22**, **npm 11** (`npm install -g npm@11`) e **Docker**.

```bash
# 1. Clonar
git clone https://github.com/LuizGustavoSantiagoo/reserva-de-horarios.git
cd reserva-de-horarios

# 2. Variáveis de ambiente (os .env nunca vão para o Git)
cp .env.example .env                                # banco do Docker
cp apps/api/.env.example apps/api/.env              # API
cp apps/web/.env.example apps/web/.env.development  # web
```

Antes de seguir, edite os dois primeiros:

- **`.env`**: troque `POSTGRES_PASSWORD`.
- **`apps/api/.env`**: use a mesma senha no `DATABASE_URL` e no
  `DATABASE_URL_UNPOOLED`; gere o `JWT_SECRET` com `openssl rand -hex 32`; defina
  `ADMIN_EMAIL` e `ADMIN_PASSWORD` (8 caracteres ou mais) — é o administrador
  que o seed cria.

```bash
# 3. Banco
npm run db:up

# 4. API: dependências, client do Prisma, tabelas e dados de exemplo
cd apps/api
npm ci
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
cd ../..

# 5. Web
npm --prefix apps/web ci

# 6. Subir API (porta 3000) e web (porta 5173)
npm start
```

| O quê | Onde |
| --- | --- |
| Grade pública | <http://localhost:5173> |
| Painel (login) | <http://localhost:5173/admin/login> — `ADMIN_EMAIL` e `ADMIN_PASSWORD` do `apps/api/.env` |
| Swagger | <http://localhost:3000/docs> — **Authorize** com o `accessToken` de `POST /auth/login` |

### Testes

```bash
npm test                              # unitários da API e do web
npm --prefix apps/api run test:e2e    # e2e da API (usa o banco do apps/api/.env)
npm --prefix apps/web run test:e2e    # Playwright (rode `npx playwright install chromium` antes)
```

Os e2e da API limpam as tabelas. Para voltar aos dados de exemplo, em `apps/api`:

```bash
npx prisma migrate reset --force   # apaga e recria as tabelas
npx prisma db seed                 # arena, quadras, agenda e o administrador
```

## Documentação do projeto

| Documento | O que responde |
| --- | --- |
| [`docs/prd.md`](docs/prd.md) | O que o produto faz: stories, critérios de aceite e regras de negócio |
| [`docs/user-flows.md`](docs/user-flows.md) | O que a pessoa vive na tela — e o que o sistema faz quando ela desiste no meio |
| [`docs/design-tokens.md`](docs/design-tokens.md) | Paleta, espaçamento, tipografia e estados de botão |
| [`docs/architecture.md`](docs/architecture.md) | Onde as coisas moram: stack, estrutura e contratos |

Este repositório segue o método **UTF-SDD** (SDD por portões) da disciplina de
Tópicos Especiais da UTFPR. O método está descrito em
[`docs/guia-sdd.md`](docs/guia-sdd.md) e [`docs/tutorial-sdd.md`](docs/tutorial-sdd.md).
