import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, ValidateBy } from 'class-validator';

const CALENDAR_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** `YYYY-MM-DD` que existe no calendário: `2026-02-30` e `2026-13-01` não passam. */
function isCalendarDate(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const match = CALENDAR_DATE.exec(value);
  if (!match) return false;
  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export class SlotsQueryDto {
  @ApiPropertyOptional({
    description:
      'Dia da grade (`YYYY-MM-DD`, em America/Sao_Paulo), de hoje em diante. Sem ele, a grade é a de hoje, segundo o servidor.',
    example: '2026-11-22',
  })
  @IsOptional()
  @ValidateBy({
    name: 'isCalendarDate',
    validator: {
      validate: isCalendarDate,
      defaultMessage: () =>
        'Data inválida: use uma data existente no formato AAAA-MM-DD.',
    },
  })
  date?: string;
}
