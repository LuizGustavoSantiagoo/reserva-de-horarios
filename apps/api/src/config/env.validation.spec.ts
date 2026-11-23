import { validateEnv } from './env.validation.js';

const DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
const CORS_ORIGIN = 'http://localhost:5173';

describe('validateEnv', () => {
  it('rejeita a falta de DATABASE_URL', () => {
    expect(() => validateEnv({ CORS_ORIGIN })).toThrow(/DATABASE_URL/);
  });

  it('rejeita DATABASE_URL vazia', () => {
    expect(() => validateEnv({ DATABASE_URL: '  ', CORS_ORIGIN })).toThrow(
      /DATABASE_URL/,
    );
  });

  it('rejeita a falta de CORS_ORIGIN', () => {
    expect(() => validateEnv({ DATABASE_URL })).toThrow(/CORS_ORIGIN/);
  });

  it('rejeita CORS_ORIGIN vazia', () => {
    expect(() => validateEnv({ DATABASE_URL, CORS_ORIGIN: '  ' })).toThrow(
      /CORS_ORIGIN/,
    );
  });

  it('aceita a configuração com DATABASE_URL e CORS_ORIGIN definidas', () => {
    expect(validateEnv({ DATABASE_URL, CORS_ORIGIN })).toEqual({
      DATABASE_URL,
      CORS_ORIGIN,
    });
  });
});
