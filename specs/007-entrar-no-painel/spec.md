---
issue: 7
status: rascunho   # rascunho | aprovada
---

# US06 — Entrar no painel como administrador ou operador

## O problema

Tudo o que o administrador faz no sistema (editar a arena, montar a agenda, ver nome e
telefone de quem reservou, cancelar reserva) mexe com dado de cliente e com dinheiro.
Hoje não há porta: qualquer pessoa que descobrir o endereço de uma rota administrativa
pode chamá-la. A arena também tem funcionários que atendem no dia a dia e que vão
precisar entrar no painel sem ganhar o poder do dono. Sem saber quem está do outro lado,
e o que cada um pode fazer, nenhuma das histórias do painel (US07 a US11) pode existir.

## A história

**Como** administrador ou operador, **eu quero** entrar no painel com e-mail e senha
**para que** só quem trabalha na arena chegue ao painel, e cada um alcance só o que o
seu papel permite.

## Critérios de aceite

Definições usadas por todos os critérios abaixo:

- **Papéis:** `ADMIN` (rótulo na tela: "Administrador") e `OPERATOR` (rótulo na tela:
  "Operador"). O e-mail é guardado e comparado sem espaços nas pontas e em minúsculas
  (`" Ana@Arena.com "` e `"ana@arena.com"` são a mesma conta).
- **Rota protegida:** toda rota da API que não está marcada como pública. São públicas
  só as que já existem (`GET /`, `GET /courts`, `GET /courts/:courtId/slots`) e o
  login (`POST /auth/login`).
- **Token válido:** JWT assinado com o segredo `JWT_SECRET`, dentro da validade, cujo
  conteúdo tem apenas `sub` (id do usuário), `role`, `iat` e `exp`.
- **Formato de erro:** toda recusa abaixo responde no formato único da API
  (`statusCode`, `error`, `message`, `fields?`, `path`, `timestamp`), e nenhuma
  resposta de sucesso ou de erro contém a senha ou o hash dela.

### API

- [ ] **CA1 — Dado** `ADMIN_EMAIL` e `ADMIN_PASSWORD` definidos no ambiente, **quando** o seed roda, **então** existe um usuário `ADMIN` com esse e-mail, e o banco guarda só o hash `argon2` da senha (a senha em claro não aparece em nenhuma coluna); rodar o seed de novo — inclusive num banco em que a arena já existia — não cria um segundo usuário nem troca a senha do existente. Sem uma das duas variáveis, ou com `ADMIN_PASSWORD` de menos de 8 caracteres, o seed falha com uma mensagem que nomeia a variável e não cria o usuário. E-mail e senha do administrador não aparecem em nenhum arquivo do repositório; o `.env.example` traz só os nomes `JWT_SECRET`, `JWT_EXPIRES_IN`, `ADMIN_EMAIL` e `ADMIN_PASSWORD`, com valores fictícios, e a API não sobe sem `JWT_SECRET`.
- [ ] **CA2 — Dado** um usuário cadastrado (`ADMIN` ou `OPERATOR`), **quando** ele faz `POST /auth/login` com o e-mail e a senha certos, **então** recebe `200` com `{ "data": { "accessToken": "<jwt>" } }`; o token é assinado com `JWT_SECRET`, traz `sub` com o id do usuário e `role` com o papel dele, e expira **8 horas** depois de emitido (`exp − iat = 28800`); o conteúdo do token não tem senha, hash, telefone nem nenhum outro campo além de `sub`, `role`, `iat` e `exp`.
- [ ] **CA3 — Dado** um e-mail cadastrado com a senha errada, ou um e-mail que não existe, **quando** faço `POST /auth/login`, **então** as duas respostas são `401` com a mesma mensagem "E-mail ou senha inválidos." (os corpos só diferem em `timestamp`) e nenhum token é emitido. **Dado** um e-mail mal formado ou uma senha vazia, **quando** envio o login, **então** recebo `400` com `fields` apontando o campo.
- [ ] **CA4 — Dado** que uma mesma origem (endereço IP) já fez 5 tentativas de login nos últimos 10 minutos, certas ou erradas, **quando** ela tenta a 6ª, **então** recebe `429` com a mensagem "Muitas tentativas de login. Tente de novo em alguns minutos.", mesmo com a senha certa, e nenhum token é emitido; passados os 10 minutos, ela volta a poder tentar. O limite vale só para a rota de login.
- [ ] **CA5 — Dado** uma rota protegida (ex.: `GET /users/me`), **quando** ela é chamada sem o cabeçalho `Authorization`, com um valor que não é `Bearer <token>`, com um token assinado com outro segredo, com um token adulterado (ex.: o `role` de um token de `OPERATOR` trocado para `ADMIN`, mantendo a assinatura original) ou com um token expirado, **então** responde `401` "Autenticação necessária." — a mesma mensagem nos cinco casos — e nada é executado. **Dado** uma rota pública, **quando** ela é chamada sem token ou com qualquer um desses tokens inválidos, **então** responde normalmente, como antes desta história.
- [ ] **CA6 — Dado** um token válido de `ADMIN` ou de `OPERATOR`, **quando** chamo `GET /users/me`, **então** recebo `200` com `{ "data": { "id", "email", "role" } }` do dono do token, e nada além desses três campos.
- [ ] **CA7 — Dado** um token válido de `ADMIN`, **quando** ele faz `POST /users` com `{ "email", "password" }` válidos, **então** recebe `201` com `{ "data": { "id", "email", "role": "OPERATOR" } }` — sem `password` nem `passwordHash` —, o banco guarda só o hash `argon2` da senha, e o novo operador consegue entrar pelo CA2. O cadastro cria sempre um `OPERATOR`.
- [ ] **CA8 — Dado** um token válido de `ADMIN`, **quando** ele faz `POST /users` com e-mail mal formado, senha com menos de 8 caracteres, campo faltando ou campo não declarado (ex.: `"role": "ADMIN"`), **então** recebe `400` com `fields` apontando cada campo que falhou, e nenhum usuário é gravado. **Quando** o e-mail já pertence a outro usuário (mesmo com maiúsculas ou espaços diferentes, pela regra de e-mail acima), **então** recebe `409` e nenhum usuário é gravado.
- [ ] **CA9 — Dado** um token válido de `ADMIN`, **quando** ele chama `GET /users`, **então** recebe `200` com a lista de todos os usuários, ordenada por e-mail, cada um só com `id`, `email` e `role`.
- [ ] **CA10 — Dado** um token válido de `OPERATOR`, **quando** ele chama uma rota só de `ADMIN` (`POST /users` ou `GET /users`), **então** recebe `403` "Seu perfil não tem acesso a esta operação." e nada é gravado nem listado — a resposta não contém dado de nenhum usuário.
- [ ] **CA11 — Dado** um token válido, **quando** chamo `GET /users/:id`, **então**: se sou `ADMIN`, recebo `200` com `id`, `email` e `role` de qualquer usuário, e `404` "usuário não encontrado" para um id que não existe; se sou `OPERATOR` e o id é o meu, recebo `200` com os meus dados; se sou `OPERATOR` e o id é de outra pessoa — exista ela ou não —, recebo `403` com a mensagem do CA10, sem revelar se aquele id existe. Um id que não é UUID responde `400` apontando o campo, para os dois papéis.
- [ ] **CA12 — Dado** a API no ar, **quando** abro `/docs-json`, **então** o documento declara o esquema de segurança Bearer, as rotas protegidas (`/users`, `/users/me`, `/users/:id`) exigem esse esquema e as públicas (incluindo `/auth/login`) não; em `/docs`, colar um token no botão **Authorize** permite chamar as rotas protegidas pela própria UI.

