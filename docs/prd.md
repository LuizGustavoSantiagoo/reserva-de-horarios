# 📄 Product Requirements Document (PRD)

**Projeto:** Reserva de Horários em Quadras de Areia
**Versão:** 1.1.0
**Última atualização:** 2026-09-24

> 🤖 **Este documento é a fonte da verdade sobre o QUE o produto faz.** Regra de
> negócio que não estiver aqui não existe — nem para a equipe, nem para a IA.
> Tecnologia **não** se discute aqui: isso é assunto do `architecture.md`.

---

## 🎯 1. Visão Geral e Objetivo

**O problema:** Hoje o dono de quadra de areia administra as reservas na mão, pelas
redes sociais. Cada horário vendido custa uma conversa: alguém chama no direct,
pergunta o que está livre, ele confere a agenda, responde, combina o Pix, espera o
comprovante e anota. É tempo preso no celular — e, mesmo assim, o horário pode
acabar prometido a duas pessoas ou ficar preso por alguém que nunca pagou.

**A solução:** Uma plataforma onde o administrador cadastra as arenas, as quadras e a
agenda semanal, e o cliente reserva sozinho: abre a grade, vê o que está livre,
escolhe o horário, informa nome e telefone, paga por Pix e sai com a reserva
confirmada. **O pagamento é o que confirma** — enquanto não é pago, o horário não é
de ninguém.

**Como saberemos que deu certo:**

1. Dois clientes tentam o mesmo horário da mesma quadra e **só um consegue** — não
   existe reserva duplicada.
2. Uma reserva cujo Pix venceu sem pagamento **cai sozinha** e o horário volta a ficar
   disponível na grade, sem ninguém precisar limpar nada na mão.
3. O administrador abre a agenda do dia e **vê os horários ocupados e pagos**, sem
   conferir print de comprovante.
4. Uma reserva vai do início ao fim **sem ninguém responder nada** no WhatsApp ou
   no Instagram.

---

## 📖 2. Glossário Ubíquo

| Termo | Significa | Não confundir com |
| :---- | :-------- | :---------------- |
| **Arena** | O local onde ficam as quadras de areia. Tem nome e endereço. | **Quadra** — a arena é o endereço; a quadra é cada espaço de jogo dentro dele. |
| **Quadra** | Uma quadra de areia dentro de uma arena. É dela que se reserva horário. | **Arena** — uma arena tem várias quadras. |
| **Horário** | Uma faixa de tempo de uma quadra específica em um dia (ex.: quadra 2, sábado, 19h–20h). É o que o cliente compra. | **Reserva** — o horário existe mesmo que ninguém compre; a reserva é alguém tendo comprado ele. |
| **Agenda** | Os horários da semana que o administrador deixa sempre livres para reserva (ex.: seg a sex, 8h–22h, de hora em hora), com o preço de cada faixa. É a regra que gera os horários. | **Horário** — a agenda é a regra que se repete toda semana; o horário é o pedaço de tempo de um dia concreto. |
| **Reserva** | O direito de usar um horário, conquistado por quem pagou. | **Reserva pendente** — enquanto não pagou, o horário está só segurado e cai sozinho no prazo. |
| **Pré-reserva** | O horário segurado enquanto alguém está na tela de reserva preenchendo os dados. Dura 3 minutos e cai sozinha se a pessoa desistir. | **Reserva pendente** — a pré-reserva ainda não tem nome, telefone nem Pix; é só o horário travado para quem chegou primeiro. |
| **Reserva pendente** | Reserva criada e aguardando a confirmação do Pix. Segura o horário enquanto a cobrança estiver válida, mas não dá direito a nada. | **Reserva** (confirmada) — só o pagamento confirmado transforma uma na outra. |
| **Cliente** | Quem quer jogar e reserva o horário. Não tem conta: identifica-se com nome e telefone. Decide o que vai jogar na hora — o sistema não pergunta. | **Administrador** — o cliente compra; o administrador opera. |
| **Administrador** | Quem opera o sistema: cadastra arenas e quadras, define a agenda e vê as reservas. Entra com login e senha. | **Cliente** — ver acima. |
| **Pagamento** | O Pix que confirma a reserva. Sem ele, a reserva não vale. | **Reserva** — a reserva é o direito; o pagamento é a prova de que o dinheiro entrou. |
| **Pagamento em revisão** | O que sobra quando o dinheiro entra depois de a reserva já ter expirado: o pagamento existe, a reserva não vale mais, e só o administrador decide o destino. Enquanto está em revisão, o horário **não é oferecido a mais ninguém**. | **Reserva pendente** — a pendente espera o dinheiro; esta já recebeu o dinheiro e espera uma pessoa decidir. |
| **Código de cancelamento** | O código imprevisível mostrado ao cliente quando o pagamento é confirmado. Sozinho, é o que permite cancelar aquela reserva. | **Senha** — não identifica ninguém e não dá acesso a painel: quem tem o código cancela, e só aquela reserva. |
| **Bloqueio** | Marcação do administrador que tira um horário da grade (manutenção, evento, jogo pago na hora). | **Reserva** — bloqueio não tem cliente nem pagamento. |

