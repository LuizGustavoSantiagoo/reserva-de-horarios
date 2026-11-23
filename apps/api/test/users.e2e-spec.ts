import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import argon2 from 'argon2';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { createUser, invalidAuthorizations, tokenFor } from './helpers/auth.js';
import type { TestUser } from './helpers/auth.js';
import { resetDatabase } from './helpers/db.js';
import { withoutTimestamp } from './helpers/error-body.js';

const PASSWORD = 'senha-certa-123';
const NEW_PASSWORD = 'senha-do-operador';
const AUTHENTICATION_REQUIRED = 'Autenticação necessária.';
const FORBIDDEN_MESSAGE = 'Seu perfil não tem acesso a esta operação.';
const EMAIL_TAKEN = 'Já existe uma conta com este e-mail.';

describe('rotas de usuário (e2e)', () => {
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

  /** Nenhuma resposta leva a senha nem o hash dela. */
  async function expectNoSecrets(body: unknown): Promise<void> {
    const text = JSON.stringify(body);
    expect(text).not.toContain(PASSWORD);
    expect(text).not.toContain(NEW_PASSWORD);
    expect(text).not.toContain('passwordHash');
    const hashes = await prisma.adminUser.findMany({
      select: { passwordHash: true },
    });
    for (const { passwordHash } of hashes) {
      expect(text).not.toContain(passwordHash);
    }
  }

  describe('GET /users/me', () => {
    function getMe(authorization?: string) {
      const call = request(app.getHttpServer()).get('/users/me');
      return authorization ? call.set('Authorization', authorization) : call;
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
          expectAuthenticationRequired(
            response.body as Record<string, unknown>,
          );
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

          const response = await getMe(
            `Bearer ${tokenFor(app, user())}`,
          ).expect(200);

          expect(response.body).toEqual({ data: { id, email, role } });
          expect(
            Object.keys((response.body as { data: object }).data).sort(),
          ).toEqual(['email', 'id', 'role']);
          await expectNoSecrets(response.body);
        },
      );
    });
  });

  describe('POST /users', () => {
    function postUser(user: TestUser | undefined, body: object) {
      const call = request(app.getHttpServer()).post('/users').send(body);
      return user
        ? call.set('Authorization', `Bearer ${tokenFor(app, user)}`)
        : call;
    }

    async function expectUserCount(count: number): Promise<void> {
      expect(await prisma.adminUser.count()).toBe(count);
    }

    describe('ADMIN', () => {
      it('cadastra um OPERATOR: 201 com { data: { id, email, role } }, e-mail normalizado, sem a senha nem o hash', async () => {
        const response = await postUser(admin, {
          email: '  Carla@Arena.COM ',
          password: NEW_PASSWORD,
        }).expect(201);

        const body = response.body as { data: Record<string, unknown> };
        expect(body).toEqual({
          data: {
            id: expect.any(String) as string,
            email: 'carla@arena.com',
            role: 'OPERATOR',
          },
        });
        expect(Object.keys(body.data).sort()).toEqual(['email', 'id', 'role']);
        await expectNoSecrets(response.body);

        const saved = await prisma.adminUser.findUniqueOrThrow({
          where: { id: body.data.id as string },
        });
        expect(saved.email).toBe('carla@arena.com');
        expect(saved.role).toBe('OPERATOR');
        expect(saved.passwordHash).not.toBe(NEW_PASSWORD);
        expect(saved.passwordHash.startsWith('$argon2')).toBe(true);
        await expect(
          argon2.verify(saved.passwordHash, NEW_PASSWORD),
        ).resolves.toBe(true);
        await expectUserCount(3);
      });

      it('o operador cadastrado entra pelo POST /auth/login', async () => {
        const created = await postUser(admin, {
          email: 'carla@arena.com',
          password: NEW_PASSWORD,
        }).expect(201);
        const { id } = (created.body as { data: { id: string } }).data;

        const login = await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: 'carla@arena.com', password: NEW_PASSWORD })
          .expect(200);

        const { accessToken } = (
          login.body as { data: { accessToken: string } }
        ).data;
        const me = await request(app.getHttpServer())
          .get('/users/me')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);
        expect(me.body).toEqual({
          data: { id, email: 'carla@arena.com', role: 'OPERATOR' },
        });
      });

      it.each([
        {
          caso: 'e-mail mal formado',
          body: { email: 'carla-arena.com', password: NEW_PASSWORD },
          fields: ['email'],
        },
        {
          caso: 'senha de 7 caracteres',
          body: { email: 'carla@arena.com', password: '1234567' },
          fields: ['password'],
        },
        {
          caso: 'senha faltando',
          body: { email: 'carla@arena.com' },
          fields: ['password'],
        },
        {
          caso: 'e-mail faltando',
          body: { password: NEW_PASSWORD },
          fields: ['email'],
        },
        {
          caso: 'corpo vazio',
          body: {},
          fields: ['email', 'password'],
        },
        {
          caso: 'campo não declarado "role": "ADMIN"',
          body: {
            email: 'carla@arena.com',
            password: NEW_PASSWORD,
            role: 'ADMIN',
          },
          fields: ['role'],
        },
      ])(
        'com $caso responde 400 com fields apontando cada campo, e não grava',
        async ({ body, fields }) => {
          const response = await postUser(admin, body).expect(400);

          const error = response.body as {
            fields?: Record<string, string[]>;
          } & Record<string, unknown>;
          expect(withoutTimestamp(error)).toMatchObject({
            statusCode: 400,
            error: 'Bad Request',
            path: '/users',
          });
          expect(Object.keys(error.fields ?? {}).sort()).toEqual(fields);
          await expectNoSecrets(response.body);
          await expectUserCount(2);
        },
      );

      it('com e-mail já cadastrado, mesmo com maiúsculas e espaços, responde 409 e não grava', async () => {
        const response = await postUser(admin, {
          email: '  BRUNO@Arena.com ',
          password: NEW_PASSWORD,
        }).expect(409);

        expect(
          withoutTimestamp(response.body as Record<string, unknown>),
        ).toEqual({
          statusCode: 409,
          error: 'Conflict',
          message: EMAIL_TAKEN,
          path: '/users',
        });
        await expectUserCount(2);
      });
    });

    describe('OPERATOR', () => {
      function expectForbidden(body: Record<string, unknown>) {
        expect(withoutTimestamp(body)).toEqual({
          statusCode: 403,
          error: 'Forbidden',
          message: FORBIDDEN_MESSAGE,
          path: '/users',
        });
        const text = JSON.stringify(body);
        for (const user of [admin, operator]) {
          expect(text).not.toContain(user.email);
          expect(text).not.toContain(user.id);
        }
      }

      it('recebe 403 com a mensagem do CA10, sem dado de usuário, e nada é gravado', async () => {
        const response = await postUser(operator, {
          email: 'carla@arena.com',
          password: NEW_PASSWORD,
        }).expect(403);

        expectForbidden(response.body as Record<string, unknown>);
        expect(JSON.stringify(response.body)).not.toContain('carla');
        await expectUserCount(2);
      });

      it('recebe 403 antes da validação do corpo: corpo inválido não vira 400', async () => {
        const response = await postUser(operator, {
          email: 'nao-e-email',
          role: 'ADMIN',
        }).expect(403);

        expectForbidden(response.body as Record<string, unknown>);
        expect(response.body).not.toHaveProperty('fields');
        await expectUserCount(2);
      });

      it('com e-mail já cadastrado recebe 403, e não 409: não descobre que a conta existe', async () => {
        const response = await postUser(operator, {
          email: 'ana@arena.com',
          password: NEW_PASSWORD,
        }).expect(403);

        expectForbidden(response.body as Record<string, unknown>);
        await expectUserCount(2);
      });
    });

    it('sem token responde 401 "Autenticação necessária." e não grava', async () => {
      const response = await postUser(undefined, {
        email: 'carla@arena.com',
        password: NEW_PASSWORD,
      }).expect(401);

      expect(
        withoutTimestamp(response.body as Record<string, unknown>),
      ).toEqual({
        statusCode: 401,
        error: 'Unauthorized',
        message: AUTHENTICATION_REQUIRED,
        path: '/users',
      });
      await expectUserCount(2);
    });
  });

  /** Chama uma rota GET com o token do usuário, ou sem token. */
  function getAs(path: string, user?: TestUser) {
    const call = request(app.getHttpServer()).get(path);
    return user
      ? call.set('Authorization', `Bearer ${tokenFor(app, user)}`)
      : call;
  }

  /**
   * O 403 do CA10, no formato único de erro e sem dado de usuário. O `path` ecoa a
   * URL pedida (que pode levar um id), por isso só os e-mails são procurados no corpo.
   */
  function expectForbiddenWithoutUserData(
    body: Record<string, unknown>,
    path: string,
  ) {
    expect(withoutTimestamp(body)).toEqual({
      statusCode: 403,
      error: 'Forbidden',
      message: FORBIDDEN_MESSAGE,
      path,
    });
    const text = JSON.stringify(body);
    for (const user of [admin, operator]) {
      expect(text).not.toContain(user.email);
    }
  }

  describe('GET /users', () => {
    it('ADMIN recebe 200 com todos os usuários, ordenados por e-mail, só com id, email e role', async () => {
      // Gravado fora da ordem alfabética: a ordem da resposta vem do e-mail.
      const aaron = await createUser(prisma, {
        email: 'aaron@arena.com',
        password: PASSWORD,
        role: 'OPERATOR',
      });

      const response = await getAs('/users', admin).expect(200);

      const body = response.body as { data: Record<string, unknown>[] };
      expect(body).toEqual({
        data: [
          { id: aaron.id, email: 'aaron@arena.com', role: 'OPERATOR' },
          { id: admin.id, email: 'ana@arena.com', role: 'ADMIN' },
          { id: operator.id, email: 'bruno@arena.com', role: 'OPERATOR' },
        ],
      });
      for (const user of body.data) {
        expect(Object.keys(user).sort()).toEqual(['email', 'id', 'role']);
      }
      await expectNoSecrets(response.body);
    });

    it('OPERATOR recebe 403 com a mensagem do CA10, sem dado de nenhum usuário', async () => {
      const response = await getAs('/users', operator).expect(403);

      expectForbiddenWithoutUserData(
        response.body as Record<string, unknown>,
        '/users',
      );
      const text = JSON.stringify(response.body);
      for (const user of [admin, operator]) {
        expect(text).not.toContain(user.email);
        expect(text).not.toContain(user.id);
      }
    });

    it('sem token responde 401 "Autenticação necessária."', async () => {
      const response = await getAs('/users').expect(401);

      expect(
        withoutTimestamp(response.body as Record<string, unknown>),
      ).toEqual({
        statusCode: 401,
        error: 'Unauthorized',
        message: AUTHENTICATION_REQUIRED,
        path: '/users',
      });
    });
  });

  describe('GET /users/:id', () => {
    // UUID bem formado que não pertence a nenhum usuário.
    const MISSING_ID = '00000000-0000-4000-8000-000000000000';

    describe('ADMIN', () => {
      it.each([
        { caso: 'outro usuário', user: () => operator },
        { caso: 'o próprio', user: () => admin },
      ])(
        'recebe 200 com { data: { id, email, role } } de $caso, e nada além',
        async ({ user }) => {
          const { id, email, role } = user();

          const response = await getAs(`/users/${id}`, admin).expect(200);

          expect(response.body).toEqual({ data: { id, email, role } });
          await expectNoSecrets(response.body);
        },
      );

      it('com id que não existe recebe 404 "Usuário não encontrado."', async () => {
        const response = await getAs(`/users/${MISSING_ID}`, admin).expect(404);

        expect(
          withoutTimestamp(response.body as Record<string, unknown>),
        ).toEqual({
          statusCode: 404,
          error: 'Not Found',
          message: 'Usuário não encontrado.',
          path: `/users/${MISSING_ID}`,
        });
      });
    });

    describe('OPERATOR', () => {
      it('recebe 200 com os próprios dados', async () => {
        const { id, email, role } = operator;

        const response = await getAs(`/users/${id}`, operator).expect(200);

        expect(response.body).toEqual({ data: { id, email, role } });
        await expectNoSecrets(response.body);
      });

      it('com id de outra pessoa e com id inexistente recebe 403, com corpos iguais fora o timestamp', async () => {
        const other = await getAs(`/users/${admin.id}`, operator).expect(403);
        const missing = await getAs(`/users/${MISSING_ID}`, operator).expect(
          403,
        );

        const otherBody = other.body as Record<string, unknown>;
        const missingBody = missing.body as Record<string, unknown>;
        expectForbiddenWithoutUserData(otherBody, `/users/${admin.id}`);
        expectForbiddenWithoutUserData(missingBody, `/users/${MISSING_ID}`);
        // O path ecoa a URL pedida; fora ele e o timestamp, nada distingue os dois.
        const { path: _otherPath, ...otherRest } = withoutTimestamp(otherBody);
        const { path: _missingPath, ...missingRest } =
          withoutTimestamp(missingBody);
        expect(otherRest).toEqual(missingRest);
      });
    });

    it.each([
      { papel: 'ADMIN', user: () => admin },
      { papel: 'OPERATOR', user: () => operator },
    ])(
      '$papel com id que não é UUID recebe 400 com fields.id',
      async ({ user }) => {
        const response = await getAs('/users/nao-e-uuid', user()).expect(400);

        const error = response.body as {
          fields?: Record<string, string[]>;
        } & Record<string, unknown>;
        expect(withoutTimestamp(error)).toMatchObject({
          statusCode: 400,
          error: 'Bad Request',
          path: '/users/nao-e-uuid',
        });
        expect(Object.keys(error.fields ?? {})).toEqual(['id']);
      },
    );

    it('sem token responde 401 "Autenticação necessária."', async () => {
      const response = await getAs(`/users/${operator.id}`).expect(401);

      expect(
        withoutTimestamp(response.body as Record<string, unknown>),
      ).toEqual({
        statusCode: 401,
        error: 'Unauthorized',
        message: AUTHENTICATION_REQUIRED,
        path: `/users/${operator.id}`,
      });
    });

    it('GET /users/me continua respondendo o perfil, e não cai na validação de UUID', async () => {
      const { id, email, role } = operator;

      const response = await getAs('/users/me', operator).expect(200);

      expect(response.body).toEqual({ data: { id, email, role } });
    });
  });
});