### Painel (frontend)

- [ ] **CA13 — Dado** a tela `/admin/login`, **quando** informo e-mail e senha certos e toco em **Entrar**, **então** o token é guardado no `sessionStorage` e sou levado ao painel (`/admin`); recarregar a página mantém a sessão; fechar a aba e abrir o painel de novo exige entrar outra vez. **Quando** a API recusa (`401`, `400` ou `429`), **então** continuo no login vendo a mensagem que a API devolveu, sem token guardado; **quando** a API não responde, vejo "Não foi possível conectar ao servidor." O botão **Entrar** fica desabilitado enquanto o pedido está em andamento.
- [ ] **CA14 — Dado** um token guardado, **quando** qualquer chamada à API sai do frontend, **então** ela leva o cabeçalho `Authorization: Bearer <token>`, anexado num único lugar (`src/api/client.ts`) — nenhuma tela, componente ou service monta esse cabeçalho; sem token guardado, o cabeçalho não é enviado. **Quando** uma chamada que não é o login recebe `401` (token expirado ou inválido), **então** o token é apagado e sou levado a `/admin/login` com o aviso "Sua sessão terminou. Entre de novo."
- [ ] **CA15 — Dado** que entrei, **quando** o painel abre, **então** ele mostra o e-mail de quem está logado e o papel com o rótulo em português ("Administrador" ou "Operador"), lidos de `GET /users/me`; o item de menu **Cadastrar operador** aparece só para o `ADMIN`; o botão **Sair** apaga o token (do `sessionStorage` e da memória) e leva a `/admin/login`, e voltar com o botão do navegador não reabre o painel. Se `GET /users/me` falhar por rede ou erro do servidor, o painel mostra a mensagem de erro com **Tentar de novo**, sem apagar a sessão.
- [ ] **CA16 — Dado** que não há token guardado, **quando** abro qualquer endereço do painel (`/admin` ou `/admin/operadores/novo`), **então** sou levado a `/admin/login` sem ver o painel. **Dado** um `OPERATOR` logado, **quando** ele abre `/admin/operadores/novo` direto pela barra de endereço, **então** é levado a `/admin`; e, se a chamada de cadastro chegar à API mesmo assim, ela é recusada com `403` pelo CA10 — esconder o botão não é o que protege a rota. A grade pública (`/`) continua abrindo sem login, com ou sem token guardado.
- [ ] **CA17 — Dado** o `ADMIN` na tela **Cadastrar operador**, **quando** informa e-mail e senha válidos e envia, **então** vê "Operador <e-mail> cadastrado." e o formulário é limpo; **quando** a API responde `400`, vê a mensagem embaixo de cada campo que falhou; **quando** responde `409`, vê "Já existe uma conta com este e-mail." embaixo do campo de e-mail; em nenhum caso a senha digitada aparece na tela depois do envio.

