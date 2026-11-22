/** Situações que a grade devolve hoje; a tradução para a tela é só do frontend. */
export const SLOT_STATUSES = ['FREE', 'BLOCKED'] as const;

export type SlotStatus = (typeof SLOT_STATUSES)[number];

export interface SlotFacts {
  /** Existe bloqueio da quadra neste horário. */
  blocked: boolean;
}

/**
 * Situação de um horário, na precedência da spec: bloqueado vence todas as
 * outras; sem nada que o ocupe, o horário está livre.
 */
export function slotStatus(facts: SlotFacts): SlotStatus {
  return facts.blocked ? 'BLOCKED' : 'FREE';
}
