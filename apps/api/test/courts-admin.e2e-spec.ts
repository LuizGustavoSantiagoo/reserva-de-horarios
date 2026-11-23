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
  let activeId: string;
  let inactiveId: string;

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
    activeId = (
      await prisma.court.create({
        data: { arenaId, name: 'Quadra 1', isActive: true },
      })
    ).id;
    inactiveId = (
      await prisma.court.create({
        data: { arenaId, name: 'Quadra Antiga', isActive: false },
      })
    ).id;
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

  describe('PATCH /courts/:id', () => {
    // UUID bem formado que não pertence a nenhuma quadra.
    const MISSING_ID = '00000000-0000-4000-8000-000000000000';

    function patchCourt(id: string, body: unknown, authorization?: string) {
      const call = request(app.getHttpServer()).patch(`/courts/${id}`);
      return (
        authorization ? call.set('Authorization', authorization) : call
      ).send(body as object);
    }

    function asAdmin(id: string, body: unknown) {
      return patchCourt(id, body, `Bearer ${tokenFor(app, admin)}`);
    }

    async function expectNames(names: Record<string, string>): Promise<void> {
      for (const [id, name] of Object.entries(names)) {
        const court = await prisma.court.findUnique({ where: { id } });
        expect(court?.name).toBe(name);
      }
    }

    describe('ADMIN', () => {
      it('renomeia a quadra ativa → 200 com o nome novo, isActive inalterado, visível em GET /arena e GET /courts', async () => {
        const response = await asAdmin(activeId, {
          name: '  Quadra Central ',
        }).expect(200);

        expect(response.body).toEqual({
          data: { id: activeId, name: 'Quadra Central', isActive: true },
        });

        const arena = await request(app.getHttpServer())
          .get('/arena')
          .set('Authorization', `Bearer ${tokenFor(app, operator)}`)
          .expect(200);
        expect(
          (arena.body as { data: { courts: unknown[] } }).data.courts,
        ).toContainEqual({
          id: activeId,
          name: 'Quadra Central',
          isActive: true,
        });

        const courts = await request(app.getHttpServer())
          .get('/courts')
          .expect(200);
        expect((courts.body as { data: unknown[] }).data).toContainEqual({
          id: activeId,
          name: 'Quadra Central',
        });
      });

      it('renomeia a quadra inativa → 200 e ela continua inativa (aparece em GET /arena, não em GET /courts)', async () => {
        const response = await asAdmin(inactiveId, {
          name: 'Quadra Reformada',
        }).expect(200);

        expect(response.body).toEqual({
          data: { id: inactiveId, name: 'Quadra Reformada', isActive: false },
        });
        const arena = await request(app.getHttpServer())
          .get('/arena')
          .set('Authorization', `Bearer ${tokenFor(app, admin)}`)
          .expect(200);
        expect(
          (arena.body as { data: { courts: unknown[] } }).data.courts,
        ).toContainEqual({
          id: inactiveId,
          name: 'Quadra Reformada',
          isActive: false,
        });
        const courts = await request(app.getHttpServer())
          .get('/courts')
          .expect(200);
        expect(
          (courts.body as { data: { id: string }[] }).data.map((c) => c.id),
        ).not.toContain(inactiveId);
      });

      it('renomear para o próprio nome trocando maiúsculas e espaços → 200, não é conflito', async () => {
        const response = await asAdmin(activeId, {
          name: '  QUADRA 1 ',
        }).expect(200);

        expect(response.body).toEqual({
          data: { id: activeId, name: 'QUADRA 1', isActive: true },
        });
      });

      it.each([
        {
          caso: 'quadra ativa, com maiúsculas e espaços diferentes',
          id: () => inactiveId,
          name: '  quadra 1 ',
        },
        {
          caso: 'quadra inativa, com maiúsculas diferentes',
          id: () => activeId,
          name: 'QUADRA ANTIGA',
        },
      ])(
        'nome igual ao de outra $caso → 409 "Já existe uma quadra com este nome." e nada muda',
        async ({ id, name }) => {
          const response = await asAdmin(id(), { name }).expect(409);

          expect(
            withoutTimestamp(response.body as Record<string, unknown>),
          ).toEqual({
            statusCode: 409,
            error: 'Conflict',
            message: COURT_NAME_TAKEN,
            path: `/courts/${id()}`,
          });
          await expectNames({
            [activeId]: 'Quadra 1',
            [inactiveId]: 'Quadra Antiga',
          });
        },
      );

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
          caso: 'campo não declarado isActive',
          body: { name: 'Quadra 2', isActive: false },
          fields: ['isActive'],
        },
      ])(
        'com $caso responde 400 com fields apontando cada campo, e nada muda',
        async ({ body, fields }) => {
          const response = await asAdmin(activeId, body).expect(400);

          const error = response.body as {
            fields?: Record<string, string[]>;
          } & Record<string, unknown>;
          expect(withoutTimestamp(error)).toMatchObject({
            statusCode: 400,
            error: 'Bad Request',
            path: `/courts/${activeId}`,
          });
          expect(Object.keys(error.fields ?? {}).sort()).toEqual(fields);
          await expectNames({ [activeId]: 'Quadra 1' });
          expect(
            (await prisma.court.findUnique({ where: { id: activeId } }))
              ?.isActive,
          ).toBe(true);
        },
      );

      it('com id que não existe → 404 "quadra não encontrada"', async () => {
        const response = await asAdmin(MISSING_ID, {
          name: 'Quadra 2',
        }).expect(404);

        expect(
          withoutTimestamp(response.body as Record<string, unknown>),
        ).toEqual({
          statusCode: 404,
          error: 'Not Found',
          message: 'quadra não encontrada',
          path: `/courts/${MISSING_ID}`,
        });
        await expectCourtCount(2);
      });

      it('com id que não é UUID → 400 com fields.id e nada muda', async () => {
        const response = await asAdmin('nao-e-uuid', {
          name: 'Quadra 2',
        }).expect(400);

        const error = response.body as {
          fields?: Record<string, string[]>;
        } & Record<string, unknown>;
        expect(withoutTimestamp(error)).toMatchObject({
          statusCode: 400,
          error: 'Bad Request',
          path: '/courts/nao-e-uuid',
        });
        expect(error.fields).toEqual({
          id: ['Informe um id de quadra válido (UUID).'],
        });
        await expectNames({
          [activeId]: 'Quadra 1',
          [inactiveId]: 'Quadra Antiga',
        });
      });
    });

    describe('OPERATOR', () => {
      it.each([
        {
          caso: 'corpo válido',
          id: () => activeId,
          body: { name: 'Quadra 2' },
        },
        { caso: 'corpo inválido', id: () => activeId, body: { name: '' } },
        {
          caso: 'id inexistente',
          id: () => MISSING_ID,
          body: { name: 'Quadra 2' },
        },
      ])(
        'com $caso recebe 403 com a mensagem da US06, sem fields, e nada muda',
        async ({ id, body }) => {
          const response = await patchCourt(
            id(),
            body,
            `Bearer ${tokenFor(app, operator)}`,
          ).expect(403);

          expect(
            withoutTimestamp(response.body as Record<string, unknown>),
          ).toEqual({
            statusCode: 403,
            error: 'Forbidden',
            message: FORBIDDEN_MESSAGE,
            path: `/courts/${id()}`,
          });
          await expectNames({ [activeId]: 'Quadra 1' });
        },
      );
    });

    describe('sem autenticação válida', () => {
      function expectAuthenticationRequired(body: Record<string, unknown>) {
        expect(withoutTimestamp(body)).toEqual({
          statusCode: 401,
          error: 'Unauthorized',
          message: AUTHENTICATION_REQUIRED,
          path: `/courts/${activeId}`,
        });
      }

      it('sem o cabeçalho Authorization responde 401 "Autenticação necessária." e nada muda', async () => {
        const response = await patchCourt(activeId, {
          name: 'Quadra 2',
        }).expect(401);

        expectAuthenticationRequired(response.body as Record<string, unknown>);
        await expectNames({ [activeId]: 'Quadra 1' });
      });

      it('com token inválido responde 401 com a mesma mensagem e nada muda', async () => {
        for (const { caso, authorization } of invalidAuthorizations(
          app,
          operator,
        )) {
          const response = await patchCourt(
            activeId,
            { name: 'Quadra 2' },
            authorization,
          );

          expect(response.status, caso).toBe(401);
          expectAuthenticationRequired(
            response.body as Record<string, unknown>,
          );
        }
        await expectNames({ [activeId]: 'Quadra 1' });
      });
    });
  });
});
