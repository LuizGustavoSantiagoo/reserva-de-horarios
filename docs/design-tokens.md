# 🎨 Tokens de Design

**Projeto:** Reserva de Horários em Quadras de Areia
**Versão:** 1.1.0
**Última atualização:** 2026-10-04

> 🤖 **Este documento existe para a IA parar de inventar um botão diferente a cada
> tela.** Não é um design system — é o mínimo que dá à prototipagem assistida algo a
> que obedecer.
>
> ✍️ **Não preencha na mão:** rode `/utf-design` (depois do `/utf-flows`).

---

## Paleta

Nome semântico, nunca `azul-2` — a cor muda, o papel dela não.

| Token | Valor | Onde se usa |
| --- | --- | --- |
| `primaria` | `#FBBF24` | ação principal: botão Reservar, botão Confirmar |
| `primaria-escura` | `#B45309` | link, ícone de ação, hover do botão, anel de foco |
| `superficie` | `#FFFFFF` | fundo de card e painel |
| `texto` | `#18181B` | texto padrão — **e a letra sobre a `primaria`** |
| `texto-suave` | `#52525B` | legenda, apoio |
| `perigo` | `oklch(57.7% 0.245 27.325)` | erro, cancelamento |
| `sucesso` | `oklch(72.3% 0.219 149.579)` | confirmação, horário livre |
| `desabilitado` | `#D4D4D8` | controle inativo, horário ocupado ou em reserva |

**Duas regras de uso que vêm do contraste, não do gosto:**

- A `primaria` é clara demais para letra branca. Texto sobre ela é sempre `texto`.
  Quem precisa de cor de marca em **letra** sobre fundo claro — link, ícone — usa
  `primaria-escura`.
- O `sucesso` é uma cor de **preenchimento**: selo, ícone, faixa do horário livre.
  Texto de confirmação continua em `texto`; letra verde pequena sobre fundo claro não
  se lê.

## Escala de espaçamento

Uma progressão só, usada em tudo. Em `rem`, não em px: quando a pessoa aumenta a fonte
no navegador, o espaço cresce junto e a tela continua respirando. O equivalente em px
(com a fonte padrão de 16px) está entre parênteses só para dar intuição.

| Token | Valor | Uso típico |
| --- | --- | --- |
| `xs` | 0.25rem (4px) | ícone colado ao texto |
| `sm` | 0.5rem (8px) | entre label e campo |
| `md` | 0.75rem (12px) | interno do card de horário |
| `lg` | 1rem (16px) | entre cards da grade |
| `xl` | 1.5rem (24px) | margem de seção, topo da tela |
| `2xl` | 2rem (32px) | margem da página em tela larga |

Nenhum valor fora dela. Altura de botão e campo, raio e largura de borda e tamanho de
ícone não são espaçamento.

## Tipografia

| Token | Família · tamanho · peso | Papel |
| --- | --- | --- |
| `titulo-pagina` | Roboto · 1.5rem (24px) · 700 | título da tela ("Quadra 2 — sábado") |
| `titulo-card` | Roboto · 1.125rem (18px) · 600 | horário no card, seção do painel |
| `corpo` | Roboto · 1rem (16px) · 400 | texto padrão, campos de formulário e botões (botão em 600) |
| `legenda` | Roboto · 0.875rem (14px) · 400 | apoio, "estamos confirmando seu pagamento" |
| `codigo` | Roboto Mono · 1.25rem (20px) · 600 | código de cancelamento — o único texto em 20px |

O `corpo` não desce de 1rem (16px): abaixo disso o navegador do celular dá zoom sozinho ao
focar um campo, e o formulário de reserva salta na tela. O `codigo` é monoespaçado
porque é o único texto que alguém lê em voz alta e digita em outra tela — `0` e `O`
não podem se parecer.

## Estados de botão

| Estado | Aparência |
| --- | --- |
| normal | fundo `primaria` · letra `texto` · peso 600 |
| hover | fundo `primaria-escura` · letra `superficie` |
| foco (teclado) | anel de 3px em `primaria-escura`, afastado 2px do botão |
| desabilitado | fundo `desabilitado` · letra `texto-suave` · sem hover · cursor bloqueado |
| carregando | fundo normal · indicador visível · rótulo trocado pela ação em curso ("Gerando o Pix…", "Entrando…", "Salvando…", "Cancelando…") · botão inerte |

Os dois últimos estados existem por causa da jornada, não por capricho:
**desabilitado** é o horário que outra pessoa está reservando (o card não deixa abrir
a tela), e **carregando** é o que impede o segundo clique em "Confirmar" de virar uma
segunda cobrança. O **foco** é o que permite reservar sem mouse — sem ele, quem navega
por teclado não sabe onde está.

## Protótipo

**Protótipo navegável:** <https://deer-quilt-67996631.figma.site/>

**Telas** — cobrem todas as histórias Must Have do `prd.md`, não telas soltas. São dez,
e não cinco, porque o produto tem dois atores: quatro das Must Have (US06 a US09) têm
tela do administrador. A US04 também é do administrador, mas não tem tela própria — é
o sistema expirando a cobrança, e o efeito aparece nas telas 1 e 3 do cliente.

*Cliente* (o caminho da Jornada 1, em `user-flows.md`, com os nós vermelhos):

1. **Grade de horários** (US01, US02) — escolher quadra e dia e marcar vários horários;
   livre, em reserva, reservado com o primeiro nome, bloqueado e já iniciado; dia sem
   agenda; avisos "alguém está reservando agora" e "o tempo acabou"
2. **Revisão e dados** (US02) — horários escolhidos, total, nome e telefone, contador
   dos 3 minutos e aviso do horário que saiu da compra
3. **Pix** (US02, US04) — um único Pix com a soma; aviso de cobrança vencida
4. **Espera** (US03) — "estamos confirmando seu pagamento"
5. **Confirmação** (US03) — horários confirmados e o código de cancelamento
6. **Cancelar com código** (US05) — escolher os horários e o aviso de que o valor pago
   não é devolvido; recusa genérica e bloqueio por tentativas

*Administrador:*

7. **Login** (US06)
8. **Agenda do dia** (US09) — com o pagamento fora do prazo em destaque
9. **Arena e quadras** (US07)
10. **Agenda semanal da quadra** (US08)

---

## 🛠️ Histórico

| Data | Versão | O que mudou |
| :--- | :----- | :---------- |
| 2026-09-20 | 1.0.0 | Tokens definidos via `/utf-design`; link do protótipo registrado |
| 2026-10-04 | 1.1.0 | Revisão contra o protótipo novo: espaçamento e tipografia em `rem`, degrau `2xl` na escala, rótulos de carregando, novo link e as dez telas das Must Have |
