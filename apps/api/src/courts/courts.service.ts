import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CourtDto } from './dto/court.dto.js';

const PUBLIC_FIELDS = { id: true, name: true } as const;

@Injectable()
export class CourtsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Quadras ativas, por nome. Quadra inativa não aparece para o cliente. */
  listActive(): Promise<CourtDto[]> {
    return this.prisma.court.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: PUBLIC_FIELDS,
    });
  }

  /** A quadra, se existir e estiver ativa; senão, `null`. */
  findActive(id: string): Promise<CourtDto | null> {
    return this.prisma.court.findFirst({
      where: { id, isActive: true },
      select: PUBLIC_FIELDS,
    });
  }
}
