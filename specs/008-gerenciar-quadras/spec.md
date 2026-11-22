---
issue: 8
status: rascunho   # rascunho | aprovada
---

# US07 — Gerenciar a arena e cadastrar quadras

## O problema

Hoje a arena e as quadras só existem porque o seed as cria na instalação: para abrir
uma quadra nova, trocar o nome de uma, tirar da grade uma que entrou em reforma ou
corrigir o endereço da arena, o dono depende de alguém mexer no banco. Sem cadastro
de quadra não há em que pendurar a agenda (US08) nem onde receber reserva. E, ao
tirar uma quadra da grade, ele não pode deixar na mão quem já pagou por um horário
nela. O funcionário que atende no balcão também precisa saber quais quadras existem e
quais estão fora de uso, mas não pode ser ele quem as altera.

## A história

**Como** administrador, **eu quero** manter os dados da arena e cadastrar suas quadras
**para que** elas possam receber agenda e reservas.

## Critérios de aceite

> **Escopo reduzido (22/11):** esta versão entrega o mínimo de ponta a ponta —
> ver a arena com as suas quadras, cadastrar quadra ligada à arena e renomear
> quadra, pela API e pelo painel (lista e cadastro). Inativar e reativar quadra,
> editar os dados da arena e renomear pelo painel ficam numa Issue própria (ver
> "Fora de escopo").

Definições usadas por todos os critérios abaixo:

