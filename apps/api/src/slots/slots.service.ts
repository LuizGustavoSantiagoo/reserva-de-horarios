import { Inject, Injectable } from '@nestjs/common';
import { BlocksService } from '../blocks/blocks.service.js';
import { CLOCK } from '../common/clock.js';
import type { Clock } from '../common/clock.js';
import { CourtsService } from '../courts/courts.service.js';
import { PurchasesService } from '../purchases/purchases.service.js';
import { SchedulesService } from '../schedules/schedules.service.js';
import type { SlotDto, SlotGridDto } from './dto/slot-grid.dto.js';
import { firstName } from './first-name.js';
import {
  saoPauloDate,
  saoPauloHourToInstant,
  weekdayOf,
} from './sao-paulo-time.js';
import { slotStatus } from './slot-status.js';

const HOUR_MS = 60 * 60 * 1000;

function hoursFrom(startHour: number, endHour: number): number[] {
  return Array.from(
    { length: endHour - startHour },
    (_, index) => startHour + index,
  );
}

@Injectable()
export class SlotsService {
  constructor(
    private readonly courts: CourtsService,
    private readonly schedules: SchedulesService,
    private readonly blocks: BlocksService,
    private readonly purchases: PurchasesService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  /** A grade da quadra no dia pedido; sem dia, a de hoje em São Paulo. */
  async findGrid(courtId: string, date?: string): Promise<SlotGridDto> {
    const today = saoPauloDate(this.clock.now());
    const day = date ?? today;

    const court = await this.courts.findActive(courtId);
    if (!court) {
      // TODO #2: a Tarefa 7 troca esta grade vazia pelo 404 "Quadra não encontrada" (CA11).
      return { courtId, date: day, today, slots: [] };
    }

    const rules = await this.schedules.listForWeekday(court.id, weekdayOf(day));
    const starts = rules
      .flatMap(({ startHour, endHour }) => hoursFrom(startHour, endHour))
      .map((hour) => saoPauloHourToInstant(day, hour));

    const [blockedStarts, reservations] = await Promise.all([
      this.blocks.listBlockedStarts(court.id, starts),
      this.purchases.listActiveReservations(court.id, starts),
    ]);
    const blocked = new Set(
      blockedStarts.map((startsAt) => startsAt.getTime()),
    );
    // O índice único parcial garante no máximo uma reserva ativa por horário.
    const reservationAt = new Map(
      reservations.map((reservation) => [
        reservation.startsAt.getTime(),
        reservation,
      ]),
    );

    return {
      courtId: court.id,
      date: day,
      today,
      slots: starts.map((startsAt) => {
        const reservation = reservationAt.get(startsAt.getTime());
        const slot: SlotDto = {
          startsAt: startsAt.toISOString(),
          endsAt: new Date(startsAt.getTime() + HOUR_MS).toISOString(),
          status: slotStatus({
            blocked: blocked.has(startsAt.getTime()),
            reservationStatus: reservation?.status,
          }),
        };
        // Só o horário reservado mostra quem reservou, e só o primeiro nome (CA4).
        if (slot.status === 'RESERVED' && reservation?.customerName) {
          slot.firstName = firstName(reservation.customerName);
        }
        return slot;
      }),
    };
  }
}