---

## 👤 3. Atores e Permissões

> ⚠️ A coluna **"Não pode"** vira Guard e controle de role na API.

| Ator | Quem é | Pode | Não pode |
| :--- | :----- | :--- | :------- |
| **Cliente** | Qualquer pessoa, **sem conta**. Identifica-se com nome e telefone na hora de reservar. | Ver arenas, quadras e a grade de horários; reservar um horário livre; pagar por Pix; ver o próprio código de cancelamento; cancelar a própria reserva apresentando o código. | Cadastrar arena, quadra ou agenda; bloquear horário; ver telefone ou dados de pagamento de outros clientes; cancelar ou alterar reserva de outra pessoa. |
| **Administrador** | Quem opera o sistema. Entra com **login e senha**. | Cadastrar e editar arenas, quadras e a agenda; ver todas as reservas com nome, telefone e situação do pagamento; bloquear e desbloquear horário; cancelar qualquer reserva. | Alterar o valor de um pagamento já confirmado; apagar o histórico de pagamentos (é a prova de que o dinheiro entrou). |

> 🔐 Como o cliente não tem conta, **toda a autenticação (JWT) e o controle por role
> vivem do lado do administrador**: a grade e a reserva são públicas; tudo que
> administra exige token válido.

---

## 📝 4. Escopo Funcional (User Stories)

> Toda story nasce `⚪ Draft` — **só o aluno promove a `🟡 Ready`**; `🟢 Live` é
> quando o PR da história mescla.

### US01 — Ver a grade pública de horários · `Must Have` · `S` · Status: `🟡 Ready`

**Como** cliente, **eu quero** ver os horários de uma quadra em um dia **para que**
eu saiba o que está livre sem perguntar para ninguém.

**Critérios de aceite:**

- [ ] **Dado** uma quadra com agenda definida para o dia, **quando** eu abro a grade dessa quadra, **então** vejo cada horário do dia com sua situação: livre, reservado ou bloqueado.
- [ ] **Dado** um horário reservado, **quando** eu olho a grade, **então** vejo apenas o **primeiro nome** de quem reservou, e nunca o telefone.
- [ ] **Dado** uma quadra sem agenda naquele dia, **quando** eu abro a grade, **então** vejo uma mensagem dizendo que não há horários nesse dia, e não uma tela em branco.
- [ ] **Dado** um horário cujo início já passou, **quando** eu vejo a grade, **então** ele aparece como indisponível e não oferece reserva.
- [ ] **Dado** um horário que outra pessoa está reservando agora, **quando** eu vejo a grade, **então** ele aparece como **em reserva** e não me deixa abrir a tela.

**Regras relacionadas:** RN06, RN08, RN09, RN16

---

### US02 — Reservar um horário e gerar o Pix · `Must Have` · `M` · Status: `🟡 Ready`

**Como** cliente, **eu quero** escolher um horário livre e pagar por Pix **para que**
o horário fique guardado no meu nome sem depender de conversa.

**Critérios de aceite:**