- **Papéis, 401 e 403:** os da US06 (#7). Sem token válido, toda rota desta história
  responde `401` "Autenticação necessária."; `OPERATOR` numa rota só de `ADMIN`
  responde `403` "Seu perfil não tem acesso a esta operação.". Os dois são checados
  **antes** da validação do corpo e da existência da quadra: o `OPERATOR` recebe `403`
  mesmo com corpo inválido ou id inexistente.
- **Formato de erro:** toda recusa responde no formato único da API (`statusCode`,
  `error`, `message`, `fields?`, `path`, `timestamp`); `fields` aparece em todo `400`
  de validação, apontando cada campo que falhou.
- **Nome da quadra:** texto obrigatório, guardado sem espaços nas pontas, com **1 a 60
  caracteres** depois de tirar esses espaços (só espaços conta como vazio). Dois nomes
  são **o mesmo nome** quando, sem espaços nas pontas, são iguais sem diferenciar
  maiúsculas de minúsculas. Na arena não existem duas quadras com o mesmo nome —
  contando as inativas.
- **Quadra na resposta administrativa:** só `id`, `name` e `isActive` (o cadastro
  acrescenta `arenaId`, para mostrar a ligação com a arena — CA2); a lista de quadras
  vem ordenada por nome. Nenhuma resposta desta história traz reserva, nome ou telefone
  de cliente, nem dado de pagamento.

### API

- [ ] **CA1 — Dado** um token válido de `ADMIN` ou de `OPERATOR`, **quando** chamo `GET /arena`, **então** recebo `200` com `{ "data": { "id", "name", "address", "courts": [ { "id", "name", "isActive" } ] } }` — a arena única **com todas as suas quadras, ativas e inativas**, lidas junto com ela (relação 1:N), ordenadas por nome, e nada além desses campos. Se a arena não existir (seed não rodou), recebo `404` "arena não encontrada".
- [ ] **CA2 — Dado** um token válido de `ADMIN`, **quando** ele faz `POST /courts` com `{ "name" }` válido, **então** recebe `201` com `{ "data": { "id", "arenaId", "name", "isActive": true } }`, em que `arenaId` é o id da arena única e `name` vem sem os espaços das pontas; a quadra passa a aparecer em `GET /arena`, na rota pública `GET /courts` e na grade, onde `GET /courts/:id/slots` responde `200` sem horários (a quadra ainda não tem agenda — US08). O cliente não informa a arena: enviar `arenaId` (ou `isActive`) no corpo é campo não declarado e responde `400`.
- [ ] **CA3 — Dado** um token válido de `ADMIN`, **quando** ele faz `POST /courts` sem `name`, com `name` vazio, só com espaços, com mais de 60 caracteres, que não é texto, ou com qualquer campo não declarado, **então** recebe `400` com `fields` apontando cada campo que falhou, e nenhuma quadra é gravada.
- [ ] **CA4 — Dado** uma quadra já cadastrada na arena (ativa ou inativa), **quando** o `ADMIN` cadastra outra (`POST /courts`) ou renomeia outra (`PATCH /courts/:id`) com o mesmo nome, pela regra de nome acima, **então** recebe `409` "Já existe uma quadra com este nome." e nada é gravado. Renomear uma quadra para o próprio nome — inclusive só trocando maiúsculas ou espaços — não é conflito: responde `200` pelo CA5.
- [ ] **CA5 — Dado** um token válido de `ADMIN` e uma quadra existente (ativa ou inativa), **quando** ele faz `PATCH /courts/:id` com `{ "name" }` válido, **então** recebe `200` com `{ "data": { "id", "name", "isActive" } }` com o nome novo, e `GET /arena`, `GET /courts` (se ativa) e a grade passam a mostrar o nome novo; `isActive` não muda. Com `name` inválido pela regra do CA3, recebe `400` com `fields` e nada muda; com um id que não existe, `404` "quadra não encontrada"; com um id que não é UUID, `400` apontando o campo.
- [ ] **CA6 — Dado** um token válido de `OPERATOR`, **quando** ele chama `POST /courts` ou `PATCH /courts/:id`, **então** recebe `403` com a mensagem da US06 e nada é gravado — também com corpo inválido ou com id inexistente. Com o mesmo token, `GET /arena` responde `200` pelo CA1.
- [ ] **CA7 — Dado** uma rota desta história (`GET /arena`, `POST /courts`, `PATCH /courts/:id`), **quando** ela é chamada sem token ou com token inválido, **então** responde `401` "Autenticação necessária." e nada é executado. As rotas públicas `GET /courts` e `GET /courts/:id/slots` continuam respondendo sem token e listando só quadras ativas.
- [ ] **CA8 — Dado** a API no ar, **quando** abro `/docs-json`, **então** as três rotas do CA7 aparecem exigindo o esquema Bearer, com os DTOs de entrada e de saída documentados e as respostas `400`, `401`, `403`, `404` e `409` declaradas onde cada uma pode acontecer; `GET /courts` continua sem exigir o esquema.

### Painel (frontend)

- [ ] **CA9 — Dado** um `ADMIN` ou `OPERATOR` logado, **quando** abre o painel, **então** vê o item de menu **Quadras**, que leva a `/admin/quadras`; lá vê o nome e o endereço da arena e a lista das quadras, por nome, cada uma com o rótulo "Ativa" ou "Inativa", lidos de `GET /arena`. Enquanto carrega, vê o estado de carregando; se a chamada falhar por rede ou erro do servidor, vê a mensagem de erro com **Tentar de novo**; sem nenhuma quadra, vê "Nenhuma quadra cadastrada.". Sem token, abrir `/admin/quadras` leva a `/admin/login` (US06).
- [ ] **CA10 — Dado** o `ADMIN` em `/admin/quadras`, **quando** informa um nome válido em **Nova quadra** e toca em **Cadastrar**, **então** vê "Quadra <nome> cadastrada.", a quadra aparece na lista como "Ativa", no lugar certo da ordem, e o campo é limpo. **Quando** a API responde `400` ou `409`, vê a mensagem embaixo do campo de nome e nada entra na lista; **quando** a API não responde, vê "Não foi possível conectar ao servidor." e o nome digitado continua no campo. O botão **Cadastrar** fica desabilitado enquanto o pedido está em andamento. Para o `OPERATOR`, o formulário **Nova quadra** não aparece — esconder o formulário não é o que protege a rota (CA6).

## Fora de escopo

- **Inativar e reativar quadra** (`PATCH /courts/:id/status`, com a recusa quando há
  reserva futura ativa — RN14), **editar os dados da arena** (`PUT /arena`) e
  **renomear pelo painel**: cortados do escopo em 22/11 para caber no prazo da
  Entrega 2; voltam numa Issue própria.
- **Excluir quadra:** a rota `DELETE /courts/:id` não existe. Precisará decidir o que
  fazer com reservas passadas, agenda e bloqueios da quadra.
- Definir a agenda semanal da quadra: US08 (#9). A quadra recém-cadastrada fica sem
  horários na grade até lá.
- Criar ou excluir a arena, ou ter mais de uma arena (RN21).
- Outros campos de quadra (tipo de piso, foto, descrição, capacidade) e reordenar as
  quadras à mão.
- Tirar as quadras de exemplo do seed.
- Atualizar a lista sozinha quando outra pessoa muda uma quadra (polling).

## Abandono no meio

`docs/user-flows.md` não tem jornada do administrador nem do operador; os casos abaixo
saem das perguntas de sempre.

**A pessoa fecha a aba no meio do formulário.** Nada foi enviado, nada foi gravado.
Cada ação desta história é **um único pedido** que muda uma linha só (a quadra); não
existe estado pela metade no servidor. O que estava digitado se perde.

**A sessão expira com a página aberta.** O pedido seguinte recebe `401` e não executa
nada (CA7); o frontend leva ao login pela US06. Ao voltar, a página relê a arena e as
quadras.

**A rede cai no meio do cadastro.** O frontend não sabe se o pedido chegou; o nome
digitado fica no campo (CA10). Se o pedido tiver chegado, tentar de novo dá `409`
(CA4), e não uma quadra duplicada. Renomear de novo grava o mesmo valor.

**Dois toques seguidos em Cadastrar.** O botão fica desabilitado durante o pedido
(CA10); se mesmo assim dois pedidos chegarem, o segundo recebe `409` (CA4).

## Assume que

| Premissa | Issue que fecha |
| --- | --- |
| A US06 (#7) está implementada (PR #24 mesclado): `AuthGuard` global com `@Public()`, `RolesGuard` com `@Roles('ADMIN')`, as mensagens de `401` e `403`, o painel `/admin` com menu por papel, o *navigation guard* das rotas `admin/` e o `src/api/client.ts` anexando o token e tratando o `401`. Não há `// TODO` no código: é pré-condição da Tarefa 1, conferida antes de ela começar. | #7 — US06 |

## Depende de

- **#7 — US06 (entrar no painel):** papéis, guards, painel e cliente HTTP com token.
- **#2 — US01 (grade pública):** a rota `GET /courts/:id/slots` respondendo `404` para
  quadra inativa (CA11 da US01) (PR #23 mesclado).

## Dúvidas em aberto

| # | Dúvida | Quem responde |
| --- | --- | --- |
