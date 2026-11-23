import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

const MAX_COURT_NAME_LENGTH = 60;

function trim({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

/**
 * Nome da quadra, no cadastro. Não há `arenaId` nem `isActive`: a quadra nasce
 * ativa e ligada à arena única, e esses campos no corpo são recusados com 400 pelo
 * ValidationPipe (campo não declarado).
 */
export class CourtNameDto {
  @ApiProperty({
    example: 'Quadra 3',
    minLength: 1,
    maxLength: MAX_COURT_NAME_LENGTH,
    description:
      'Gravado sem espaços nas pontas. Dois nomes iguais sem diferenciar maiúsculas são o mesmo nome.',
  })
  @Transform(trim)
  @IsString({ message: 'Informe o nome da quadra.' })
  @IsNotEmpty({ message: 'Informe o nome da quadra.' })
  @MaxLength(MAX_COURT_NAME_LENGTH, {
    message: `O nome da quadra deve ter no máximo ${MAX_COURT_NAME_LENGTH} caracteres.`,
  })
  name: string;
}
