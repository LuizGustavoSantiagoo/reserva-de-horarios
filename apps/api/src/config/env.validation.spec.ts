import { validateEnv } from './env.validation.js';

describe('validateEnv', () => {
  it('rejeita a falta de DATABASE_URL', () => {
    expect(() => validateEnv({})).toThrow(/DATABASE_URL/);
  });

  it('rejeita DATABASE_URL vazia', () => {
    expect(() => validateEnv({ DATABASE_URL: '  ' })).toThrow(/DATABASE_URL/);
  });

  it('aceita a configuração com DATABASE_URL definida', () => {
    const url = 'postgresql://user:pass@localhost:5432/db';

    expect(validateEnv({ DATABASE_URL: url })).toEqual({ DATABASE_URL: url });
  });
});
