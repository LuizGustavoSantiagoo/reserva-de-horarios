import { PrismaPg } from '@prisma/adapter-pg';
import argon2 from 'argon2';
import { PrismaClient } from '../generated/prisma/client.ts';
import { Role } from '../generated/prisma/enums.ts';
import prismaConfig, { adminSeedEnv } from '../prisma.config.ts';
import { readAdminSeedInput, type AdminSeedInput } from './admin-seed.ts';

const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6];
const OPENING_HOUR = 8;
const CLOSING_HOUR = 22;
const PRICE_CENTS = 8000;

// Antes de tocar no banco: sem ADMIN_EMAIL/ADMIN_PASSWORD válidas, o seed falha sem gravar nada.
const admin = readAdminSeedInput(adminSeedEnv);

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: prismaConfig.datasource?.url }),
});

async function seedArena(): Promise<void> {
  if ((await prisma.arena.count()) > 0) {
    console.log('Arena já existente: etapa da arena pulada.');
    return;
  }

  const arena = await prisma.arena.create({
    data: { name: 'Arena de Areia', address: 'Rua das Dunas, 100' },
  });

  // TODO #8: quadras de exemplo até existir o cadastro de quadra pelo painel (US07).
  const courts = [
    { name: 'Quadra 1', isActive: true },
    { name: 'Quadra 2', isActive: true },
    { name: 'Quadra 3', isActive: false },
  ];

  for (const court of courts) {
    await prisma.court.create({
      data: {
        ...court,
        arenaId: arena.id,
        // TODO #9: agenda semanal de exemplo até existir a tela de agenda (US08).
        scheduleRules: {
          create: WEEKDAYS.map((weekday) => ({
            weekday,
            startHour: OPENING_HOUR,
            endHour: CLOSING_HOUR,
            priceCents: PRICE_CENTS,
          })),
        },
      },
    });
  }

  console.log('Seed aplicado: arena, 3 quadras e agenda semanal.');
}

// Fora do return antecipado da arena: roda também num banco em que a arena já existia.
// update vazio: rodar de novo não cria outro usuário nem troca a senha do existente.
async function seedAdmin({ email, password }: AdminSeedInput): Promise<void> {
  await prisma.adminUser.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash: await argon2.hash(password),
      role: Role.ADMIN,
    },
  });

  console.log('Seed do administrador aplicado.');
}

try {
  await seedArena();
  await seedAdmin(admin);
} finally {
  await prisma.$disconnect();
}
