import type { ExecutionContext } from '@nestjs/common';
import { currentUserFactory } from './current-user.decorator.js';

describe('@CurrentUser()', () => {
  it('devolve o request.user gravado pelo AuthGuard', () => {
    const user = { id: '7b0f2d4e-1c3a-4b5d-8e6f-9a0b1c2d3e4f', role: 'ADMIN' };
    const context = {
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    } as unknown as ExecutionContext;

    expect(currentUserFactory(undefined, context)).toBe(user);
  });
});
