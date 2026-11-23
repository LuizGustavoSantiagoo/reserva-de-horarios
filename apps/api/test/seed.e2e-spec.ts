import { spawnSync } from 'node:child_process';
import { Test } from '@nestjs/testing';
import argon2 from 'argon2';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { resetDatabase } from './helpers/db.js';

const SEED_TIMEOUT = 60_000;
const ADMIN_EMAIL = '  Admin.Seed@Exemplo.COM ';
const NORMALIZED_EMAIL = 'admin.seed@exemplo.com';
const ADMIN_PASSWORD = 'senha-do-seed-e2e';

// As ADMIN_* vão no env do processo filho: o process.loadEnvFile() do prisma.config.ts
// não sobrescreve variável que já existe, então o .env local não mascara os casos de falha.
function runSeed(admin: { ADMIN_EMAIL: string; ADMIN_PASSWORD: string }) {
  const result = spawnSync('npx', ['prisma', 'db', 'seed'], {
    env: { ...process.env, ...admin },
    encoding: 'utf8',
  });

  return { status: result.status, output: `${result.stdout}${result.stderr}` };
}

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
  });

  afterAll(async () => {
    await close?.();
  });

  describe('num banco vazio', () => {
    beforeAll(async () => {
      await resetDatabase(prisma);
      const { status, output } = runSeed({ ADMIN_EMAIL, ADMIN_PASSWORD });
      expect(status, output).toBe(0);
    }, SEED_TIMEOUT);

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

    it('cria um único ADMIN com o e-mail normalizado', async () => {
      const users = await prisma.adminUser.findMany();

      expect(users.map(({ email, role }) => ({ email, role }))).toEqual([
        { email: NORMALIZED_EMAIL, role: 'ADMIN' },
      ]);
    });

    it('guarda só o hash argon2 da senha, em nenhuma coluna a senha em claro', async () => {
      const admin = await prisma.adminUser.findUniqueOrThrow({
        where: { email: NORMALIZED_EMAIL },
      });

      expect(await argon2.verify(admin.passwordHash, ADMIN_PASSWORD)).toBe(true);
      for (const value of Object.values(admin)) {
        expect(String(value)).not.toContain(ADMIN_PASSWORD);
      }
    });

    it(
      'rodar de novo não cria outro usuário nem troca a senha do existente',
      async () => {
        const before = await prisma.adminUser.findUniqueOrThrow({
          where: { email: NORMALIZED_EMAIL },
        });

        const { status, output } = runSeed({
          ADMIN_EMAIL,
          ADMIN_PASSWORD: 'outra-senha-qualquer',
        });

        expect(status, output).toBe(0);
        const users = await prisma.adminUser.findMany();
        expect(users).toHaveLength(1);
        expect(users[0]).toEqual(before);
        expect(await prisma.arena.count()).toBe(1);
      },
      SEED_TIMEOUT,
    );
  });

  describe('num banco em que a arena já existe e o admin não', () => {
    beforeAll(async () => {
      await resetDatabase(prisma);
      expect(runSeed({ ADMIN_EMAIL, ADMIN_PASSWORD }).status).toBe(0);
      await prisma.adminUser.deleteMany();
    }, SEED_TIMEOUT);

    it(
      'cria o admin sem recriar a arena',
      async () => {
        const { status, output } = runSeed({ ADMIN_EMAIL, ADMIN_PASSWORD });

        expect(status, output).toBe(0);
        expect(await prisma.arena.count()).toBe(1);
        const users = await prisma.adminUser.findMany();
        expect(users.map(({ email, role }) => ({ email, role }))).toEqual([
          { email: NORMALIZED_EMAIL, role: 'ADMIN' },
        ]);
      },
      SEED_TIMEOUT,
    );
  });

  describe('com as variáveis do admin inválidas', () => {
    beforeEach(async () => {
      await resetDatabase(prisma);
    });

    it.each([
      {
        caso: 'ADMIN_EMAIL faltando',
        env: { ADMIN_EMAIL: '', ADMIN_PASSWORD },
        variable: 'ADMIN_EMAIL',
      },
      {
        caso: 'ADMIN_PASSWORD faltando',
        env: { ADMIN_EMAIL, ADMIN_PASSWORD: '' },
        variable: 'ADMIN_PASSWORD',
      },
      {
        caso: 'ADMIN_PASSWORD com 7 caracteres',
        env: { ADMIN_EMAIL, ADMIN_PASSWORD: '1234567' },
        variable: 'ADMIN_PASSWORD',
      },
    ])(
      '$caso: o seed falha nomeando a variável e não grava nada',
      async ({ env, variable }) => {
        const { status, output } = runSeed(env);

        expect(status).not.toBe(0);
        expect(output).toContain(variable);
        expect(await prisma.adminUser.count()).toBe(0);
        expect(await prisma.arena.count()).toBe(0);
      },
      SEED_TIMEOUT,
    );
  });
});
