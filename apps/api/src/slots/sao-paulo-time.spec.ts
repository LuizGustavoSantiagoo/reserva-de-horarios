import {
  saoPauloDate,
  saoPauloHourToInstant,
  weekdayOf,
} from './sao-paulo-time.js';

describe('saoPauloDate', () => {
  it('às 22h de São Paulo, quando em UTC já é o dia seguinte, devolve o dia de São Paulo', () => {
    expect(saoPauloDate(new Date('2026-11-23T01:00:00.000Z'))).toBe(
      '2026-11-22',
    );
  });

  it('à meia-noite de São Paulo já devolve o dia novo', () => {
    expect(saoPauloDate(new Date('2026-11-23T03:00:00.000Z'))).toBe(
      '2026-11-23',
    );
  });
});

describe('saoPauloHourToInstant', () => {
  it('converte a hora de São Paulo (UTC-3) no instante UTC', () => {
    expect(saoPauloHourToInstant('2026-11-22', 8).toISOString()).toBe(
      '2026-11-22T11:00:00.000Z',
    );
  });

  it('segue o fuso de verdade, inclusive no antigo horário de verão (UTC-2)', () => {
    expect(saoPauloHourToInstant('2018-12-01', 8).toISOString()).toBe(
      '2018-12-01T10:00:00.000Z',
    );
  });
});

describe('weekdayOf', () => {
  it('devolve o dia da semana da data, de 0 (domingo) a 6 (sábado)', () => {
    expect(weekdayOf('2026-11-22')).toBe(0);
    expect(weekdayOf('2026-11-23')).toBe(1);
    expect(weekdayOf('2026-11-28')).toBe(6);
  });
});
