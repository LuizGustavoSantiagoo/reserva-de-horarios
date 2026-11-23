import type { ExecutionContext } from '@nestjs/common';
import { UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from './auth.guard.js';
import type { AuthenticatedRequest } from './auth-user.js';
import { Public } from './public.decorator.js';

const SECRET = 'segredo-do-teste';
const USER_ID = '7b0f2d4e-1c3a-4b5d-8e6f-9a0b1c2d3e4f';

// `this: void`: os métodos só servem de alvo para os metadados, nunca são chamados.
class RoutesFixture {
  @Public()
  open(this: void): void {}

  closed(this: void): void {}
}

@Public()
class PublicControllerFixture {
  anyRoute(this: void): void {}
}

function contextFor(
  request: Partial<AuthenticatedRequest>,
  handler: () => void,
  controller: new () => unknown,
): ExecutionContext {
  return {
    getHandler: () => handler,
    getClass: () => controller,
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

function requestWith(authorization?: string): Partial<AuthenticatedRequest> {
  return {
    headers: authorization === undefined ? {} : { authorization },
  } as Partial<AuthenticatedRequest>;
}

describe('AuthGuard', () => {
  const jwt = new JwtService({
    secret: SECRET,
    signOptions: { algorithm: 'HS256', expiresIn: 28800 },
    verifyOptions: { algorithms: ['HS256'] },
  });
  const guard = new AuthGuard(jwt, new Reflector());
  const closed = RoutesFixture.prototype.closed;

  async function expectRejected(request: Partial<AuthenticatedRequest>) {
    const result = guard.canActivate(
      contextFor(request, closed, RoutesFixture),
    );
    await expect(result).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(result).rejects.toThrow('Autenticação necessária.');
    expect(request.user).toBeUndefined();
  }

  describe('rota com @Public()', () => {
    it('passa sem cabeçalho', async () => {
      const request = requestWith();

      await expect(
        guard.canActivate(
          contextFor(request, RoutesFixture.prototype.open, RoutesFixture),
        ),
      ).resolves.toBe(true);
    });

    it('passa com um token inválido, sem olhar o cabeçalho', async () => {
      const request = requestWith('Bearer nao-e-um-jwt');

      await expect(
        guard.canActivate(
          contextFor(request, RoutesFixture.prototype.open, RoutesFixture),
        ),
      ).resolves.toBe(true);
      expect(request.user).toBeUndefined();
    });

    it('vale também quando o @Public() está na classe', async () => {
      await expect(
        guard.canActivate(
          contextFor(
            requestWith(),
            PublicControllerFixture.prototype.anyRoute,
            PublicControllerFixture,
          ),
        ),
      ).resolves.toBe(true);
    });
  });

  describe('rota protegida', () => {
    it('com token válido passa e grava request.user só com id e role', async () => {
      const token = jwt.sign({ sub: USER_ID, role: 'OPERATOR' });
      const request = requestWith(`Bearer ${token}`);

      await expect(
        guard.canActivate(contextFor(request, closed, RoutesFixture)),
      ).resolves.toBe(true);
      expect(request.user).toEqual({ id: USER_ID, role: 'OPERATOR' });
    });

    it('sem cabeçalho recusa', async () => {
      await expectRejected(requestWith());
    });

    it.each([
      [
        'o token sem o prefixo',
        () => jwt.sign({ sub: USER_ID, role: 'ADMIN' }),
      ],
      ['outro esquema', () => 'Basic dXN1YXJpbzpzZW5oYQ=='],
      ['só a palavra Bearer', () => 'Bearer'],
      [
        'Bearer em minúsculas',
        () => `bearer ${jwt.sign({ sub: USER_ID, role: 'ADMIN' })}`,
      ],
    ])('com %s recusa', async (_caso, authorization) => {
      await expectRejected(requestWith(authorization()));
    });

    it('com token de outro segredo recusa', async () => {
      const other = new JwtService({ secret: 'outro-segredo' }).sign({
        sub: USER_ID,
        role: 'ADMIN',
      });

      await expectRejected(requestWith(`Bearer ${other}`));
    });

    it('com token vencido recusa', async () => {
      const iat = Math.floor(Date.now() / 1000) - 28860;
      const expired = jwt.sign({ sub: USER_ID, role: 'ADMIN', iat });

      await expectRejected(requestWith(`Bearer ${expired}`));
    });

    it('com token assinado por outro algoritmo recusa', async () => {
      const hs512 = jwt.sign(
        { sub: USER_ID, role: 'ADMIN' },
        { algorithm: 'HS512' },
      );

      await expectRejected(requestWith(`Bearer ${hs512}`));
    });

    it.each([
      ['sem sub', { role: 'ADMIN' }],
      ['com sub que não é texto', { sub: 42, role: 'ADMIN' }],
      ['sem role', { sub: USER_ID }],
      ['com role fora do enum', { sub: USER_ID, role: 'SUPERUSER' }],
    ])('com token bem assinado mas %s recusa', async (_caso, payload) => {
      await expectRejected(requestWith(`Bearer ${jwt.sign(payload)}`));
    });
  });
});
