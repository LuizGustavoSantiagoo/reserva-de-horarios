import type { ReservationStatus } from '../../generated/prisma/enums.js';

/** Situações que a grade devolve; a tradução para a tela é só do frontend. */
export const SLOT_STATUSES = [
  'FREE',
  'HELD',
  'RESERVED',
  'BLOCKED',
  'UNAVAILABLE',
] as const;

export type SlotStatus = (typeof SLOT_STATUSES)[number];

export interface SlotFacts {
  /** Início do horário (instante UTC). */
  startsAt: Date;
  /** Existe bloqueio da quadra neste horário. */
  blocked: boolean;
  /** Status gravado da reserva do horário, se houver; prazo nenhum entra aqui (CA7). */
  reservationStatus?: ReservationStatus;
}

/**
 * Situação de um horário, na precedência da spec: bloqueado → reservado →
 * indisponível → em reserva → livre. Pré-reserva e reserva pendente ocupam o
 * horário só pelo status gravado; expirada e cancelada não ocupam. O horário
 * "já começou" quando o início é igual ou anterior ao `now` (CA5), que vem de
 * fora para a função continuar pura.
 */
export function slotStatus(facts: SlotFacts, now: Date): SlotStatus {
  if (facts.blocked) return 'BLOCKED';
  if (facts.reservationStatus === 'CONFIRMED') return 'RESERVED';
  if (facts.startsAt.getTime() <= now.getTime()) return 'UNAVAILABLE';
  switch (facts.reservationStatus) {
    case 'HELD':
    case 'PENDING':
      return 'HELD';
    default:
      return 'FREE';
  }
}