- [ ] **Dado** um horário livre, **quando** eu abro a tela de reserva dele, **então** o horário fica **pré-reservado para mim por 3 minutos** e sai da grade como disponível.
- [ ] **Dado** um horário pré-reservado por outra pessoa, **quando** eu tento abrir a tela dele, **então** sou impedido e avisado de que alguém está reservando agora e que o horário pode voltar em instantes.
- [ ] **Dado** que abri a tela e **não** concluí em 3 minutos, **quando** o prazo termina, **então** a pré-reserva é cancelada, **sou levado de volta à grade de horários** e o horário aparece livre de novo, disponível para qualquer pessoa — inclusive para eu tentar outra vez.
- [ ] **Dado** o horário pré-reservado para mim, **quando** informo nome e telefone e confirmo, **então** o sistema cria uma **reserva pendente**, mantém o horário segurado e me apresenta o Pix a pagar, com o valor definido na agenda.
- [ ] **Dado** um horário que outra pessoa acabou de reservar, **quando** eu confirmo, **então** sou recusado com a explicação de que o horário não está mais livre, **e nenhuma cobrança é gerada**.
- [ ] **Dado** nome ou telefone em branco ou inválido, **quando** envio, **então** recebo o erro indicando o campo e nenhuma reserva é criada.
- [ ] **Dado** um horário bloqueado ou já iniciado, **quando** tento reservar, **então** sou recusado.

**Regras relacionadas:** RN01, RN05, RN08, RN09, RN10, RN16, RN17

---

### US03 — Confirmar a reserva pelo aviso de pagamento · `Must Have` · `M` · Status: `🟡 Ready`

**Como** cliente, **eu quero** que minha reserva seja confirmada assim que o Pix cair
**para que** eu não precise mandar comprovante para ninguém.

**Critérios de aceite:**

- [ ] **Dado** uma reserva pendente com Pix gerado, **quando** chega o aviso de **pagamento aprovado**, **então** a reserva passa a **confirmada**, o pagamento fica registrado e a grade pública passa a mostrar o horário como reservado com o meu primeiro nome.
- [ ] **Dado** que meu pagamento foi confirmado, **quando** vejo a tela de confirmação, **então** ela me mostra o **código de cancelamento** da reserva.
- [ ] **Dado** um aviso com assinatura inválida ou segredo errado, **quando** ele chega, **então** é recusado e **nada muda** no estado da reserva.
- [ ] **Dado** o mesmo aviso chegando duas vezes, **quando** ele é processado, **então** a reserva continua confirmada uma única vez, sem pagamento duplicado.

**Regras relacionadas:** RN02, RN03, RN07, RN11, RN20

---

### US04 — Liberar o horário quando o Pix vence · `Must Have` · `S` · Status: `🟡 Ready`

**Como** administrador, **eu quero** que a reserva com Pix vencido caia sozinha **para
que** o horário não fique preso por quem desistiu.

**Critérios de aceite:**

- [ ] **Dado** uma reserva pendente, **quando** a validade da cobrança termina sem pagamento, **então** ela é marcada como expirada e o horário volta a aparecer livre na grade — sem depender de ninguém abrir tela alguma.
- [ ] **Dado** uma reserva já confirmada, **quando** a validade daquela cobrança termina, **então** nada acontece — reserva paga não cai.
- [ ] **Dado** que a expiração é tentada duas vezes na mesma reserva, **quando** é processada, **então** ela continua expirada uma única vez e o horário não é liberado duas vezes.
- [ ] **Dado** uma reserva expirada cujo horário **ainda está livre**, **quando** o pagamento dela é detectado, **então** o horário é **retido na hora** e deixa de ser oferecido na grade, a reserva passa a *pagamento em revisão* e a pendência aparece no painel — mas ela **não** é confirmada automaticamente.
- [ ] **Dado** uma reserva expirada cujo horário **já foi reservado por outra pessoa**, **quando** o pagamento dela é detectado, **então** nada é retido, a reserva de quem chegou antes continua valendo, e o pagamento aparece no painel como pendência para tratamento humano.

**Regras relacionadas:** RN01, RN03, RN17, RN18, RN20

