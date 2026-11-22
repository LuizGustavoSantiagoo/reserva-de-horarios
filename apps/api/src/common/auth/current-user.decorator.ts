import { createParamDecorator } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import type { AuthenticatedRequest, AuthUser } from './auth-user.js';

/** Exportada só para o teste unitário; nas rotas, use `@CurrentUser()`. */
export function currentUserFactory(
  _data: unknown,
  context: ExecutionContext,
): AuthUser | undefined {
  return context.switchToHttp().getRequest<AuthenticatedRequest>().user;
}

/** O usuário do token (`{ id, role }`), gravado pelo AuthGuard numa rota protegida. */
export const CurrentUser = createParamDecorator(currentUserFactory);
