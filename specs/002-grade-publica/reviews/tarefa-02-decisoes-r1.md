# Decisões — Tarefa 2, rodada 1

| # | Apontamento (resumo) | Parecer | Decisão | Justificativa |
| --- | --- | --- | --- | --- |
| 1 | `client.ts:5` usa `import.meta.env.VITE_API_URL ?? 'http://localhost:3000'`: URL de ambiente fixa no código como fallback; um deploy sem a variável passa no build e chama `localhost` no aparelho do cliente; variável não documentada (.env, architecture) nem tipada no `env.d.ts` (architecture §2.1 item 11, §4) | código | aceito | — (o usuário aceitou, registrando que não considera a mudança necessária) |

Sugestões não bloqueantes do parecer de código (a–e): nenhuma promovida a apontamento.