---

### US05 — Cancelar a própria reserva · `Must Have` · `S` · Status: `🟡 Ready`

**Como** cliente, **eu quero** cancelar minha reserva com o código que recebi **para
que** eu libere o horário quando não puder ir.

**Critérios de aceite:**

- [ ] **Dado** uma reserva confirmada, **quando** informo o código de cancelamento, **então** a reserva é cancelada e o horário volta a ficar livre na grade.
- [ ] **Dado** que estou cancelando, **quando** confirmo, **então** a tela me avisa que **o valor pago não é devolvido**.
- [ ] **Dado** um código inexistente ou já usado, **quando** envio, **então** recebo uma recusa genérica, **sem** que nenhum dado de reserva seja revelado.
- [ ] **Dado** que errei o código várias vezes seguidas, **quando** passo do limite de tentativas, **então** sou bloqueado temporariamente de tentar de novo.
- [ ] **Dado** que o horário já começou, **quando** tento cancelar, **então** sou recusado.

**Regras relacionadas:** RN04, RN07, RN12, RN19

---

### US06 — Entrar no painel como administrador · `Must Have` · `S` · Status: `🟡 Ready`

**Como** administrador, **eu quero** entrar com login e senha **para que** só eu veja
os dados dos clientes e opere as arenas.

**Critérios de aceite:**

- [ ] **Dado** credenciais válidas, **quando** faço login, **então** recebo acesso ao painel.
- [ ] **Dado** senha errada, **quando** tento entrar, **então** recebo um erro genérico, sem dizer se o usuário existe.
- [ ] **Dado** uma rota administrativa, **quando** ela é acessada sem autenticação válida, **então** o acesso é negado.

**Regras relacionadas:** RN13

---

### US07 — Cadastrar arenas e quadras · `Must Have` · `M` · Status: `🟡 Ready`

**Como** administrador, **eu quero** cadastrar arenas e suas quadras **para que**
elas possam receber agenda e reservas.

**Critérios de aceite:**

- [ ] **Dado** que estou autenticado, **quando** cadastro uma arena com nome e endereço, **então** ela passa a existir e pode receber quadras.
- [ ] **Dado** uma arena existente, **quando** cadastro uma quadra com nome, **então** ela fica disponível para receber agenda.
- [ ] **Dado** campos obrigatórios vazios, **quando** envio, **então** recebo o erro por campo e nada é criado.
- [ ] **Dado** uma quadra com reservas futuras ativas, **quando** tento excluí-la, **então** sou impedido e orientado a cancelar as reservas antes.
- [ ] **Dado** que não estou autenticado, **quando** tento cadastrar, **então** sou recusado.

**Regras relacionadas:** RN13, RN14

---

### US08 — Definir a agenda semanal da quadra · `Must Have` · `M` · Status: `🟡 Ready`

**Como** administrador, **eu quero** definir os dias e horas que a quadra fica aberta
e o preço de cada faixa **para que** a grade se gere sozinha toda semana.

**Critérios de aceite:**

- [ ] **Dado** uma quadra, **quando** defino dias da semana, faixa de horas, duração do horário e preço, **então** a grade dessa quadra passa a oferecer horários livres nesses períodos.
- [ ] **Dado** faixas diferentes, **quando** defino preços diferentes, **então** cada faixa carrega o próprio valor (sábado 19h pode custar mais que terça 14h).
- [ ] **Dado** que existem reservas confirmadas em horários afetados, **quando** altero a agenda, **então** essas reservas são preservadas e a mudança vale apenas para horários ainda não reservados.
- [ ] **Dado** uma faixa inválida (hora final antes da inicial, ou duração que não cabe na faixa), **quando** salvo, **então** recebo erro e nada é gravado.

**Regras relacionadas:** RN10, RN13, RN15

---

### US09 — Ver a agenda do dia · `Must Have` · `M` · Status: `🟡 Ready`

**Como** administrador, **eu quero** ver as reservas do dia com nome, telefone e
situação do pagamento **para que** eu receba quem chega sem conferir comprovante.

**Critérios de aceite:**

