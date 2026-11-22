import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import argon2 from 'argon2';
import { Prisma } from '../../generated/prisma/client.js';
import { Role } from '../../generated/prisma/enums.js';
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

// O mesmo texto que a tela de cadastro mostra embaixo do campo de e-mail (CA17).
const EMAIL_TAKEN = 'Já existe uma conta com este e-mail.';

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
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

  /**
   * Cadastra um usuário do painel, sempre com o papel OPERATOR (nunca lido do corpo).
   * O e-mail chega já normalizado; o índice único do banco é quem garante o 409,
   * sem checagem prévia. Guarda só o hash argon2 da senha.
   */
  async createOperator(email: string, password: string): Promise<UserDto> {
    const passwordHash = await argon2.hash(password);
    try {
      return await this.prisma.adminUser.create({
        data: { email, passwordHash, role: Role.OPERATOR },
        select: PROFILE_SELECT,
      });
    } catch (error) {
      if (isUniqueViolation(error)) throw new ConflictException(EMAIL_TAKEN);
      throw error;
    }
  }
}
