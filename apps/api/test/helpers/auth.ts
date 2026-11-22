import argon2 from 'argon2';
import type { Role } from '../../generated/prisma/enums.js';
import type { PrismaService } from '../../src/prisma/prisma.service.js';

export interface TestUser {
  id: string;
  email: string;
  role: Role;
}

/**
 * Grava um usuário do painel direto pelo Prisma, com a senha em hash argon2,
 * como o seed e o cadastro fazem. O e-mail deve vir já normalizado.
 */
export async function createUser(
  prisma: PrismaService,
  user: { email: string; password: string; role: Role },
): Promise<TestUser> {
  return prisma.adminUser.create({
    data: {
      email: user.email,
      passwordHash: await argon2.hash(user.password),
      role: user.role,
    },
    select: { id: true, email: true, role: true },
  });
}