- [ ] **Dado** que estou autenticado, **quando** abro a agenda de um dia, **então** vejo cada horário com a situação (livre, pendente, confirmado, bloqueado), o nome completo, o telefone e a situação do pagamento.
- [ ] **Dado** um horário com **pagamento em revisão**, **quando** abro a agenda do dia, **então** ele aparece destacado como pendência minha, e não como horário livre.
- [ ] **Dado** um dia sem nenhuma reserva, **quando** o abro, **então** vejo uma mensagem clara de dia vazio.
- [ ] **Dado** que não estou autenticado, **quando** tento abrir, **então** sou recusado — **telefone nunca aparece em rota pública**.

**Regras relacionadas:** RN06, RN13, RN18

---

### US10 — Bloquear um horário · `Should Have` · `S` · Status: `🟡 Ready`

**Como** administrador, **eu quero** bloquear um horário **para que** manutenção,
evento ou jogo pago na hora não sejam vendidos pelo sistema.

**Critérios de aceite:**

- [ ] **Dado** um horário livre, **quando** eu o bloqueio informando o motivo, **então** ele deixa de ser reservável e aparece como bloqueado na grade.
- [ ] **Dado** um horário com reserva confirmada, **quando** tento bloqueá-lo, **então** sou impedido e orientado a cancelar a reserva antes.
- [ ] **Dado** um horário bloqueado, **quando** eu o desbloqueio, **então** ele volta a ficar livre na grade.

**Regras relacionadas:** RN08, RN13

---

### US11 — Cancelar qualquer reserva pelo painel · `Should Have` · `S` · Status: `🟡 Ready`

**Como** administrador, **eu quero** cancelar uma reserva **para que** eu resolva o
imprevisto de quem pediu cancelamento por fora.

**Critérios de aceite:**

- [ ] **Dado** uma reserva confirmada, **quando** eu a cancelo informando o motivo, **então** o horário volta a ficar livre e o cancelamento fica registrado com autor e motivo.
- [ ] **Dado** uma reserva já cancelada ou expirada, **quando** tento cancelá-la, **então** sou impedido.
- [ ] **Dado** que não estou autenticado, **quando** tento cancelar, **então** sou recusado.

**Regras relacionadas:** RN04, RN13

---

### US12 — Resolver um pagamento fora do prazo · `Should Have` · `S` · Status: `🟡 Ready`

**Como** administrador, **eu quero** decidir o que fazer com um pagamento que chegou
depois de a reserva expirar **para que** o horário não seja vendido duas vezes nem
fique preso para sempre.

**Critérios de aceite:**

- [ ] **Dado** um pagamento em revisão, **quando** abro o painel, **então** vejo a pendência com quadra, horário, nome, telefone, valor e quando o pagamento chegou.
- [ ] **Dado** um pagamento em revisão cujo horário está retido, **quando** eu **confirmo** a reserva, **então** ela passa a confirmada, o código de cancelamento é gerado e mostrado para eu repassar à pessoa, e o horário aparece reservado na grade.
- [ ] **Dado** um pagamento em revisão, **quando** eu o **descarto** informando o motivo, **então** o horário volta a ficar livre na grade, a pendência sai do painel e a decisão fica registrada com autor e motivo.
- [ ] **Dado** um pagamento em revisão cujo horário **já pertence a outra pessoa**, **quando** abro a pendência, **então** confirmar não é oferecido — resta descartar com motivo, porque o horário não é mais meu para dar.
- [ ] **Dado** que não estou autenticado, **quando** tento resolver uma pendência, **então** sou recusado.

**Regras relacionadas:** RN01, RN04, RN07, RN11, RN13, RN18

---

## 🛡️ 5. Regras de Negócio (Constraints)

