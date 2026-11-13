import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.ts';
import prismaConfig from '../prisma.config.ts';

const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6];
const OPENING_HOUR = 8;
const CLOSING_HOUR = 22;
const PRICE_CENTS = 8000;

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: prismaConfig.datasource?.url }),
});

async function seed(): Promise<void> {
  if ((await prisma.arena.count()) > 0) {
    console.log('Seed já aplicado: a arena existe. Nada a fazer.');
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

try {
  await seed();
} finally {
  await prisma.$disconnect();
}
