import { execFileSync } from 'node:child_process';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { resetDatabase } from './helpers/db.js';

describe('seed (e2e)', () => {
  let prisma: PrismaService;
  let close: () => Promise<void>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    const app = await moduleRef.createNestApplication().init();
    close = () => app.close();
    prisma = app.get(PrismaService);

    await resetDatabase(prisma);
    execFileSync('npx', ['prisma', 'db', 'seed'], { stdio: 'pipe' });
  }, 60_000);

  afterAll(async () => {
    await close?.();
  });

  it('cria a arena única', async () => {
    expect(await prisma.arena.count()).toBe(1);
  });

  it('cria duas quadras ativas e uma inativa', async () => {
    const courts = await prisma.court.findMany({ orderBy: { name: 'asc' } });

    expect(courts.map(({ name, isActive }) => ({ name, isActive }))).toEqual([
      { name: 'Quadra 1', isActive: true },
      { name: 'Quadra 2', isActive: true },
      { name: 'Quadra 3', isActive: false },
    ]);
  });

  it('cria a agenda de segunda a domingo, das 8h às 22h, em cada quadra', async () => {
    const courts = await prisma.court.findMany({
      include: { scheduleRules: { orderBy: { weekday: 'asc' } } },
    });

    for (const court of courts) {
      expect(
        court.scheduleRules.map(({ weekday, startHour, endHour }) => ({
          weekday,
          startHour,
          endHour,
        })),
      ).toEqual(
        [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
          weekday,
          startHour: 8,
          endHour: 22,
        })),
      );
    }
  });
});
