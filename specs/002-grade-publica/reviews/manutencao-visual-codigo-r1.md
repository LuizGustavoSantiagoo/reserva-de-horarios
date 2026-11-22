# Parecer de Código — Manutenção visual da grade pública (branch 2-grade-publica, diff `git diff --cached 9c79c28`)

**Veredito:** APROVADO

Nenhum apontamento bloqueante. Verificações: `npm run test:unit -- --run` (6 arquivos, 26 testes), `VITE_API_URL=http://localhost:3000 npm run build`, `oxlint .`, `eslint .` e `prettier --check src/` — todos limpos.

Pontos conferidos: só tokens (cor, espaço, tipografia); acessibilidade (`<label for>` via `useId`, `role="group"` + `aria-labelledby`, foco `outline-3 outline-offset-2 outline-primaria-escura`, `aria-pressed`/`aria-current="date"` só no dia escolhido, contraste acima de 4.5:1); a faixa de dias é calculada a partir de `props.day` em UTC, sem o relógio do aparelho; nenhuma regra de negócio, preço, dado da arena, seleção, status novo ou limite "antes de hoje"; nenhum componente chama a API fora do `grade.service`.

## Sugestões (não bloqueiam)
- `GradePage.spec.ts`, teste "escolher outra quadra…": a asserção do `select.value === 'q2'` logo após `setValue('q2')` sempre passa; o comportamento segue coberto por `toHaveBeenLastCalledWith('q2', …)` e pelo teste do `grid-heading`.
- `DayPicker.spec.ts` confere só o `aria-label`, não o texto visível ("Dom", "22", "nov").
- Formatação do dia por extenso repetida em `GradePage.vue:14-27` e `DayPicker.vue:16-21`.
- Nome acessível do card do dia difere do texto visível (WCAG 2.5.3).
- `aria-pressed` num botão que não desmarca; um `radiogroup` descreveria melhor.
- Token `desabilitado` usado como cor de borda de controles ativos; vale um token `borda` via `/utf-design`.

## Observações fora do escopo
- A fonte Roboto não é carregada (`index.html`, `main.ts`, `package.json`): candidata a Issue de manutenção.
- `design-tokens.md` editado à mão (versão 1.2.0), a pedido do usuário.
