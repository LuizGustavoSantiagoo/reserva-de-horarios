---
issue: 2
status: aprovada   # rascunho | aprovada
---

# US01 — Ver a grade pública de horários

## O problema

Hoje quem quer jogar precisa chamar o dono da arena no direct e perguntar o que está
livre; ele confere a agenda na mão e responde. Cada consulta custa uma conversa, e a
resposta já pode estar velha quando chega. Sem uma grade pública e confiável, o resto
do produto — reservar, pagar, confirmar — não tem por onde começar.

## A história

**Como** cliente, **eu quero** ver os horários de uma quadra em um dia **para que**
eu saiba o que está livre sem perguntar para ninguém.

## Critérios de aceite

Ordem de precedência da situação de um horário, usada por todos os critérios abaixo:
**bloqueado** → **reservado** → **indisponível** (início já passou) → **em reserva** →
**livre**. "Hoje" e o dia de cada horário são calculados no fuso `America/Sao_Paulo`;
um horário "já começou" quando o seu início é igual ou anterior ao instante atual.

- [ ] **CA1 — Dado** quadras ativas com agenda definida para hoje, **quando** eu abro a grade, **então** vejo a lista das quadras ativas, com a primeira já escolhida e o dia de hoje, e cada horário de 1 hora daquele dia, em ordem crescente, com sua situação: livre, em reserva, reservado, bloqueado ou indisponível. Quadra inativa não aparece na lista.
- [ ] **CA2 — Dado** que não existe nenhuma quadra ativa, **quando** eu abro a grade, **então** vejo a mensagem "nenhuma quadra disponível", e não uma tela em branco nem um seletor de dia vazio.
- [ ] **CA3 — Dado** uma quadra sem agenda no dia escolhido, **quando** eu abro a grade dessa quadra nesse dia, **então** vejo uma mensagem dizendo que não há horários nesse dia, e não uma tela em branco.
- [ ] **CA4 — Dado** um horário com reserva **confirmada**, **quando** eu olho a grade, **então** ele aparece como reservado com apenas o **primeiro nome** de quem reservou — a primeira palavra do nome, sem espaços nas pontas, com a primeira letra maiúscula e as demais minúsculas (`"  maria  da Silva "` → `"Maria"`) — e a resposta da rota pública nunca contém o telefone nem o nome completo.
- [ ] **CA5 — Dado** um horário cujo início já passou, **quando** eu vejo a grade, **então**: se ele estiver livre ou em reserva, aparece como **indisponível** e não pode ser selecionado; se estiver reservado ou bloqueado, continua aparecendo como reservado (com o primeiro nome) ou bloqueado.
- [ ] **CA6 — Dado** um horário com pré-reserva ou reserva pendente **dentro do prazo**, **quando** eu vejo a grade, **então** ele aparece como **em reserva**, sem nome de ninguém, e não pode ser selecionado.
- [ ] **CA7 — Dado** um horário com pré-reserva cujos 3 minutos já venceram, ou com reserva pendente cuja cobrança já venceu, mas que o sistema ainda não marcou como expirada, **quando** eu vejo a grade, **então** ele aparece como **livre** (abandono — ver "Abandono no meio").
- [ ] **CA8 — Dado** horários livres na grade, **quando** eu toco em um deles, **então** ele fica marcado como selecionado; tocar de novo desmarca; a tela mostra "N horários selecionados"; a seleção se mantém ao trocar de quadra ou de dia; horários em reserva, reservados, bloqueados ou indisponíveis não reagem ao toque; e nenhum botão leva adiante para a reserva nesta história.
- [ ] **CA9 — Dado** que estou com a grade aberta, **quando** passam 15 segundos, **então** a grade se atualiza sozinha; se um horário que eu tinha selecionado deixou de estar livre, ele sai da minha seleção e o contador é atualizado.
- [ ] **CA10 — Dado** uma falha de rede ou erro do servidor, **quando** a grade é carregada pela primeira vez, **então** vejo uma mensagem de erro com o botão **Tentar de novo**; **quando** a falha acontece numa atualização automática, **então** continuo vendo a última grade carregada, com a minha seleção intacta, e um aviso "não foi possível atualizar".
- [ ] **CA11 — Dado** um link para uma quadra inexistente ou inativa, ou para um dia já passado ou com data mal formada, **quando** eu o abro, **então** a API recusa — quadra inexistente e inativa respondem igual, `404` "quadra não encontrada", sem revelar qual das duas é; data inválida ou passada responde `400` apontando o campo da data — e a tela mostra a mensagem com a opção de voltar para hoje. No seletor de dia, não há como navegar para antes de hoje.

