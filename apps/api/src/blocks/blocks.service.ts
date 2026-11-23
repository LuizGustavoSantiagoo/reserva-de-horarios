import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class BlocksService {
  constructor(private readonly prisma: PrismaService) {}

  /** Entre os inícios pedidos, os que têm bloqueio naquela quadra. */
  async listBlockedStarts(courtId: string, startsAt: Date[]): Promise<Date[]> {
    const blocks = await this.prisma.block.findMany({
      where: { courtId, startsAt: { in: startsAt } },
      select: { startsAt: true },
    });
    return blocks.map((block) => block.startsAt);
  }
}
