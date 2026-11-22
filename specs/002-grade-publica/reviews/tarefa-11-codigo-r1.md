# Parecer de Código — Tarefa 11 (rodada 1)

**Veredito:** APROVADO

Revisei o diff do índice (`git diff --cached 8fd6b29`, 6 arquivos) contra `docs/architecture.md`. Conferi que a documentação nova bate com o código (`slots.service.ts` valida o `courtId` com `isUUID` e lança `NotFoundException`; controller com `@Param('courtId')` sem DTO; `slots.module.ts` importa só módulos que exportam services). Nenhum `TODO #2` restante em `apps/` e `docs/`.

## Testes
web unitários 72/72; build ok; lint sem diff pendente; Playwright chromium 1/1; api `npm test` 52/52.

## Apontamentos (bloqueiam)
Nenhum.

- `showRefusal` junta o tratamento da recusa (dois chamadores), zera `refreshFailed`, não engole falha; o ramo `reason === 'day'` vem antes; a página só chama o service do domínio (§4).
- Testes usam a interface pública; e2e com seletor por papel (`heading` nível 1).
- `architecture.md`: §2.1 item 2 descreve exatamente o código; §6 correto; versão 1.6.0 e Histórico.

## Sugestões (não bloqueiam)
- Quando a quadra é recusada no polling, os horários dela já marcados continuam no `selection` e no contador; se não for o desejado, limpar as chaves `courtId|*` em `showRefusal`.
- `toHaveBeenLastCalledWith('q1', undefined)` preso à assinatura posicional de `getSlots` (padrão do arquivo).

## Fora do escopo
- `architecture.md` §7: a linha 1.2.1 aparece depois da 1.4.0 (veio do merge da `main`).
