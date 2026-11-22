// Acesso da grade à API, sobre o cliente único de `src/api/` (architecture §4).
// Os tipos espelham os DTOs do Swagger (`CourtDto`, `SlotGridDto`): o `schema.d.ts`
// gerado pelo `npm run api:types` fica fora do Git e não existe no build do CI.
import { apiGet } from '@/api/client'

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

/** Sem `date`, o servidor devolve a grade de hoje. */
export function getSlots(courtId: string, date?: string): Promise<SlotGrid> {
  const query = date ? `?date=${encodeURIComponent(date)}` : ''
  return apiGet<SlotGrid>(`/courts/${encodeURIComponent(courtId)}/slots${query}`)
}
