import { ApiProperty } from '@nestjs/swagger';

/** Quadra na resposta administrativa: ativa ou inativa, só o que o painel lista. */
export class ArenaCourtDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Quadra 1' })
  name: string;

  @ApiProperty({ example: true })
  isActive: boolean;
}

/** A arena única com todas as suas quadras, ordenadas por nome. */
export class ArenaDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Arena Central' })
  name: string;

  @ApiProperty({ example: 'Rua das Quadras, 100' })
  address: string;

  @ApiProperty({ type: [ArenaCourtDto] })
  courts: ArenaCourtDto[];
}
