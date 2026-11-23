// Acesso da grade à API, sobre o cliente único de `src/api/` (architecture §4).
// Os tipos espelham os DTOs do Swagger (`CourtDto`, `SlotGridDto`): o `schema.d.ts`
// gerado pelo `npm run api:types` fica fora do Git e não existe no build do CI.
import { ApiError, apiGet } from '@/api/client'
import { GradeRefusal } from './grade-refusal'

export interface Court {
  id: string
  name: string
}

export type SlotStatus = 'FREE' | 'HELD' | 'RESERVED' | 'BLOCKED' | 'UNAVAILABLE'

export interface Slot {
  startsAt: string
  endsAt: string
  status: SlotStatus
  /** Primeiro nome de quem reservou; só vem em `RESERVED`. */
  firstName?: string
}

export interface SlotGrid {
  courtId: string
  /** Dia da grade (`YYYY-MM-DD`, em America/Sao_Paulo). */
  date: string
  /** Hoje segundo o servidor; a tela nunca usa o relógio do aparelho. */
  today: string
  slots: Slot[]
}

export function listCourts(): Promise<Court[]> {
  return apiGet<Court[]>('/courts')
}

/**
 * Sem `date`, o servidor devolve a grade de hoje. Link recusado pela API vira `GradeRefusal`:
 * 404 é a quadra (inexistente ou inativa); 400 é o dia (inválido ou passado). Qualquer outro
 * erro sai como veio.
 */
export async function getSlots(courtId: string, date?: string): Promise<SlotGrid> {
  const query = date ? `?date=${encodeURIComponent(date)}` : ''
  try {
    return await apiGet<SlotGrid>(`/courts/${encodeURIComponent(courtId)}/slots${query}`)
  } catch (error) {
    throw toRefusal(error)
  }
}

function toRefusal(error: unknown): unknown {
  if (!(error instanceof ApiError)) return error
  if (error.statusCode === 404) return new GradeRefusal('court', error.message)
  // No 400, a mensagem que explica é a do campo da data, não o "Dados inválidos." geral.
  if (error.statusCode === 400)
    return new GradeRefusal('day', error.fields?.date?.[0] ?? error.message)
  return error
}
