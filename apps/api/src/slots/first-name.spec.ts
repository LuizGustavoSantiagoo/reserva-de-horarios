import { firstName } from './first-name.js';

describe('firstName', () => {
  it('fica só com a primeira palavra, sem os espaços das pontas, com a inicial maiúscula', () => {
    expect(firstName('  maria  da Silva ')).toBe('Maria');
  });

  it('põe as demais letras em minúscula, inclusive as acentuadas', () => {
    expect(firstName('JOÃO')).toBe('João');
  });
});
