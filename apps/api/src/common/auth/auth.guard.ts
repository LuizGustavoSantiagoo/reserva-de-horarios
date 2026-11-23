import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Role } from '../../../generated/prisma/enums.js';
import { AUTHENTICATION_REQUIRED } from './auth-user.js';
import type { AuthUser, AuthenticatedRequest } from './auth-user.js';
import { IS_PUBLIC_KEY } from './public.decorator.js';

const BEARER = /^Bearer (\S+)$/;
const ROLES: readonly unknown[] = Object.values(Role);

function readBearerToken(header: string | undefined): string | undefined {
  return header?.match(BEARER)?.[1];
}

function toAuthUser(payload: unknown): AuthUser | undefined {
  if (typeof payload !== 'object' || payload === null) return undefined;
  const { sub, role } = payload as Record<string, unknown>;
  if (typeof sub !== 'string' || !ROLES.includes(role)) return undefined;
  return { id: sub, role: role as Role };
}

/**
 * Guard global (APP_GUARD): toda rota exige `Authorization: Bearer <token>`, salvo as
 * marcadas com `@Public()`. Verifica assinatura (HS256, JWT_SECRET) e validade com o
 * JwtService e grava `request.user`. Não consulta o banco.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean | undefined>(
      IS_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    );
    // Rota pública não olha o cabeçalho: um token inválido não a atrapalha (CA5).
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = readBearerToken(request.headers.authorization);
    if (!token) throw new UnauthorizedException(AUTHENTICATION_REQUIRED);

    let payload: unknown;
    try {
      payload = await this.jwt.verifyAsync<object>(token);
    } catch {
      throw new UnauthorizedException(AUTHENTICATION_REQUIRED);
    }

    const user = toAuthUser(payload);
    if (!user) throw new UnauthorizedException(AUTHENTICATION_REQUIRED);

    request.user = user;
    return true;
  }
}
