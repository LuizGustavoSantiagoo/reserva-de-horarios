import type { PrismaService } from '../prisma/prisma.service.js';
import { BlocksService } from './blocks.service.js';

describe('BlocksService', () => {
  it('devolve, entre os inícios pedidos, os que têm bloqueio naquela quadra', async () => {
    const nine = new Date('2030-06-02T12:00:00.000Z');
    const eight = new Date('2030-06-02T11:00:00.000Z');
    const findMany = vi.fn().mockResolvedValue([{ startsAt: nine }]);
    const prisma = { block: { findMany } } as unknown as PrismaService;

    const blocked = await new BlocksService(prisma).listBlockedStarts(
      'quadra-1',
      [eight, nine],
    );

    expect(blocked).toEqual([nine]);
    expect(findMany).toHaveBeenCalledWith({
      where: { courtId: 'quadra-1', startsAt: { in: [eight, nine] } },
      select: { startsAt: true },
    });
  });
});
