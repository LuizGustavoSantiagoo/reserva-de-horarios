# Parecer de Código — Tarefa 7 (rodada 1)

**Veredito:** APONTAMENTOS

Passo 1: li `.agents/agents/revisor-codigo.md` e `docs/architecture.md`.
Passo 2: li o diff inteiro (`git diff --cached e51a540…`), 8 arquivos, e o contexto: `GradePage.vue`, `slots.service.ts`, `all-exceptions.filter.ts`, `validation.pipe.ts`, `src/api/client.ts`, `grade.service.ts` e o plano (Contrato da API e Frontend).
Passo 3: rodei as verificações. Não alterei nenhum arquivo e o `git status` continua só com os 8 arquivos no índice.

Resultado das verificações:
- **apps/api:** `npm test` passou (52/52), `npm run build` e `npm run lint` saíram sem erro, `npm run test:e2e` passou (26/26).
- **apps/web:** `npm run test:unit -- --run` passou (43/43), o build com `VITE_API_URL` funcionou, e o `npm run lint` (que roda com `--fix`) não deixou diff pendente.
- **Banco de dev:** o e2e rodou contra o banco configurado no `apps/api/.env`. Pode ter ficado lá o que os helpers do e2e inserem (quadras e regras de teste, incluindo a "Quadra Inativa"). Não conferi nem limpei.

## Apontamentos (bloqueiam)

1. **A página importa do cliente HTTP e interpreta o contrato de erro da API** — `apps/web/src/features/grade/pages/GradePage.vue:5` (`import { ApiError } from '@/api/client'`) e o `catch` de `loadGrid` (`error.statusCode === 404 || error.statusCode === 400`, `error.fields?.date?.[0]`).
   Regra violada: §3/§4. "`pages/` pode usar `components/` e `services/` do próprio domínio e tudo de `shared/`", e `src/api/` não está nessa lista. A §4 também diz: "Mudança de contrato mexe em `api/` e nos services — nunca nas telas."
   Prejuízo concreto:
   - A tela passou a conhecer status HTTP e o nome do campo `date` do DTO da API. Se o contrato mudar (outro status, campo renomeado, `fields` reorganizado), a correção cai na tela, que é justamente o que a §4 proíbe.
   - O efeito já aparece: só para carregar a classe de erro, o `GradePage.spec.ts` precisou do `vi.hoisted(() => vi.stubEnv('VITE_API_URL', …))`. Toda página futura que tratar erro desse jeito vai repetir esse stub.
   - Caminho sugerido (a decisão é do usuário): o `grade.service.ts` traduz o `ApiError` em algo do domínio. Por exemplo, um `GradeRefusal` com `reason: 'court' | 'day'` e `message`, ou uma função `refusalOf(error)`. A página passa a importar só do service. O stub de env no spec da página deixa de ser necessário, porque o service já é mockado.

## Sugestões (não bloqueiam)

- **Formato de 400 montado à mão no service** — `apps/api/src/slots/slots.service.ts:61-66` repete o literal `'Dados inválidos.'` e a forma `{ message, fields }` que já existem em `apps/api/src/common/validation.pipe.ts:31-34`. Se a mensagem do pipe mudar, o 400 de data passada fica diferente dos outros 400. Um helper em `common/` (ex.: `validationError(fields)`) usado pelos dois resolve. Hoje o prejuízo é pequeno, porque o front lê `fields.date`.
- **404 do id não-UUID no service, sem DTO de params (tensão com §2.1 item 2).** O plano aprovado (Contrato da API) decide isso explicitamente: "`courtId` que não é UUID … → 404, resposta idêntica nos três casos". Com isso não considero violação. Vale registrar essa exceção na `architecture.md` (§2.1 item 2: "params de recurso cuja existência não pode ser revelada são validados no service com 404"). Detalhe conferido: `isUUID` do validator 13.15 aceita as versões 1 a 8 e o Prisma gera v4.
- **`isCalendarDate` via `@ValidateBy`:** está limpo, mora em `dto/`, e não duplica nada de `sao-paulo-time.ts`. Ok.
- **`backToToday` chama `router.replace` duas vezes** (`writeQuery(courtId)` e, de novo, dentro de `loadGrid` quando dá certo) — `GradePage.vue:76-84`. A primeira escrita é redundante no caminho de sucesso; só faz diferença se o pedido falhar. Se a intenção é essa, um comentário ajuda.
- **A página não observa `route.query`.** Funciona porque só se usa `replace`. Se algum dia entrar `push`, voltar no navegador não vai recarregar a grade. Um comentário curto registrando essa premissa ajudaria.
- **Testes:** usam `data-test`, `aria-label` e o atributo `disabled` — comportamento observável. O caso das 22h em São Paulo no e2e é bom.

## Observações fora do escopo deste diff

- `selectCourt` e `selectDay` usam `void loadGrid(...)`, e o `catch` relança erro que não seja 400/404: falha de rede vira *unhandled rejection*. Já existia; encaminhado para a Tarefa 10.
- Corrida entre pedidos (trocas rápidas de dia/quadra) também já existia; pode ser tratada junto com o polling.
