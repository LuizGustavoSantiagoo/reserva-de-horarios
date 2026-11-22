import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { createUser, invalidAuthorizations, tokenFor } from './helpers/auth.js';
import type { TestUser } from './helpers/auth.js';
import { resetDatabase } from './helpers/db.js';

const PASSWORD = 'senha-certa-123';
const AUTHENTICATION_REQUIRED = 'Autenticação necessária.';

function withoutTimestamp(body: Record<string, unknown>) {
  const { timestamp, ...rest } = body;
  expect(typeof timestamp).toBe('string');
  return rest;
}

describe('GET /users/me (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let admin: TestUser;
  let operator: TestUser;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app?.close();
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    admin = await createUser(prisma, {
      email: 'ana@arena.com',
      password: PASSWORD,
      role: 'ADMIN',
    });
    operator = await createUser(prisma, {
      email: 'bruno@arena.com',
      password: PASSWORD,
      role: 'OPERATOR',
    });
  });

  function getMe(authorization?: string) {
    const call = request(app.getHttpServer()).get('/users/me');
    return authorization ? call.set('Authorization', authorization) : call;
  }

  /** Nenhuma resposta leva a senha nem o hash dela. */
  async function expectNoSecrets(body: unknown): Promise<void> {
    const text = JSON.stringify(body);
    expect(text).not.toContain(PASSWORD);
    expect(text).not.toContain('passwordHash');
    const hashes = await prisma.adminUser.findMany({
      select: { passwordHash: true },
    });
    for (const { passwordHash } of hashes) {
      expect(text).not.toContain(passwordHash);
    }
  }

  describe('sem autenticação válida', () => {
    function expectAuthenticationRequired(body: Record<string, unknown>) {
      expect(withoutTimestamp(body)).toEqual({
        statusCode: 401,
        error: 'Unauthorized',
        message: AUTHENTICATION_REQUIRED,
        path: '/users/me',
      });
    }

    it('sem o cabeçalho Authorization responde 401 "Autenticação necessária."', async () => {
      const response = await getMe().expect(401);

      expectAuthenticationRequired(response.body as Record<string, unknown>);
    });

    it('os quatro valores inválidos respondem 401 com a mesma mensagem', async () => {
      const cases = invalidAuthorizations(app, operator);
      expect(cases.map(({ caso }) => caso)).toEqual([
        'valor sem Bearer',
        'token de outro segredo',
        'token com o role adulterado',
        'token vencido',
      ]);

      for (const { caso, authorization } of cases) {
        const response = await getMe(authorization);

        expect(response.status, caso).toBe(401);
        expectAuthenticationRequired(response.body as Record<string, unknown>);
        expect(JSON.stringify(response.body)).not.toContain(operator.email);
      }
    });

    it('token válido de um usuário que não existe mais responde 401 com a mesma mensagem', async () => {
      const token = tokenFor(app, operator);
      await prisma.adminUser.delete({ where: { id: operator.id } });

      const response = await getMe(`Bearer ${token}`).expect(401);

      expectAuthenticationRequired(response.body as Record<string, unknown>);
    });
  });

  describe('com token válido', () => {
    it.each([
      { papel: 'ADMIN', user: () => admin },
      { papel: 'OPERATOR', user: () => operator },
    ])(
      '$papel recebe 200 com { data: { id, email, role } } do dono do token, e nada além',
      async ({ user }) => {
        const { id, email, role } = user();

        const response = await getMe(`Bearer ${tokenFor(app, user())}`).expect(
          200,
        );

        expect(response.body).toEqual({ data: { id, email, role } });
        expect(
          Object.keys((response.body as { data: object }).data).sort(),
        ).toEqual(['email', 'id', 'role']);
        await expectNoSecrets(response.body);
      },
    );
  });
});
