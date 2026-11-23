/**
 * O corpo de erro sem o `timestamp`, que muda a cada resposta. Confere antes que
 * o `timestamp` veio, como texto, no formato único de erro.
 */
export function withoutTimestamp(
  body: Record<string, unknown>,
): Record<string, unknown> {
  const { timestamp, ...rest } = body;
  expect(typeof timestamp).toBe('string');
  return rest;
}
