import type { ReservationStatus } from '../../generated/prisma/enums.js';
import type { PrismaService } from '../../src/prisma/prisma.service.js';

// Apaga os dados de todas as tabelas do domínio, na ordem que as chaves estrangeiras exigem.
export async function resetDatabase(prisma: PrismaService): Promise<void> {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "Reservation", "Purchase", "Block", "ScheduleRule", "Court", "Arena" RESTART IDENTITY CASCADE',
  );
}

export interface ReservationSeed {
  courtId: string;
  startsAt: Date;
  status: ReservationStatus;
  holdExpiresAt: Date;
  customerName?: string;
  customerPhone?: string;
}

// Nenhuma rota cria reserva ainda: a compra e a sua reserva entram direto pelo Prisma,
// com o mesmo status nas duas.
export async function createReservation(
  prisma: PrismaService,
  seed: ReservationSeed,
): Promise<void> {
  await prisma.purchase.create({
    data: {
      customerName: seed.customerName,
      customerPhone: seed.customerPhone,
      status: seed.status,
      totalCents: 8000,
      holdExpiresAt: seed.holdExpiresAt,
      reservations: {
        create: {
          courtId: seed.courtId,
          startsAt: seed.startsAt,
          priceCents: 8000,
          status: seed.status,
        },
      },
    },
  });
}
