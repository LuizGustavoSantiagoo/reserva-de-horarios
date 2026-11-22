import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { CLOCK } from '../src/common/clock.js';
import type { Clock } from '../src/common/clock.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { createUser, invalidAuthorizations } from './helpers/auth.js';
import type { TestUser } from './helpers/auth.js';
import { resetDatabase } from './helpers/db.js';

const PASSWORD = 'senha-certa-123';
// 2030-06-03 é uma segunda (weekday 1); o relógio fica fixo antes da grade do dia.
const MONDAY = '2030-06-03';
const clock: Clock = { now: () => new Date('2030-06-03T09:00:00.000Z') };

interface PublicCall {
  rota: string;
  status: number;
  /** Confere que a resposta é a da própria rota, e não uma recusa do guard. */
  expectOwnResponse: (body: unknown) => void;
  send: (app: INestApplication<App>, courtId: string) => request.Test;
}

const PUBLIC_ROUTES: PublicCall[] = [
  {
    rota: 'GET /',
    status: 200,
    expectOwnResponse: (body) => expect(body).toEqual({ data: 'Hello World!' }),
    send: (app) => request(app.getHttpServer()).get('/'),
  },
  {
    rota: 'GET /courts',
    status: 200,
    expectOwnResponse: (body) =>
      expect(body).toEqual({
        data: [{ id: expect.any(String) as string, name: 'Quadra 1' }],
      }),
    send: (app) => request(app.getHttpServer()).get('/courts'),
  },
  {
    rota: 'GET /courts/:courtId/slots',
    status: 200,
    expectOwnResponse: (body) =>
      expect(body).toMatchObject({
        data: { date: MONDAY, slots: [{}, {}] },
      }),
    send: (app, courtId) =>
      request(app.getHttpServer())
        .get(`/courts/${courtId}/slots`)
        .query({ date: MONDAY }),
  },
  {
    // Senha errada: a resposta é determinística (o token de um login certo muda a cada segundo).
    rota: 'POST /auth/login',
    status: 401,
    expectOwnResponse: (body) =>
      expect(body).toMatchObject({ message: 'E-mail ou senha inválidos.' }),
    send: (app) =>
      request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'ana@arena.com', password: 'senha-errada-123' }),
  },
];

function withoutTimestamp(body: unknown): unknown {
  if (body && typeof body === 'object' && 'timestamp' in body) {
    const { timestamp: _timestamp, ...rest } = body as Record<string, unknown>;
    return rest;
  }
  return body;
}

// Uma app por teste e só dois pedidos em cada: o login, que também está aqui, ganha
// limite de tentativas por app (Tarefa 6), e nenhum teste deve herdar o contador.
describe('rotas públicas com e sem token (e2e)', () => {
  let app: INestApplication<App>;
  let operator: TestUser;
  let courtId: string;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(CLOCK)
      .useValue(clock)
      .compile();
    app = moduleRef.createNestApplication();
    await app.init();
    const prisma = app.get(PrismaService);

    await resetDatabase(prisma);
    await createUser(prisma, {
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
      data: { name: 'Arena de Teste', address: 'Rua de Teste, 1' },
    });
    const court = await prisma.court.create({
      data: { name: 'Quadra 1', arenaId: arena.id },
    });
    courtId = court.id;
    await prisma.scheduleRule.create({
      data: {
        courtId,
        weekday: 1,
        startHour: 8,
        endHour: 10,
        priceCents: 8000,
      },
    });
  });

  afterEach(async () => {
    await app?.close();
  });

  const INVALID_CASES = [
    'valor sem Bearer',
    'token de outro segredo',
    'token com o role adulterado',
    'token vencido',
  ];

  describe.each(PUBLIC_ROUTES)(
    '$rota',
    ({ status, expectOwnResponse, send }) => {
      it(`sem token responde ${status}, como antes desta história`, async () => {
        const response = await send(app, courtId);

        expect(response.status).toBe(status);
        expectOwnResponse(response.body);
      });

      it.each(INVALID_CASES)(
        'com %s responde igual a sem token',
        async (caso) => {
          const invalid = invalidAuthorizations(app, operator).find(
            (item) => item.caso === caso,
          );
          expect(invalid).toBeDefined();

          const withoutToken = await send(app, courtId);
          const withToken = await send(app, courtId).set(
            'Authorization',
            invalid!.authorization,
          );

          expect(withoutToken.status).toBe(status);
          expectOwnResponse(withoutToken.body);
          expect(withToken.status).toBe(withoutToken.status);
          expect(withoutTimestamp(withToken.body)).toEqual(
            withoutTimestamp(withoutToken.body),
          );
        },
      );
    },
  );
});
