import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

/** Uma faixa da agenda: de `startHour` até `endHour`, horas cheias de São Paulo. */
export interface ScheduleHours {
  startHour: number;
  endHour: number;
}

@Injectable()
export class SchedulesService {
  constructor(private readonly prisma: PrismaService) {}

  /** As faixas da agenda da quadra naquele dia da semana (0 = domingo), da mais cedo à mais tarde. */
  listForWeekday(courtId: string, weekday: number): Promise<ScheduleHours[]> {
    return this.prisma.scheduleRule.findMany({
      where: { courtId, weekday },
      orderBy: { startHour: 'asc' },
      select: { startHour: true, endHour: true },
    });
  }
}
