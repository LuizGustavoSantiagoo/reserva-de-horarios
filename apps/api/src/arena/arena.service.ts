import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { ArenaDto } from './dto/arena.dto.js';

const ARENA_NOT_FOUND = 'arena não encontrada';

@Injectable()
export class ArenaService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * A arena única (RN21) com todas as suas quadras, ativas e inativas, lidas na
   * mesma consulta pela relação 1:N e ordenadas por nome. Sem arena (o seed não
   * rodou), 404.
   */
  async findWithCourts(): Promise<ArenaDto> {
    const arena = await this.prisma.arena.findFirst({
      include: {
        courts: {
          orderBy: { name: 'asc' },
          select: { id: true, name: true, isActive: true },
        },
      },
    });
    if (!arena) throw new NotFoundException(ARENA_NOT_FOUND);
    return arena;
  }

  /** O id da arena única (RN21), para ligar a ela o que se cadastra. Sem arena, 404. */
  async findId(): Promise<string> {
    const arena = await this.prisma.arena.findFirst({ select: { id: true } });
    if (!arena) throw new NotFoundException(ARENA_NOT_FOUND);
    return arena.id;
  }
}