## Fora de escopo

- Avançar da seleção para a tela de reserva, pré-reservar ou gerar Pix — é a US02 (#3).
- Mostrar o preço de cada horário na grade.
- Mostrar o motivo de um bloqueio para o cliente.
- Cadastrar ou editar quadras e agenda pelo painel — US07 (#8) e US08 (#9).
- Criar bloqueio — US10 (#11).
- Marcar reservas como expiradas: a grade só **lê** o prazo; quem muda o status é o `ExpirationService`, que nasce com a US02/US04.
- Liberar a pré-reserva no servidor quando o cliente é redirecionado de volta à grade ao fim dos 3 minutos — o redirecionamento é da US02 (#3), e a liberação exige antes alterar a `docs/architecture.md` (§2.1, item 9, hoje "nenhum outro código expira reserva").
- Mostrar os dados da arena (nome e endereço) na grade.
- Guardar a seleção depois de fechar a aba.
- Limite de quantos dias à frente se pode consultar.

## Abandono no meio

**Nó X1 da Jornada 1 — some no formulário dentro dos 3 minutos.** A pré-reserva cai
quando os 3 minutos vencem, mas quem muda o status é o job que roda a cada minuto, e a
hospedagem gratuita pode hibernar esse job. Se a grade confiasse só no status gravado,
um horário abandonado ficaria aparecendo "em reserva" até o job acordar — o horário
fica preso exatamente como o PRD proíbe. Por isso a grade compara o prazo com o
relógio na leitura: prazo vencido é livre, mesmo que o status ainda diga o contrário
(CA7). O mesmo vale para o **nó X2** (some com o Pix na mão): a reserva pendente com a
cobrança vencida aparece livre.

Decidido também que, quando o cliente **fica** na tela até os 3 minutos acabarem e é
redirecionado à grade, o redirecionamento libera a pré-reserva no servidor. Isso
complementa o CA7, não o substitui: quem **fecha a aba** nunca é redirecionado, e para
essa pessoa só a leitura do prazo impede o horário de ficar preso. A liberação no
redirecionamento entra na spec da US02 (#3), depois de a `docs/architecture.md` ser
alterada (ver "Fora de escopo").

**Nó X3 — paga e fecha a aba.** Não muda a grade: o aviso de pagamento confirma a
reserva sem a tela aberta, e a grade passa a mostrá-la como reservada (CA4).

**O cliente fecha a aba no meio da seleção.** Nada foi segurado no servidor; a seleção
se perde e ninguém é afetado. Por isso a seleção não precisa sobreviver ao fechamento.

**A conexão cai com a grade aberta.** Na primeira carga não há o que mostrar, então
aparece o erro com **Tentar de novo**. Numa atualização automática a última grade
continua na tela e a seleção é mantida, com o aviso de que não foi possível atualizar
(CA10). A seleção pode estar desatualizada nesse momento — é a US02 que confere a
disponibilidade de verdade ao abrir a tela de reserva.

**Alguém pré-reserva um horário que eu selecionei.** Na próxima atualização o horário
deixa de estar livre e sai da minha seleção (CA9).

## Assume que

| Premissa | Issue que fecha |
| --- | --- |
| As quadras de exemplo (ativas e uma inativa) nascem no **seed**, porque ainda não existe cadastro de quadra pelo painel (`// TODO #8` no seed). | #8 — US07 |
| A agenda semanal das quadras de exemplo nasce no **seed**, porque ainda não existe tela de agenda (`// TODO #9` no seed). | #9 — US08 |

## Dúvidas em aberto

| # | Dúvida | Quem responde |
| --- | --- | --- |
