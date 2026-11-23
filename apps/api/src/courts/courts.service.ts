import { ConflictException, Injectable } from '@nestjs/common';
import { ArenaService } from '../arena/arena.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreatedCourtDto } from './dto/admin-court.dto.js';
import type { CourtDto } from './dto/court.dto.js';

const PUBLIC_FIELDS = { id: true, name: true } as const;

const CREATED_FIELDS = {
  id: true,
  arenaId: true,
  name: true,
  isActive: true,
} as const;

const COURT_NAME_TAKEN = 'Já existe uma quadra com este nome.';

@Injectable()
export class CourtsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly arena: ArenaService,
  ) {}

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

  /**
   * Cadastra uma quadra ativa ligada à arena única; o cliente nunca informa a
   * arena. O nome chega sem espaços nas pontas (DTO) e não pode repetir o de outra
   * quadra da arena, ativa ou inativa, sem diferenciar maiúsculas (409). A janela
   * de corrida entre a checagem e a gravação é aceita: só o ADMIN cadastra quadra.
   */
  async create(name: string): Promise<CreatedCourtDto> {
    const arenaId = await this.arena.findId();
    const taken = await this.prisma.court.findFirst({
      where: { arenaId, name: { equals: name, mode: 'insensitive' } },
      select: { id: true },
    });
    if (taken) throw new ConflictException(COURT_NAME_TAKEN);
    return this.prisma.court.create({
      data: { arenaId, name },
      select: CREATED_FIELDS,
    });
  }
}
