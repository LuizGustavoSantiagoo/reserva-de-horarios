import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SLOT_STATUSES } from '../slot-status.js';
import type { SlotStatus } from '../slot-status.js';

/** Horário de 1 h da grade pública (valor calculado, sem tabela). */
export class SlotDto {
  @ApiProperty({
    format: 'date-time',
    example: '2026-11-22T11:00:00.000Z',
    description: 'Início do horário, em UTC',
  })
  startsAt: string;

  @ApiProperty({
    format: 'date-time',
    example: '2026-11-22T12:00:00.000Z',
    description: 'Fim do horário, em UTC (sempre 1 h depois do início)',
  })
  endsAt: string;

  @ApiProperty({ enum: SLOT_STATUSES, enumName: 'SlotStatus' })
  status: SlotStatus;

  @ApiPropertyOptional({
    example: 'Maria',
    description:
      'Primeiro nome de quem reservou; só existe em `RESERVED`. A rota pública nunca devolve telefone nem nome completo',
  })
  firstName?: string;
}

/** A grade de uma quadra em um dia. */
export class SlotGridDto {
  @ApiProperty({ format: 'uuid' })
  courtId: string;

  @ApiProperty({
    example: '2026-11-22',
    description: 'Dia da grade (`YYYY-MM-DD`, em America/Sao_Paulo)',
  })
  date: string;

  @ApiProperty({
    example: '2026-11-22',
    description:
      'Hoje (`YYYY-MM-DD`, em America/Sao_Paulo), segundo o relógio do servidor',
  })
  today: string;

  @ApiProperty({ type: [SlotDto], description: 'Horários em ordem crescente' })
  slots: SlotDto[];
}
