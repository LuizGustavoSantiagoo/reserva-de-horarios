# Parecer de Código — Tarefa 8

**Veredito:** APROVADO

Revisei o diff `git diff --cached 36e4e65` (6 arquivos de `apps/web/src/features/grade/`) contra `docs/architecture.md` §3 e §4. Não alterei nenhum arquivo.

## Verificações
- web, testes unitários: 7 arquivos, 58 testes passando.
- web, build com `VITE_API_URL=http://localhost:3000`: sem erro.
- web, lint: passou, sem diff pendente.
- api, `npm test`: 11 arquivos, 52 testes passando.

## Por que está aprovado
- **Camadas (§4):** nenhum componente chama a API. A seleção é estado da página (`Set` com chave `courtId|startsAt`); a `SlotList` recebe só os `startsAt` da grade em exibição e repassa o toque; o `SlotItem` mostra o estado e emite `toggle`. Props descem, eventos sobem.
- **Dependência entre pastas:** os imports ficam dentro de `features/grade`.
- **Mobile first:** o cabeçalho empilha no celular e vira linha a partir de `sm:`.
- **Acessibilidade:** o livre é `<button type="button">` com `aria-pressed` e foco visível; contador com `aria-live="polite"`; os não livres não têm elemento interativo.
- Sem segredo/URL no código, sem erro engolido, sem abstração para um caso só.

## Apontamentos (bloqueiam)
Nenhum.

## Sugestões (não bloqueiam)
- `GradePage.vue:77-84`: `toggleSlot` confere de novo que o horário é `FREE` (o `SlotItem` já garante). A regra fica em dois lugares; um comentário de "proteção intencional" ajudaria.
- `SlotItem.spec.ts`: confere `bg-texto`/`text-superficie`; quebra se o visual mudar. O `aria-pressed` já cobre o comportamento.
- `GradePage.spec.ts`, "não existe botão para avançar": usa uma lista fixa de botões permitidos; um "Tentar de novo" (Tarefa 10) vai exigir ajustar o teste.

## Observações fora do escopo
- Com o polling (Tarefa 9), um horário selecionado pode deixar de estar livre e continuar contado em `selection` — ponto de atenção para a Tarefa 9 (o CA9 já cobre isso).
