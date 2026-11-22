import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { Role } from '../../generated/prisma/enums.js';
import { AUTHENTICATION_REQUIRED } from '../common/auth/auth-user.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { UserDto } from './dto/user.dto.js';

/** O que o login precisa para conferir a senha. Nunca sai por uma rota. */
export interface UserCredentials {
  id: string;
  role: Role;
  passwordHash: string;
}

// Toda consulta de perfil seleciona só estes campos: a senha e o hash nunca saem.
const PROFILE_SELECT = { id: true, email: true, role: true } as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Único método que lê o `passwordHash`. O e-mail chega já normalizado
   * (sem espaços nas pontas e em minúsculas), como é gravado.
   */
  findCredentialsByEmail(email: string): Promise<UserCredentials | null> {
    return this.prisma.adminUser.findUnique({
      where: { email },
      select: { id: true, role: true, passwordHash: true },
    });
  }

  /**
   * O perfil do dono do token. Um token válido cujo `sub` não existe mais no banco
   * é recusado como os demais tokens inválidos.
   */
  async findMe(userId: string): Promise<UserDto> {
    const user = await this.prisma.adminUser.findUnique({
      where: { id: userId },
      select: PROFILE_SELECT,
    });
    if (!user) throw new UnauthorizedException(AUTHENTICATION_REQUIRED);
    return user;
  }
}