| ID | Regra | Usada em |
| :-- | :---- | :------- |
| RN01 | Um horário tem no máximo **uma retenção ativa**. Pré-reserva, reserva pendente, reserva confirmada e **pagamento em revisão** (RN18) ocupam o horário; expirada ou cancelada, não. | US02, US04, US12 |
| RN02 | A reserva só é confirmada pelo **aviso de pagamento do provedor**, e só depois de o aviso ser autenticado. Comprovante enviado pelo cliente não confirma nada. | US03 |
| RN03 | A cobrança Pix nasce válida por **15 minutos**, contados do instante em que é gerada, e a reserva pendente cai quando essa validade termina. O provedor avisa quando o Pix é **pago**, mas **não avisa quando ele vence** — não existe aviso de vencimento para esperar. Quem percebe o fim do prazo e expira a reserva é o **próprio sistema**, por um caminho único; *como* isso é feito é assunto do `architecture.md`. | US03, US04 |
| RN04 | Cancelamento **não gera reembolso** pelo sistema. | US05, US11 |
| RN05 | O cliente é identificado por **nome e telefone**; não existe conta de cliente. | US02 |
| RN06 | A grade pública mostra apenas o **primeiro nome** de quem reservou. Telefone e dados de pagamento só aparecem para o administrador autenticado. | US01, US09 |
| RN07 | O **código de cancelamento** é entregue ao cliente na confirmação do pagamento e **autoriza sozinho** o cancelamento daquela reserva. Por isso precisa ser imprevisível: não pode ser sequencial nem derivável de dado público. Quem tiver o código cancela — é responsabilidade do cliente não repassá-lo. | US03, US05 |
| RN08 | Horário **bloqueado** não pode ser reservado. | US01, US02, US10 |
| RN09 | Não se reserva horário **cujo início já passou**. | US01, US02 |
| RN10 | O valor cobrado é o **preço vigente na agenda no momento da reserva**, e não muda depois — alteração de preço não afeta reserva já criada. | US02, US08 |
| RN11 | Pagamento confirmado **não pode ter o valor alterado nem ser apagado**. | US03 |
| RN12 | O cliente cancela **até o início do horário**; depois disso, não. | US05 |
| RN13 | Toda operação administrativa exige **autenticação válida**; rota pública nunca expõe telefone nem dado de pagamento. | US06–US11 |
| RN14 | Arena ou quadra com **reserva futura ativa** não pode ser excluída; o sistema barra a exclusão e informa quantas reservas existem. | US07 |
| RN15 | Alterar a agenda **não desfaz reserva confirmada**; vale só para horários ainda não reservados. | US08 |
| RN18 | Pagamento confirmado **depois** de a reserva expirar não reconfirma nada sozinho, mas **também não deixa o horário à venda**: se ele ainda estiver livre, é **retido na mesma hora** e a reserva passa a *pagamento em revisão* — deixa de ser oferecido na grade, sem nome de ninguém, até o administrador decidir (US12). Só se o horário **já pertencer a outra pessoa** é que nada é retido: aí a reserva de quem chegou antes prevalece e a pendência aparece no painel para conversa humana. Em qualquer dos dois casos o pagamento fica registrado e visível para o administrador — dinheiro que entrou não some da tela. | US04, US09, US12 |
| RN19 | Tentativas de cancelamento são **limitadas por origem** (proposta: 5 tentativas a cada 10 minutos). Passou do limite, a origem é barrada temporariamente. É o que torna inviável varrer códigos por tentativa e erro. | US05 |
| RN16 | Abrir a tela de reserva de um horário o **pré-reserva por 3 minutos**: nesse período mais ninguém abre essa tela. Terminado o prazo sem Pix gerado, a pré-reserva é cancelada sem aviso prévio nem renovação, o cliente volta para a grade e o horário fica livre para qualquer um. | US01, US02 |
| RN17 | Os dois prazos são **sequenciais, não somados**, e têm donos diferentes: os 3 minutos da pré-reserva são contados **pelo sistema**; depois do Pix gerado, quem manda é **a validade de 15 minutos da cobrança** (RN03), na mão do provedor. | US02, US03, US04 |
| RN20 | **Nenhum dinheiro real transita nesta entrega.** O provedor de pagamento é usado em **ambiente de testes**, onde a cobrança Pix existe de verdade e o pagamento é simulado sob demanda — é assim que o fluxo é demonstrado no vídeo. O sistema conversa com o provedor por uma **única fronteira** e precisa continuar funcionando **sem credencial nenhuma configurada**, com um provedor local no lugar: é o que permite rodar o projeto e passar nos testes sem rede e sem chave de terceiro. | US02, US03, US04 |

