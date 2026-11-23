import { ApiProperty } from '@nestjs/swagger';

/** Quadra na resposta administrativa: ativa ou inativa, só id, nome e isActive. */
export class AdminCourtDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Quadra 3' })
  name: string;

  @ApiProperty({ example: true })
  isActive: boolean;
}

/** Quadra recém-cadastrada: acrescenta o `arenaId`, a ligação com a arena única. */
export class CreatedCourtDto extends AdminCourtDto {
  @ApiProperty({ format: 'uuid' })
  arenaId: string;
}
