import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { CLOCK } from '../src/common/clock.js';
import type { Clock } from '../src/common/clock.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { resetDatabase } from './helpers/db.js';

// 2030-06-02 é um domingo (weekday 0) e 2030-06-03, uma segunda (weekday 1).
// São Paulo está em UTC-3: 8h em São Paulo são 11h em UTC.
const SUNDAY = '2030-06-02';
const MONDAY = '2030-06-03';
// 6h de domingo em São Paulo: antes de qualquer horário da agenda do dia.
const SUNDAY_6AM_SP = new Date('2030-06-02T09:00:00.000Z');
// 22h de domingo em São Paulo: em UTC já é segunda-feira, 1h.
const SUNDAY_10PM_SP = new Date('2030-06-03T01:00:00.000Z');

describe('grade pública (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let now: Date;
  const clock: Clock = { now: () => now };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(CLOCK)
      .useValue(clock)
      .compile();
    app = moduleRef.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app?.close();
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    now = SUNDAY_6AM_SP;
  });

  async function createCourt(name: string, isActive = true): Promise<string> {
    const arena =
      (await prisma.arena.findFirst()) ??
      (await prisma.arena.create({
        data: { name: 'Arena de Teste', address: 'Rua de Teste, 1' },
      }));
    const court = await prisma.court.create({
      data: { name, isActive, arenaId: arena.id },
    });
    return court.id;
  }

  async function addRule(
    courtId: string,
    weekday: number,
    startHour: number,
    endHour: number,
  ): Promise<void> {
    await prisma.scheduleRule.create({
      data: { courtId, weekday, startHour, endHour, priceCents: 8000 },
    });
  }

  describe('GET /courts', () => {
    it('lista só as quadras ativas, por nome, com id e nome, dentro de { data }', async () => {
      const court2 = await createCourt('Quadra 2');
      await createCourt('Quadra 3', false);
      const court1 = await createCourt('Quadra 1');

      const response = await request(app.getHttpServer())
        .get('/courts')
        .expect(200);

      expect(response.body).toEqual({
        data: [
          { id: court1, name: 'Quadra 1' },
          { id: court2, name: 'Quadra 2' },
        ],
      });
    });
  });

  describe('GET /courts/:courtId/slots', () => {
    let courtId: string;

    beforeEach(async () => {
      courtId = await createCourt('Quadra 1');
      // Duas faixas no domingo, gravadas fora de ordem, e outra na segunda.
      await addRule(courtId, 0, 18, 20);
      await addRule(courtId, 0, 8, 10);
      await addRule(courtId, 1, 14, 16);
      // 9h de domingo em São Paulo bloqueada nesta quadra.
      await prisma.block.create({
        data: {
          courtId,
          startsAt: new Date('2030-06-02T12:00:00.000Z'),
          reason: 'Manutenção',
        },
      });
      // Bloqueio em outra quadra, no mesmo instante, não afeta esta.
      const otherCourt = await createCourt('Quadra 2');
      await addRule(otherCourt, 0, 8, 10);
      await prisma.block.create({
        data: {
          courtId: otherCourt,
          startsAt: new Date('2030-06-02T11:00:00.000Z'),
          reason: 'Evento',
        },
      });
    });

    it('sem date, devolve a grade de hoje em São Paulo: horários de 1 h em ordem, com o bloqueio, dentro de { data }', async () => {
      const response = await request(app.getHttpServer())
        .get(`/courts/${courtId}/slots`)
        .expect(200);

      expect(response.body).toEqual({
        data: {
          courtId,
          date: SUNDAY,
          today: SUNDAY,
          slots: [
            {
              startsAt: '2030-06-02T11:00:00.000Z',
              endsAt: '2030-06-02T12:00:00.000Z',
              status: 'FREE',
            },
            {
              startsAt: '2030-06-02T12:00:00.000Z',
              endsAt: '2030-06-02T13:00:00.000Z',
              status: 'BLOCKED',
            },
            {
              startsAt: '2030-06-02T21:00:00.000Z',
              endsAt: '2030-06-02T22:00:00.000Z',
              status: 'FREE',
            },
            {
              startsAt: '2030-06-02T22:00:00.000Z',
              endsAt: '2030-06-02T23:00:00.000Z',
              status: 'FREE',
            },
          ],
        },
      });
    });

    it('às 22h de São Paulo, quando em UTC já é o dia seguinte, "hoje" continua sendo o dia de São Paulo', async () => {
      now = SUNDAY_10PM_SP;

      const response = await request(app.getHttpServer())
        .get(`/courts/${courtId}/slots`)
        .expect(200);

      const grid = (
        response.body as {
          data: { date: string; today: string; slots: { startsAt: string }[] };
        }
      ).data;
      expect(grid.today).toBe(SUNDAY);
      expect(grid.date).toBe(SUNDAY);
      expect(grid.slots.map((slot) => slot.startsAt)).toEqual([
        '2030-06-02T11:00:00.000Z',
        '2030-06-02T12:00:00.000Z',
        '2030-06-02T21:00:00.000Z',
        '2030-06-02T22:00:00.000Z',
      ]);
    });

    it('com date, devolve a grade daquele dia, mantendo o today do servidor', async () => {
      const response = await request(app.getHttpServer())
        .get(`/courts/${courtId}/slots`)
        .query({ date: MONDAY })
        .expect(200);

      expect(response.body).toEqual({
        data: {
          courtId,
          date: MONDAY,
          today: SUNDAY,
          slots: [
            {
              startsAt: '2030-06-03T17:00:00.000Z',
              endsAt: '2030-06-03T18:00:00.000Z',
              status: 'FREE',
            },
            {
              startsAt: '2030-06-03T18:00:00.000Z',
              endsAt: '2030-06-03T19:00:00.000Z',
              status: 'FREE',
            },
          ],
        },
      });
    });
  });
});
