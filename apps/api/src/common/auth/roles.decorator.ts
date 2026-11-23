import { SetMetadata } from '@nestjs/common';
import type { Role } from '../../../generated/prisma/enums.js';

export const ROLES_KEY = 'roles';

/**
 * Restringe a rota (ou o controller inteiro) aos papéis listados: o RolesGuard global
 * recusa com 403 quem tem outro papel. Sem esta marca, qualquer usuário autenticado passa.
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
