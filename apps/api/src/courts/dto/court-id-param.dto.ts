import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

/**
 * O `:id` de `PATCH /courts/:id`. Validado por DTO (e não pelo `ParseUUIDPipe`) para o
 * 400 sair pelo ValidationPipe global, no formato único de erro com `fields.id`.
 */
export class CourtIdParamDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('all', { message: 'Informe um id de quadra válido (UUID).' })
  id: string;
}
