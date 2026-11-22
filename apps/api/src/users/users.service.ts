import { Injectable } from '@nestjs/common';
import type { Role } from '../../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';

/** O que o login precisa para conferir a senha. Nunca sai por uma rota. */
export interface UserCredentials {
  id: string;
  role: Role;
  passwordHash: string;
}

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
}
