import type { PrismaService } from '../prisma/prisma.service.js';
import { PurchasesService } from './purchases.service.js';

describe('PurchasesService', () => {
  it('lê só as reservas que ocupam o horário, com o nome de quem comprou e sem o telefone', async () => {
    const eight = new Date('2030-06-02T11:00:00.000Z');
    const nine = new Date('2030-06-02T12:00:00.000Z');
    const findMany = vi.fn().mockResolvedValue([
      {
        startsAt: nine,
        status: 'CONFIRMED',
        purchase: { customerName: 'Maria da Silva' },
      },
    ]);
    const prisma = { reservation: { findMany } } as unknown as PrismaService;

    const reservations = await new PurchasesService(
      prisma,
    ).listActiveReservations('quadra-1', [eight, nine]);

    expect(reservations).toEqual([
      { startsAt: nine, status: 'CONFIRMED', customerName: 'Maria da Silva' },
    ]);
    // A grade confia só no status gravado: nenhum filtro por prazo, e o
    // telefone não sai do banco nesta leitura.
    expect(findMany).toHaveBeenCalledWith({
      where: {
        courtId: 'quadra-1',
        startsAt: { in: [eight, nine] },
        status: { in: ['HELD', 'PENDING', 'CONFIRMED'] },
      },
      select: {
        startsAt: true,
        status: true,
        purchase: { select: { customerName: true } },
      },
    });
  });
});
