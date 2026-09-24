# 🗺️ Jornadas de Usuário

**Projeto:** Reserva de Horários em Quadras de Areia
**Versão:** 1.1.0
**Última atualização:** 2026-09-24

> 🤖 **Este documento é a fonte da verdade sobre O QUE A PESSOA VIVE na tela** —
> o caminho do primeiro clique até o objetivo, e principalmente os pontos onde ela
> trava, espera ou desiste.
>
> ✍️ **Não preencha na mão:** rode `/utf-flows`. A entrevista escolhe a história que
> merece o desenho, obriga o ponto de desistência a aparecer e cobra a decisão sobre
> ele.
>
> 🚫 **Não duplique:** regra de negócio mora no `prd.md`; estado, entidade e contrato
> moram no `architecture.md`. Aqui mora o caminho.

---

## Jornada 1 — Reservar um horário e pagar o Pix

**Story:** US02 e US03 (o vencimento da cobrança é a US04)
**Critérios que ela marca:** sai do site e volta · depende do tempo · depende de outra pessoa · pode ser abandonada

Esta é a única jornada do projeto que marca os quatro critérios, e por um motivo só:
ela é a história inteira do produto. É aqui que o horário sai de "livre para qualquer
um" e vira "de alguém", e cada passo dessa passagem depende de algo que não está sob
o controle da tela — o relógio, o app do banco, o aviso do pagamento.

```mermaid
flowchart TD
    A(["Cliente vê a grade da quadra<br/>e escolhe um horário livre"]) --> B{"O horário ainda está livre?"}
    B -->|"não — outra pessoa chegou antes"| B1["Volta para a grade avisado:<br/>alguém está reservando agora,<br/>pode voltar em instantes"]
    B -->|"sim"| C["Sistema pré-reserva o horário<br/>por 3 minutos · RN16"]
    C --> D["«pessoa» informa nome e telefone"]
    D --> E{"Concluiu dentro dos 3 minutos?"}
    E -->|"não"| X1[["Some no formulário —<br/>e o horário fica preso?"]]
    E -->|"sim"| F["Sistema cria a reserva pendente<br/>e apresenta o Pix · RN17"]
    F --> G(["«pessoa» abre o app do banco<br/>fora do site"])
    G --> H{"O que aconteceu?"}
    H -->|"não pagou e sumiu"| X2[["Some com o Pix na mão —<br/>e o horário fica preso?"]]
    H -->|"pagou e fechou a aba"| X3[["Some pagando —<br/>e o código de cancelamento?"]]
    H -->|"pagou e voltou ao site"| I{"O aviso do pagamento já chegou?"}
    I -->|"ainda não"| J["«pessoa» vê 'estamos confirmando<br/>seu pagamento' e a tela espera sozinha"]
    J --> I
    I -->|"chegou: aprovado"| K(["Reserva confirmada:<br/>a tela mostra o código de cancelamento"])
    X2 --> L["A validade da cobrança termina<br/>e o sistema expira a reserva · RN03"]
    L --> M(["Reserva expirada:<br/>horário volta livre na grade · US04"])
    M -.->|"pagou depois do vencimento"| N["Horário sai da grade de novo e a decisão<br/>vai para o painel do admin · RN18 · US12"]
    X3 --> O["O aviso do pagamento chega mesmo assim:<br/>a reserva é confirmada e aparece na grade"]
    O --> P(["Reserva válida, mas sem código:<br/>cancelar só falando com o administrador · US11"])
    X1 --> Q(["Pré-reserva cancelada:<br/>horário livre para qualquer um, inclusive para ela"])

    style X1 fill:#ffe0e0,stroke:#c62828
    style X2 fill:#ffe0e0,stroke:#c62828
    style X3 fill:#ffe0e0,stroke:#c62828
```

**O que decidimos sobre o nó vermelho X1 — some no formulário, dentro dos 3 minutos:**

Nada fica preso. Os 3 minutos da pré-reserva são contados pelo sistema e não têm
renovação nem aviso prévio: passou o prazo, a pré-reserva é cancelada e o horário
volta a ficar livre para qualquer pessoa — inclusive para quem acabou de perder o
prazo, que pode tentar de novo. Enquanto a pré-reserva está de pé, o horário aparece
na grade como *em reserva* e ninguém mais consegue abrir aquela tela, que é o que
impede duas pessoas de preencherem o mesmo horário ao mesmo tempo. Foi escolhido
segurar o horário em vez de deixar todo mundo entrar porque o problema que esta
plataforma existe para resolver é exatamente o horário prometido a duas pessoas.

