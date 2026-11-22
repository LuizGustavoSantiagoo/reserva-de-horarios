import type { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
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

/**
 * Token válido pela definição da spec, assinado com o JwtService da própria app
 * (JWT_SECRET, HS256, 8 h). Os e2e que não testam o login pegam o token aqui, sem
 * gastar as tentativas do `POST /auth/login`.
 */
export function tokenFor(
  app: INestApplication,
  user: Pick<TestUser, 'id' | 'role'>,
): string {
  return app.get(JwtService).sign({ sub: user.id, role: user.role });
}

function encodeSegment(value: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');
}

function decodeSegment(segment: string): Record<string, unknown> {
  return JSON.parse(
    Buffer.from(segment, 'base64url').toString('utf8'),
  ) as Record<string, unknown>;
}

/**
 * Os quatro valores de `Authorization` que o CA5 recusa além da falta do
 * cabeçalho, montados a partir de um usuário de papel `OPERATOR`.
 */
export function invalidAuthorizations(
  app: INestApplication,
  operator: Pick<TestUser, 'id' | 'role'>,
): { caso: string; authorization: string }[] {
  const valid = tokenFor(app, operator);

  const otherSecret = new JwtService({
    secret: 'outro-segredo-que-nao-e-o-da-api',
    signOptions: { algorithm: 'HS256', expiresIn: 28800 },
  }).sign({ sub: operator.id, role: operator.role });

  // O role trocado para ADMIN, mantendo o cabeçalho e a assinatura originais.
  const [header, payload, signature] = valid.split('.');
  const tampered = [
    header,
    encodeSegment({ ...decodeSegment(payload), role: 'ADMIN' }),
    signature,
  ].join('.');

  // Emitido há 8 h e 1 min com a validade de 8 h da app: venceu há 1 minuto.
  const nowSeconds = Math.floor(Date.now() / 1000);
  const expired = app
    .get(JwtService)
    .sign({ sub: operator.id, role: operator.role, iat: nowSeconds - 28860 });

  return [
    { caso: 'valor sem Bearer', authorization: valid },
    { caso: 'token de outro segredo', authorization: `Bearer ${otherSecret}` },
    {
      caso: 'token com o role adulterado',
      authorization: `Bearer ${tampered}`,
    },
    { caso: 'token vencido', authorization: `Bearer ${expired}` },
  ];
}