## Fora de escopo

- O que o Operador faz de útil no painel (ver a agenda do dia) — chega com a US09 (#10). Nesta história ele só entra, vê o próprio perfil e é recusado nas rotas de `ADMIN`.
- Proteger as rotas administrativas das próximas histórias (arena, quadras, agenda, bloqueio, cancelamento): cada uma recebe o `@Roles('ADMIN')` na própria história (US07 #8 a US11 #12). Aqui só nasce o mecanismo e as rotas de usuário.
- Cadastrar outro `ADMIN` pelo painel: o único administrador nasce no seed, e o cadastro cria só Operador.
- Editar, desativar ou remover usuário, e trocar o papel de um usuário.
- Recuperar ou trocar senha ("esqueci minha senha"), e política de senha além do mínimo de 8 caracteres.
- Refresh token e renovação automática da sessão: passadas as 8 horas, entra de novo.
- Logout no servidor e lista negra de tokens: **Sair** só apaga o token do navegador; um token copiado antes continua válido até expirar.
- Invalidar o token de um usuário que deixou de existir ou mudou de papel (não há remoção nem troca de papel nesta história).
- Bloquear a conta depois de várias senhas erradas: o limite do CA4 é por origem, não por conta.
- Limite de tentativas nas outras rotas citadas pela `architecture.md` §2.1, item 7 (cancelamento por código, conferência de pagamento): entram com a US05 (#6) e a US03 (#4).
- Identificar a origem verdadeira atrás do proxy da hospedagem (`trust proxy`) para o limite do CA4: entra com o deploy.
- Igualar o tempo de resposta do login entre e-mail existente e inexistente: o CA3 iguala a resposta, não o tempo.
- Decodificar o token no frontend para prever a expiração: o frontend descobre que o token venceu pelo `401` da API (CA14).
- Lembrar o login entre abas ou depois de fechar o navegador ("manter conectado").
- Os itens de menu das próximas histórias do painel (arena e quadras, agenda, agenda do dia, bloqueios).
- Autenticação em dois fatores, login por rede social, conta de cliente (o cliente continua sem conta — PRD §6).

## Abandono no meio

`docs/user-flows.md` não tem jornada do administrador nem do operador; os casos abaixo
saem das perguntas de sempre.

**A sessão expira no meio do uso.** O token vale 8 horas — um turno de trabalho. Quando
ele vence com o painel aberto, a próxima chamada recebe `401`, o frontend apaga o token
e leva ao login com o aviso de sessão encerrada (CA14). Nada fica pela metade no
servidor, porque a chamada recusada não executou nada (CA5). O que estava digitado num
formulário naquele instante se perde; como o único formulário desta história tem dois
campos, foi aceito não guardar rascunho.

**A pessoa fecha a aba.** O token mora no `sessionStorage`, que some com a aba: abrir o
painel de novo exige entrar (CA13, CA16). Foi escolhido assim, e não o `localStorage`,
porque o painel pode ser aberto num computador da recepção, e uma aba fechada não deve
deixar a porta aberta para o próximo. Recarregar a página na mesma aba não derruba a
sessão (CA13).

**A pessoa sai, mas alguém copiou o token antes.** **Sair** apaga o token do navegador
(CA15), e o token continua válido no servidor até expirar — não há lista negra (ver
"Fora de escopo"). É por isso que a validade é curta e que o token não carrega nenhum
dado sigiloso (CA2): quem o tiver alcança só o que o papel dele alcança, por no máximo
8 horas.

**A rede cai.** No login, aparece a mensagem de falha de conexão e nada é guardado
(CA13). Com o painel aberto, a falha ao buscar o perfil mostra o erro com **Tentar de
novo**, sem apagar a sessão (CA15): queda de rede não é sessão vencida, e derrubar a
pessoa para o login por isso a faria entrar de novo — gastando tentativas do CA4 — à
toa.

**Alguém tenta adivinhar a senha.** A 6ª tentativa em 10 minutos da mesma origem é
recusada com `429` (CA4), e a mensagem de erro nunca diz se o e-mail existe (CA3).

## Assume que

| Premissa | Issue que fecha |
| --- | --- |
| O painel do Operador mostra só o perfil dele: a agenda do dia, que é o trabalho de verdade do Operador, ainda não existe (`// TODO #10` no menu do painel). | #10 — US09 |

## Dúvidas em aberto

| # | Dúvida | Quem responde |
| --- | --- | --- |
