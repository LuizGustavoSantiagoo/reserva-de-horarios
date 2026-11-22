import type { Request } from 'express';
import type { Role } from '../../../generated/prisma/enums.js';

/** Quem fez a requisição, lido do token pelo AuthGuard: o `sub` vira `id`. */
export interface AuthUser {
  id: string;
  role: Role;
}

/** A requisição depois do AuthGuard: em rota protegida, `user` está sempre presente. */
export type AuthenticatedRequest = Request & { user?: AuthUser };

/** A mesma recusa para todo token ausente ou inválido (CA5). */
export const AUTHENTICATION_REQUIRED = 'Autenticação necessária.';
