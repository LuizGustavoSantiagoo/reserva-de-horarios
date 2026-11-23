import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

/**
 * O `:id` de `GET /users/:id`. Validado por DTO (e não pelo `ParseUUIDPipe`) para o
 * 400 sair no formato único de erro com `fields.id` (CA11).
 */
export class UserIdParamDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('all', { message: 'Informe um id de usuário válido (UUID).' })
  id: string;
}
