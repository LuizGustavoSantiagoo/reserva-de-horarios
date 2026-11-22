import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class SlotsQueryDto {
  // TODO #2: a Tarefa 7 valida o formato e recusa data passada (CA11).
  @ApiPropertyOptional({
    description:
      'Dia da grade (`YYYY-MM-DD`, em America/Sao_Paulo). Sem ele, a grade é a de hoje, segundo o servidor.',
    example: '2026-11-22',
  })
  @IsOptional()
  @IsString()
  date?: string;
}
