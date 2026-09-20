# 🎨 Tokens de Design

**Projeto:** Reserva de Horários em Quadras de Areia
**Versão:** 1.0.0
**Última atualização:** 2026-09-20

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

Uma progressão só, usada em tudo.

| Token | Valor | Uso típico |
| --- | --- | --- |
| `xs` | 4px | ícone colado ao texto |
| `sm` | 8px | entre label e campo |
| `md` | 12px | interno do card de horário |
| `lg` | 16px | entre cards da grade |
| `xl` | 24px | margem de seção, topo da tela |

## Tipografia

| Token | Família · tamanho · peso | Papel |
| --- | --- | --- |
| `titulo-pagina` | Roboto · 24px · 700 | título da tela ("Quadra 2 — sábado") |
| `titulo-card` | Roboto · 18px · 600 | horário no card, seção do painel |
| `corpo` | Roboto · 16px · 400 | texto padrão e campos de formulário |
| `legenda` | Roboto · 14px · 400 | apoio, "estamos confirmando seu pagamento" |
| `codigo` | Roboto Mono · 20px · 600 | código de cancelamento |

O `corpo` não desce de 16px: abaixo disso o navegador do celular dá zoom sozinho ao
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
| carregando | fundo normal · indicador visível · rótulo trocado ("Gerando o Pix…") · botão inerte |

Os dois últimos estados existem por causa da jornada, não por capricho:
**desabilitado** é o horário que outra pessoa está reservando (o card não deixa abrir
a tela), e **carregando** é o que impede o segundo clique em "Confirmar" de virar uma
segunda cobrança. O **foco** é o que permite reservar sem mouse — sem ele, quem navega
por teclado não sabe onde está.

## Protótipo

**Protótipo navegável:** <https://learn-depth-46111132.figma.site/>
**Arquivo de origem (Figma Make):** <https://www.figma.com/make/oZiVjqicEvrFPuliGJycBH/Sistema-de-Reserva-de-Quadras>

**Telas** (as da Jornada 1, em `user-flows.md`, e não telas soltas):

1. Grade de horários da quadra em um dia — com horário livre, ocupado, bloqueado e *em reserva*
2. Tela de reserva — nome e telefone, com o prazo de 3 minutos à vista
3. Tela do Pix — o que pagar e como
4. Tela de espera — "estamos confirmando seu pagamento"
5. Confirmação — com o código de cancelamento em destaque

---

## 🛠️ Histórico

| Data | Versão | O que mudou |
| :--- | :----- | :---------- |
| 2026-09-20 | 1.0.0 | Tokens definidos via `/utf-design`; link do protótipo registrado |
