import type { PrismaService } from '../../src/prisma/prisma.service.js';

// Apaga os dados de todas as tabelas do domínio, na ordem que as chaves estrangeiras exigem.
export async function resetDatabase(prisma: PrismaService): Promise<void> {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "Reservation", "Purchase", "Block", "ScheduleRule", "Court", "Arena", "AdminUser" RESTART IDENTITY CASCADE',
  );
}
