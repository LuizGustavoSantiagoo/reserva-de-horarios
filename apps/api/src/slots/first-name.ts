/**
 * O primeiro nome que a grade pública mostra (CA4): a primeira palavra, sem os
 * espaços das pontas, com a inicial maiúscula e as demais letras minúsculas.
 */
export function firstName(fullName: string): string {
  const [first = ''] = fullName.trim().split(/\s+/);
  return (
    first.charAt(0).toLocaleUpperCase('pt-BR') +
    first.slice(1).toLocaleLowerCase('pt-BR')
  );
}
