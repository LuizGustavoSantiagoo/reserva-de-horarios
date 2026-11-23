import type { PrismaService } from '../prisma/prisma.service.js';
import { SchedulesService } from './schedules.service.js';

describe('SchedulesService', () => {
  it('lê as faixas da agenda da quadra naquele dia da semana, da mais cedo para a mais tarde', async () => {
    const findMany = vi.fn().mockResolvedValue([
      { startHour: 8, endHour: 10 },
      { startHour: 18, endHour: 20 },
    ]);
    const prisma = { scheduleRule: { findMany } } as unknown as PrismaService;

    const hours = await new SchedulesService(prisma).listForWeekday(
      'quadra-1',
      0,
    );

    expect(hours).toEqual([
      { startHour: 8, endHour: 10 },
      { startHour: 18, endHour: 20 },
    ]);
    expect(findMany).toHaveBeenCalledWith({
      where: { courtId: 'quadra-1', weekday: 0 },
      orderBy: { startHour: 'asc' },
      select: { startHour: true, endHour: true },
    });
  });
});
