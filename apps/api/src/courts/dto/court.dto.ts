import { ApiProperty } from '@nestjs/swagger';

/** Quadra na rota pública: só o que a grade precisa para listar e escolher. */
export class CourtDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Quadra 1' })
  name: string;
}
