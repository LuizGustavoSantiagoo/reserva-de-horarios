import type { ReservationStatus } from '../../generated/prisma/enums.js';

/** Situações que a grade devolve hoje; a tradução para a tela é só do frontend. */
export const SLOT_STATUSES = ['FREE', 'HELD', 'RESERVED', 'BLOCKED'] as const;

export type SlotStatus = (typeof SLOT_STATUSES)[number];

export interface SlotFacts {
  /** Existe bloqueio da quadra neste horário. */
  blocked: boolean;
  /** Status gravado da reserva do horário, se houver; prazo nenhum entra aqui (CA7). */
  reservationStatus?: ReservationStatus;
}

/**
 * Situação de um horário, na precedência da spec: bloqueado → reservado →
 * em reserva → livre. Pré-reserva e reserva pendente ocupam o horário só pelo
 * status gravado; expirada e cancelada não ocupam.
 */
export function slotStatus(facts: SlotFacts): SlotStatus {
  if (facts.blocked) return 'BLOCKED';
  switch (facts.reservationStatus) {
    case 'CONFIRMED':
      return 'RESERVED';
    case 'HELD':
    case 'PENDING':
      return 'HELD';
    default:
      return 'FREE';
  }
}
