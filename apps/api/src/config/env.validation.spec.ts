import { validateEnv } from './env.validation.js';

const DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
const CORS_ORIGIN = 'http://localhost:5173';
const JWT_SECRET = 'segredo-de-teste';

describe('validateEnv', () => {
  it('rejeita a falta de DATABASE_URL', () => {
    expect(() => validateEnv({ CORS_ORIGIN, JWT_SECRET })).toThrow(
      /DATABASE_URL/,
    );
  });

  it('rejeita DATABASE_URL vazia', () => {
    expect(() =>
      validateEnv({ DATABASE_URL: '  ', CORS_ORIGIN, JWT_SECRET }),
    ).toThrow(/DATABASE_URL/);
  });

  it('rejeita a falta de CORS_ORIGIN', () => {
    expect(() => validateEnv({ DATABASE_URL, JWT_SECRET })).toThrow(
      /CORS_ORIGIN/,
    );
  });

  it('rejeita CORS_ORIGIN vazia', () => {
    expect(() =>
      validateEnv({ DATABASE_URL, CORS_ORIGIN: '  ', JWT_SECRET }),
    ).toThrow(/CORS_ORIGIN/);
  });

  it('rejeita a falta de JWT_SECRET', () => {
    expect(() => validateEnv({ DATABASE_URL, CORS_ORIGIN })).toThrow(
      /JWT_SECRET/,
    );
  });

  it('rejeita JWT_SECRET vazia', () => {
    expect(() =>
      validateEnv({ DATABASE_URL, CORS_ORIGIN, JWT_SECRET: '  ' }),
    ).toThrow(/JWT_SECRET/);
  });

  it('usa 28800 segundos (8 h) quando JWT_EXPIRES_IN não vem', () => {
    expect(
      validateEnv({ DATABASE_URL, CORS_ORIGIN, JWT_SECRET }).JWT_EXPIRES_IN,
    ).toBe(28800);
  });

  it('lê JWT_EXPIRES_IN como número de segundos', () => {
    expect(
      validateEnv({
        DATABASE_URL,
        CORS_ORIGIN,
        JWT_SECRET,
        JWT_EXPIRES_IN: '3600',
      }).JWT_EXPIRES_IN,
    ).toBe(3600);
  });

  it.each(['abc', '1.5', '8h', '0', '-60', ''])(
    'rejeita JWT_EXPIRES_IN que não é inteiro positivo (%j)',
    (JWT_EXPIRES_IN) => {
      expect(() =>
        validateEnv({ DATABASE_URL, CORS_ORIGIN, JWT_SECRET, JWT_EXPIRES_IN }),
      ).toThrow(/JWT_EXPIRES_IN/);
    },
  );

  it('aceita a configuração com as variáveis obrigatórias definidas', () => {
    expect(validateEnv({ DATABASE_URL, CORS_ORIGIN, JWT_SECRET })).toEqual({
      DATABASE_URL,
      CORS_ORIGIN,
      JWT_SECRET,
      JWT_EXPIRES_IN: 28800,
    });
  });
});
