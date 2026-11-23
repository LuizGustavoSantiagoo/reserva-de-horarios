import { Injectable } from '@nestjs/common';
import type { ReservationStatus } from '../../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';

/** Status que ocupam o horário: os mesmos do índice único parcial (architecture §2.1, item 4). */
const OCCUPYING_STATUSES: ReservationStatus[] = [
  'HELD',
  'PENDING',
  'CONFIRMED',
];

/** O que a grade pública precisa saber de uma reserva — nunca o telefone (RN06). */
export interface ActiveReservation {
  startsAt: Date;
  status: ReservationStatus;
  customerName: string | null;
}

@Injectable()
export class PurchasesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Entre os inícios pedidos, as reservas da quadra que ocupam o horário, pelo
   * status gravado e sem olhar prazo (architecture §2.1, item 9).
   */
  async listActiveReservations(
    courtId: string,
    startsAt: Date[],
  ): Promise<ActiveReservation[]> {
    const reservations = await this.prisma.reservation.findMany({
      where: {
        courtId,
        startsAt: { in: startsAt },
        status: { in: OCCUPYING_STATUSES },
      },
      // `select` explícito: o telefone não sai do banco nesta leitura.
      select: {
        startsAt: true,
        status: true,
        purchase: { select: { customerName: true } },
      },
    });
    return reservations.map(({ startsAt, status, purchase }) => ({
      startsAt,
      status,
      customerName: purchase.customerName,
    }));
  }
}
