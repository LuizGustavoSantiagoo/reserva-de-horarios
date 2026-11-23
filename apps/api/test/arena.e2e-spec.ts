import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { createUser, invalidAuthorizations, tokenFor } from './helpers/auth.js';
import type { TestUser } from './helpers/auth.js';
import { resetDatabase } from './helpers/db.js';
import { withoutTimestamp } from './helpers/error-body.js';

const PASSWORD = 'senha-certa-123';
const AUTHENTICATION_REQUIRED = 'Autenticação necessária.';

describe('GET /arena (e2e)', () => {
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

  function getArena(authorization?: string) {
    const call = request(app.getHttpServer()).get('/arena');
    return authorization ? call.set('Authorization', authorization) : call;
  }

  /** A arena única com três quadras gravadas fora da ordem, uma delas inativa. */
  async function seedArena() {
    const arena = await prisma.arena.create({
      data: { name: 'Arena Central', address: 'Rua das Quadras, 100' },
    });
    const courtC = await prisma.court.create({
      data: { arenaId: arena.id, name: 'Quadra C', isActive: true },
    });
    const courtA = await prisma.court.create({
      data: { arenaId: arena.id, name: 'Quadra A', isActive: false },
    });
    const courtB = await prisma.court.create({
      data: { arenaId: arena.id, name: 'Quadra B', isActive: true },
    });
    return { arena, courtA, courtB, courtC };
  }

  describe('com token válido', () => {
    it.each([
      { papel: 'ADMIN', user: () => admin },
      { papel: 'OPERATOR', user: () => operator },
    ])(
      '$papel recebe 200 com a arena e todas as quadras (ativas e inativas), por nome, só com id, name e isActive',
      async ({ user }) => {
        const { arena, courtA, courtB, courtC } = await seedArena();

        const response = await getArena(
          `Bearer ${tokenFor(app, user())}`,
        ).expect(200);

        expect(response.body).toEqual({
          data: {
            id: arena.id,
            name: 'Arena Central',
            address: 'Rua das Quadras, 100',
            courts: [
              { id: courtA.id, name: 'Quadra A', isActive: false },
              { id: courtB.id, name: 'Quadra B', isActive: true },
              { id: courtC.id, name: 'Quadra C', isActive: true },
            ],
          },
        });
        const body = response.body as {
          data: { courts: Record<string, unknown>[] } & Record<string, unknown>;
        };
        expect(Object.keys(body.data).sort()).toEqual([
          'address',
          'courts',
          'id',
          'name',
        ]);
        for (const court of body.data.courts) {
          expect(Object.keys(court).sort()).toEqual(['id', 'isActive', 'name']);
        }
      },
    );

    it('arena sem quadras responde 200 com a lista vazia', async () => {
      const arena = await prisma.arena.create({
        data: { name: 'Arena Central', address: 'Rua das Quadras, 100' },
      });

      const response = await getArena(`Bearer ${tokenFor(app, admin)}`).expect(
        200,
      );

      expect(response.body).toEqual({
        data: {
          id: arena.id,
          name: 'Arena Central',
          address: 'Rua das Quadras, 100',
          courts: [],
        },
      });
    });

    it('sem arena (seed não rodou) responde 404 "arena não encontrada"', async () => {
      const response = await getArena(`Bearer ${tokenFor(app, admin)}`).expect(
        404,
      );

      expect(
        withoutTimestamp(response.body as Record<string, unknown>),
      ).toEqual({
        statusCode: 404,
        error: 'Not Found',
        message: 'arena não encontrada',
        path: '/arena',
      });
    });
  });

  describe('sem autenticação válida', () => {
    function expectAuthenticationRequired(body: Record<string, unknown>) {
      expect(withoutTimestamp(body)).toEqual({
        statusCode: 401,
        error: 'Unauthorized',
        message: AUTHENTICATION_REQUIRED,
        path: '/arena',
      });
    }

    it('sem o cabeçalho Authorization responde 401 "Autenticação necessária.", sem dado da arena', async () => {
      await seedArena();

      const response = await getArena().expect(401);

      expectAuthenticationRequired(response.body as Record<string, unknown>);
      expect(JSON.stringify(response.body)).not.toContain('Arena Central');
    });

    it('com token inválido responde 401 com a mesma mensagem, sem dado da arena', async () => {
      await seedArena();

      for (const { caso, authorization } of invalidAuthorizations(
        app,
        operator,
      )) {
        const response = await getArena(authorization);

        expect(response.status, caso).toBe(401);
        expectAuthenticationRequired(response.body as Record<string, unknown>);
        expect(JSON.stringify(response.body)).not.toContain('Arena Central');
      }
    });
  });
});
