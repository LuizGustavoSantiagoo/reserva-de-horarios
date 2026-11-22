import { readAdminSeedInput } from './admin-seed.ts';

const email = 'admin@exemplo.com';
const password = 'senha-de-teste';

describe('readAdminSeedInput', () => {
  it('rejeita a falta de ADMIN_EMAIL', () => {
    expect(() => readAdminSeedInput({ password })).toThrow(/ADMIN_EMAIL/);
  });

  it('rejeita ADMIN_EMAIL vazia', () => {
    expect(() => readAdminSeedInput({ email: '  ', password })).toThrow(
      /ADMIN_EMAIL/,
    );
  });

  it('rejeita a falta de ADMIN_PASSWORD', () => {
    expect(() => readAdminSeedInput({ email })).toThrow(/ADMIN_PASSWORD/);
  });

  it('rejeita ADMIN_PASSWORD vazia', () => {
    expect(() => readAdminSeedInput({ email, password: '' })).toThrow(
      /ADMIN_PASSWORD/,
    );
  });

  it('rejeita ADMIN_PASSWORD com 7 caracteres', () => {
    expect(() => readAdminSeedInput({ email, password: '1234567' })).toThrow(
      /ADMIN_PASSWORD/,
    );
  });

  it('aceita ADMIN_PASSWORD com 8 caracteres', () => {
    expect(readAdminSeedInput({ email, password: '12345678' }).password).toBe(
      '12345678',
    );
  });

  it('normaliza o e-mail: sem espaços nas pontas e em minúsculas', () => {
    expect(
      readAdminSeedInput({ email: '  Admin@Exemplo.COM ', password }),
    ).toEqual({ email: 'admin@exemplo.com', password });
  });
});
