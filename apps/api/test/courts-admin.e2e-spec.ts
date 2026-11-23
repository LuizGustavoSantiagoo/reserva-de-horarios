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
const FORBIDDEN_MESSAGE = 'Seu perfil não tem acesso a esta operação.';
const COURT_NAME_TAKEN = 'Já existe uma quadra com este nome.';

describe('rotas administrativas de quadra (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let admin: TestUser;
  let operator: TestUser;
  let arenaId: string;

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
    const arena = await prisma.arena.create({
      data: { name: 'Arena Central', address: 'Rua das Quadras, 100' },
    });
    arenaId = arena.id;
    await prisma.court.create({
      data: { arenaId, name: 'Quadra 1', isActive: true },
    });
    await prisma.court.create({
      data: { arenaId, name: 'Quadra Antiga', isActive: false },
    });
  });

  async function expectCourtCount(count: number): Promise<void> {
    expect(await prisma.court.count()).toBe(count);
  }

  describe('POST /courts', () => {
    function postCourt(body: unknown, authorization?: string) {
      const call = request(app.getHttpServer()).post('/courts');
      return (
        authorization ? call.set('Authorization', authorization) : call
      ).send(body as object);
    }

    function asAdmin(body: unknown) {
      return postCourt(body, `Bearer ${tokenFor(app, admin)}`);
    }

    describe('ADMIN', () => {
      it('cria a quadra → 201 com arenaId da arena e o nome sem espaços nas pontas', async () => {
        const response = await asAdmin({ name: '  Quadra Nova  ' }).expect(201);

        const body = response.body as {
          data: { id: string } & Record<string, unknown>;
        };
        expect(body).toEqual({
          data: {
            id: expect.any(String) as string,
            arenaId,
            name: 'Quadra Nova',
            isActive: true,
          },
        });
        expect(Object.keys(body.data).sort()).toEqual([
          'arenaId',
          'id',
          'isActive',
          'name',
        ]);
        const saved = await prisma.court.findUnique({
          where: { id: body.data.id },
        });
        expect(saved).toMatchObject({
          arenaId,
          name: 'Quadra Nova',
          isActive: true,
        });
      });

      it('a quadra nova aparece em GET /arena, em GET /courts e tem grade 200 sem horários', async () => {
        const created = await asAdmin({ name: 'Quadra 2' }).expect(201);
        const id = (created.body as { data: { id: string } }).data.id;

        const arena = await request(app.getHttpServer())
          .get('/arena')
          .set('Authorization', `Bearer ${tokenFor(app, operator)}`)
          .expect(200);
        expect(
          (arena.body as { data: { courts: unknown[] } }).data.courts,
        ).toContainEqual({ id, name: 'Quadra 2', isActive: true });

        const courts = await request(app.getHttpServer())
          .get('/courts')
          .expect(200);
        expect((courts.body as { data: unknown[] }).data).toContainEqual({
          id,
          name: 'Quadra 2',
        });

        const grid = await request(app.getHttpServer())
          .get(`/courts/${id}/slots`)
          .expect(200);
        expect(
          (grid.body as { data: { courtId: string; slots: unknown[] } }).data,
        ).toMatchObject({ courtId: id, slots: [] });
      });

      it.each([
        { caso: 'sem name', body: {}, fields: ['name'] },
        { caso: 'name vazio', body: { name: '' }, fields: ['name'] },
        {
          caso: 'name só com espaços',
          body: { name: '   ' },
          fields: ['name'],
        },
        {
          caso: 'name com 61 caracteres',
          body: { name: 'a'.repeat(61) },
          fields: ['name'],
        },
        { caso: 'name que não é texto', body: { name: 123 }, fields: ['name'] },
        {
          caso: 'campo não declarado arenaId',
          body: {
            name: 'Quadra 2',
            arenaId: '00000000-0000-4000-8000-000000000000',
          },
          fields: ['arenaId'],
        },
        {
          caso: 'campo não declarado isActive',
          body: { name: 'Quadra 2', isActive: false },
          fields: ['isActive'],
        },
      ])(
        'com $caso responde 400 com fields apontando cada campo, e nada é gravado',
        async ({ body, fields }) => {
          const response = await asAdmin(body).expect(400);

          const error = response.body as {
            fields?: Record<string, string[]>;
          } & Record<string, unknown>;
          expect(withoutTimestamp(error)).toMatchObject({
            statusCode: 400,
            error: 'Bad Request',
            path: '/courts',
          });
          expect(Object.keys(error.fields ?? {}).sort()).toEqual(fields);
          await expectCourtCount(2);
        },
      );

      it('com 60 caracteres depois de tirar os espaços, cria', async () => {
        const name = 'a'.repeat(60);

        const response = await asAdmin({ name: `  ${name} ` }).expect(201);

        expect((response.body as { data: { name: string } }).data.name).toBe(
          name,
        );
      });

      it.each([
        {
          caso: 'quadra ativa, com maiúsculas e espaços diferentes',
          name: '  quadra 1 ',
        },
        {
          caso: 'quadra inativa, com maiúsculas diferentes',
          name: 'QUADRA ANTIGA',
        },
      ])(
        'nome igual ao de outra $caso → 409 "Já existe uma quadra com este nome." e nada é gravado',
        async ({ name }) => {
          const response = await asAdmin({ name }).expect(409);

          expect(
            withoutTimestamp(response.body as Record<string, unknown>),
          ).toEqual({
            statusCode: 409,
            error: 'Conflict',
            message: COURT_NAME_TAKEN,
            path: '/courts',
          });
          await expectCourtCount(2);
        },
      );
    });

    describe('OPERATOR', () => {
      function expectForbidden(body: Record<string, unknown>) {
        expect(withoutTimestamp(body)).toEqual({
          statusCode: 403,
          error: 'Forbidden',
          message: FORBIDDEN_MESSAGE,
          path: '/courts',
        });
      }

      it.each([
        { caso: 'corpo válido', body: { name: 'Quadra 2' } },
        { caso: 'corpo inválido', body: { name: '', arenaId: 'x' } },
      ])(
        'com $caso recebe 403 com a mensagem da US06, sem fields, e nada é gravado',
        async ({ body }) => {
          const response = await postCourt(
            body,
            `Bearer ${tokenFor(app, operator)}`,
          ).expect(403);

          expectForbidden(response.body as Record<string, unknown>);
          expect(response.body).not.toHaveProperty('fields');
          await expectCourtCount(2);
        },
      );
    });

    describe('sem autenticação válida', () => {
      function expectAuthenticationRequired(body: Record<string, unknown>) {
        expect(withoutTimestamp(body)).toEqual({
          statusCode: 401,
          error: 'Unauthorized',
          message: AUTHENTICATION_REQUIRED,
          path: '/courts',
        });
      }

      it('sem o cabeçalho Authorization responde 401 "Autenticação necessária." e nada é gravado', async () => {
        const response = await postCourt({ name: 'Quadra 2' }).expect(401);

        expectAuthenticationRequired(response.body as Record<string, unknown>);
        await expectCourtCount(2);
      });

      it('com token inválido responde 401 com a mesma mensagem e nada é gravado', async () => {
        for (const { caso, authorization } of invalidAuthorizations(
          app,
          operator,
        )) {
          const response = await postCourt({ name: 'Quadra 2' }, authorization);

          expect(response.status, caso).toBe(401);
          expectAuthenticationRequired(
            response.body as Record<string, unknown>,
          );
        }
        await expectCourtCount(2);
      });
    });
  });
});
