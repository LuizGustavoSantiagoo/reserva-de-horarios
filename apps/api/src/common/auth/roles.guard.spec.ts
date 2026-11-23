import type { ExecutionContext } from '@nestjs/common';
import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthUser } from './auth-user.js';
import { Roles } from './roles.decorator.js';
import { RolesGuard } from './roles.guard.js';

const USER_ID = '7b0f2d4e-1c3a-4b5d-8e6f-9a0b1c2d3e4f';
const FORBIDDEN_MESSAGE = 'Seu perfil não tem acesso a esta operação.';

// `this: void`: os métodos só servem de alvo para os metadados, nunca são chamados.
class RoutesFixture {
  anyone(this: void): void {}

  @Roles('ADMIN')
  adminOnly(this: void): void {}

  @Roles('ADMIN', 'OPERATOR')
  bothRoles(this: void): void {}
}

@Roles('ADMIN')
class AdminControllerFixture {
  anyRoute(this: void): void {}
}

function contextFor(
  user: AuthUser | undefined,
  handler: () => void,
  controller: new () => unknown = RoutesFixture,
): ExecutionContext {
  return {
    getHandler: () => handler,
    getClass: () => controller,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

const admin: AuthUser = { id: USER_ID, role: 'ADMIN' };
const operator: AuthUser = { id: USER_ID, role: 'OPERATOR' };

describe('RolesGuard', () => {
  const guard = new RolesGuard(new Reflector());

  function expectForbidden(context: ExecutionContext): void {
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(context)).toThrow(FORBIDDEN_MESSAGE);
  }

  it('sem @Roles na rota, passa com qualquer papel', () => {
    expect(
      guard.canActivate(contextFor(operator, RoutesFixture.prototype.anyone)),
    ).toBe(true);
    expect(
      guard.canActivate(contextFor(admin, RoutesFixture.prototype.anyone)),
    ).toBe(true);
  });

  it('sem @Roles na rota, passa também sem request.user (rota pública)', () => {
    expect(
      guard.canActivate(contextFor(undefined, RoutesFixture.prototype.anyone)),
    ).toBe(true);
  });

  it('com o papel na lista, passa', () => {
    expect(
      guard.canActivate(contextFor(admin, RoutesFixture.prototype.adminOnly)),
    ).toBe(true);
    expect(
      guard.canActivate(
        contextFor(operator, RoutesFixture.prototype.bothRoles),
      ),
    ).toBe(true);
  });

  it('com papel fora da lista, recusa com 403 e a mensagem do CA10', () => {
    expectForbidden(contextFor(operator, RoutesFixture.prototype.adminOnly));
  });

  it('vale também quando o @Roles está na classe', () => {
    expectForbidden(
      contextFor(
        operator,
        AdminControllerFixture.prototype.anyRoute,
        AdminControllerFixture,
      ),
    );
    expect(
      guard.canActivate(
        contextFor(
          admin,
          AdminControllerFixture.prototype.anyRoute,
          AdminControllerFixture,
        ),
      ),
    ).toBe(true);
  });

  it('com @Roles e sem request.user, recusa com 403', () => {
    expectForbidden(contextFor(undefined, RoutesFixture.prototype.adminOnly));
  });
});