---

## 🚫 6. Fora de Escopo (Non-goals)

- **Cadastro de esporte ou modalidade** — o cliente decide o que vai jogar na hora; o sistema não pergunta e não separa quadra por esporte.
- **Conta e login de cliente** — reserva se faz com nome, telefone e Pix. Não há histórico, perfil nem "minhas reservas".
- **Reembolso e estorno** — cancelar libera o horário, não devolve dinheiro. O fluxo de estorno dobraria o trabalho de pagamento.
- **Dono de arena como usuário do sistema** — existe um único papel administrativo.
- **Notificação por WhatsApp, e-mail ou SMS** — a confirmação e o código de cancelamento aparecem na tela, e é só lá que aparecem.
- **Mensalista e reserva recorrente** — cada reserva é de um horário avulso.
- **Sinal ou pagamento parcial** — ou paga o valor cheio, ou não tem reserva.
- **Relatório financeiro e fechamento de caixa** — o painel mostra o dia, não o faturamento do mês.
- **Outros meios de pagamento** (cartão, dinheiro registrado no sistema) — só Pix.
- **Cobrança com dinheiro de verdade** — o provedor roda em ambiente de testes (RN20). Sair para produção é trocar credencial, não mudar regra.

---

## ⚙️ 7. Requisitos Não Funcionais (Qualidade)

- **Concorrência:** duas pessoas não podem segurar o mesmo horário ao mesmo tempo, nem na pré-reserva nem na reserva — a exclusividade é garantida no banco, não só na tela. É a prova nº 1 do projeto.
- **Uso no celular:** a grade e o fluxo de reserva são usados de pé, na frente da quadra ou no sofá. Precisam funcionar bem em tela pequena.
- **Segredos fora do repositório:** a credencial do provedor de pagamento, o segredo que assina os avisos e as credenciais do banco vivem em variáveis de ambiente, nunca no código nem no repositório.
- **Aviso de pagamento autenticado:** todo aviso — confirmação, recusa ou vencimento — tem a assinatura verificada antes de mudar qualquer estado, e o mesmo aviso repetido não muda nada duas vezes. Vale igual para o simulador (RN20): rota que muda estado sem autenticar é rota que confirma reserva sem pagamento.
- **Rastro de dinheiro:** todo pagamento registrado é permanente — o que entrou fica registrado, mesmo depois da reserva ser cancelada.
- **Resistência a varredura:** o cancelamento é a única porta que aceita um segredo sem login. Ela precisa do limite de tentativas da RN19 e de um código com aleatoriedade suficiente para que adivinhar seja inviável, não só improvável.
- **Erros previsíveis:** toda recusa (horário ocupado, código inválido, campo faltando) responde com mensagem clara, no mesmo formato, sem vazar detalhe interno.

---

## ❓ Dúvidas em aberto

**Nenhuma dúvida em aberto.**

> Decisões fechadas, para consulta: pré-reserva de 3 minutos sem renovação (RN16);
> validade da cobrança Pix de **15 minutos** (RN03); pagamento em **ambiente de
> testes**, sem dinheiro real, e sistema que roda sem credencial (RN20); cancelamento até o início do horário (RN12); pagamento
> atrasado sinalizado no painel (RN18); exclusão barrada por reserva futura (RN14);
> **tema aprovado pelo professor** em 2026-09-24.

---

## 🛠️ 8. Histórico

| Data | Versão | O que mudou |
| :--- | :----- | :---------- |
| 2026-09-20 | 1.0.0 | Versão inicial via `/utf-prd` |
| 2026-09-24 | 1.1.0 | Pagamento em ambiente de testes, sem dinheiro real (RN20); validade do Pix fixada em 15 min e expiração assumida pelo sistema, já que o provedor não avisa vencimento (RN03); pagamento fora do prazo passa a **reter o horário** em vez de deixá-lo à venda (RN18, US12); dúvidas em aberto fechadas |
