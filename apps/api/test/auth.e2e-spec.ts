import { createHmac, timingSafeEqual } from 'node:crypto';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { createUser } from './helpers/auth.js';
import type { TestUser } from './helpers/auth.js';
import { resetDatabase } from './helpers/db.js';

const PASSWORD = 'senha-certa-123';
const INVALID_CREDENTIALS = 'E-mail ou senha inválidos.';
const EIGHT_HOURS = 28800;

interface TokenPayload {
  [key: string]: unknown;
  iat: number;
  exp: number;
}

function decodeSegment(segment: string): Record<string, unknown> {
  return JSON.parse(
    Buffer.from(segment, 'base64url').toString('utf8'),
  ) as Record<string, unknown>;
}

/**
 * Confere o JWT sem usar a biblioteca da API: cabeçalho HS256 e assinatura
 * HMAC-SHA256 com o segredo. Devolve o conteúdo do token.
 */
function verifyHs256(token: string, secret: string): TokenPayload {
  const [header, payload, signature] = token.split('.');
  expect(decodeSegment(header)).toMatchObject({ alg: 'HS256' });

  const expected = createHmac('sha256', secret)
    .update(`${header}.${payload}`)
    .digest();
  const received = Buffer.from(signature, 'base64url');
  expect(
    received.length === expected.length && timingSafeEqual(received, expected),
  ).toBe(true);

  return decodeSegment(payload) as TokenPayload;
}

function withoutTimestamp(body: Record<string, unknown>) {
  const { timestamp, ...rest } = body;
  expect(typeof timestamp).toBe('string');
  return rest;
}

// Uma app por teste: o contador de tentativas de login (Tarefa 6) vive na app,
// e nenhum teste deve herdar as tentativas do anterior.
describe('POST /auth/login (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let admin: TestUser;
  let operator: TestUser;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);

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

  afterEach(async () => {
    await app?.close();
  });

  function login(body: Record<string, unknown>) {
    return request(app.getHttpServer()).post('/auth/login').send(body);
  }

  /** Confere o token da resposta com o JWT_SECRET da app e devolve o conteúdo. */
  function tokenPayload(body: { data: { accessToken: string } }): TokenPayload {
    const secret = app.get(ConfigService).getOrThrow<string>('JWT_SECRET');
    return verifyHs256(body.data.accessToken, secret);
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

  describe('com e-mail e senha certos', () => {
    it.each([
      { papel: 'ADMIN', user: () => admin },
      { papel: 'OPERATOR', user: () => operator },
    ])(
      '$papel recebe 200 com { data: { accessToken } } assinado com o JWT_SECRET, só com sub, role, iat e exp, válido por 8 horas',
      async ({ user }) => {
        const { id, email, role } = user();

        const response = await login({ email, password: PASSWORD }).expect(200);

        const body = response.body as { data: { accessToken: string } };
        expect(Object.keys(body)).toEqual(['data']);
        expect(Object.keys(body.data)).toEqual(['accessToken']);
        expect(typeof body.data.accessToken).toBe('string');

        const payload = tokenPayload(body);
        expect(Object.keys(payload).sort()).toEqual([
          'exp',
          'iat',
          'role',
          'sub',
        ]);
        expect(payload.sub).toBe(id);
        expect(payload.role).toBe(role);
        expect(payload.exp - payload.iat).toBe(EIGHT_HOURS);

        await expectNoSecrets(response.body);
      },
    );

    it('e-mail com maiúsculas e espaços nas pontas entra na mesma conta', async () => {
      const response = await login({
        email: '  Ana@ARENA.com ',
        password: PASSWORD,
      }).expect(200);

      const payload = tokenPayload(
        response.body as { data: { accessToken: string } },
      );
      expect(payload.sub).toBe(admin.id);
    });
  });

  describe('com credenciais inválidas', () => {
    it('senha errada e e-mail inexistente dão 401 com corpos iguais fora o timestamp, sem token', async () => {
      const wrongPassword = await login({
        email: admin.email,
        password: 'senha-errada-123',
      }).expect(401);
      const unknownEmail = await login({
        email: 'ninguem@arena.com',
        password: PASSWORD,
      }).expect(401);

      const first = wrongPassword.body as Record<string, unknown>;
      const second = unknownEmail.body as Record<string, unknown>;
      expect(withoutTimestamp(first)).toEqual({
        statusCode: 401,
        error: 'Unauthorized',
        message: INVALID_CREDENTIALS,
        path: '/auth/login',
      });
      expect(withoutTimestamp(second)).toEqual(withoutTimestamp(first));

      for (const body of [first, second]) {
        expect(JSON.stringify(body)).not.toContain('accessToken');
        await expectNoSecrets(body);
      }
    });
  });

  describe('com dados mal formados', () => {
    it('e-mail mal formado e senha vazia dão 400 com fields.email e fields.password', async () => {
      const response = await login({
        email: 'nao-e-um-email',
        password: '',
      }).expect(400);

      const body = response.body as {
        statusCode: number;
        fields: Record<string, string[]>;
      };
      expect(body.statusCode).toBe(400);
      expect(Object.keys(body.fields).sort()).toEqual(['email', 'password']);
      expect(JSON.stringify(body)).not.toContain('accessToken');
      await expectNoSecrets(body);
    });

    it('e-mail mal formado sozinho aponta só fields.email', async () => {
      const response = await login({
        email: 'ana@',
        password: PASSWORD,
      }).expect(400);

      const body = response.body as { fields: Record<string, string[]> };
      expect(Object.keys(body.fields)).toEqual(['email']);
      await expectNoSecrets(body);
    });

    it('senha vazia sozinha aponta só fields.password', async () => {
      const response = await login({ email: admin.email, password: '' }).expect(
        400,
      );

      const body = response.body as { fields: Record<string, string[]> };
      expect(Object.keys(body.fields)).toEqual(['password']);
    });
  });
});