**O que decidimos sobre o nó vermelho X2 — some com o Pix na mão, sem pagar:**

Também não fica preso, mas por outro relógio: o da cobrança. A reserva pendente segura
o horário enquanto o Pix estiver válido — **15 minutos** (RN03) — e cai quando esse
prazo acaba. Aqui entra uma descoberta que mudou a regra: o provedor avisa quando o Pix
é **pago**, mas **não avisa quando ele vence**. Não há aviso de vencimento para esperar,
então quem precisa perceber que o prazo acabou é o **próprio sistema** — e precisa
perceber mesmo que ninguém esteja com a tela aberta, senão o horário fica preso até a
próxima visita de alguém. Os dois prazos continuam sequenciais e não se somam: os 3
minutos acabam no instante em que o Pix é gerado, e dali em diante manda a validade da
cobrança.

E se o dinheiro entrar **depois** de a reserva já ter caído? Ele não reconfirma nada
sozinho — mas também não pode ser ignorado, porque o horário voltou para a grade e
continua à venda. Então, no instante em que o pagamento atrasado aparece, o sistema
**tira o horário da grade outra vez** e joga a decisão para o painel: a reserva fica
como *pagamento em revisão* e o administrador confirma ou descarta (RN18, US12). A
única exceção é o horário já ter sido reservado por outra pessoa nesse intervalo —
aí não há o que reter, quem chegou antes fica com ele, e a conversa é humana. O que
não pode acontecer, em nenhuma das duas pontas, é o sistema receber dinheiro e seguir
oferecendo o mesmo horário para o próximo.

**O que decidimos sobre o nó vermelho X3 — paga e fecha a aba antes de ver o código:**

A reserva vale. O pagamento foi feito, o aviso chega, a reserva é confirmada e o
horário aparece ocupado na grade com o primeiro nome da pessoa — fechar a aba não
desfaz um Pix pago. O que se perde é o código de cancelamento, que só é mostrado na
tela de confirmação e não é enviado por nenhum outro canal, porque WhatsApp, e-mail e
SMS estão fora de escopo. Quem perder o código e precisar cancelar fala com o
administrador, que cancela a reserva pelo painel — é para isso que a US11 existe. Foi
decidido não criar uma tela pública de "recuperar meu código": ela seria uma segunda
porta que aceita segredo sem login, e como o telefone do cliente é adivinhável, essa
porta enfraqueceria justamente o que torna o código seguro. Uma porta dessas, e só
uma, é o limite que o projeto aceita. Do lado humano, o administrador confere o
**número de origem do contato** contra o telefone gravado na reserva, que ele vê no
painel — não é o mesmo que o telefone digitado num campo: para passar nessa
conferência é preciso ligar daquele número, e não apenas sabê-lo. Ainda assim é
conferência humana, falível e **não garantida pelo sistema**: identificador de
chamada se falsifica, e quem procurar o administrador por mensagem em vez de ligação
não deixa número nenhum para conferir. Dentro do sistema nada muda — a única porta
pública do cliente continua aceitando só o código.

**Sobre a espera (o nó amarelo do meio):** quem paga e volta ao site antes do aviso
chegar não vê a grade nem uma tela morta — vê *"estamos confirmando seu pagamento"*, e
essa tela espera por conta própria até virar a confirmação com o código. Não é
enfeite: como não existe notificação, esse é o único momento em que o código de
cancelamento pode ser entregue a quem fez tudo certo. A reserva continua pendente até
o aviso chegar — voltar do banco não confirma nada, só o aviso do provedor confirma.

---

## Dúvidas em aberto

| # | Dúvida | Onde ela precisa ser resolvida |
| --- | --- | --- |
| 1 | Que validade dar à cobrança Pix ao criá-la? A escolha define quanto tempo o horário fica preso no nó X2. | `/utf-architecture` — já registrada como Dúvida 1 do `prd.md` |
| 2 | Quanto tempo a tela de espera fica esperando antes de dizer alguma coisa à pessoa? | `/utf-architecture` |

---

## 🛠️ Histórico

| Data | Versão | O que mudou |
| :--- | :----- | :---------- |
| 2026-09-20 | 1.0.0 | Jornada de pagamento (US02+US03) via `/utf-flows` |
