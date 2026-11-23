import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { normalizeEmail } from '../../common/normalize-email.js';

const MIN_PASSWORD_LENGTH = 8;

/**
 * Cadastro de operador. Não há campo de papel: o cadastro cria sempre um OPERATOR,
 * e um `role` no corpo é campo não declarado, recusado com 400 pelo ValidationPipe.
 */
export class CreateUserDto {
  @ApiProperty({
    example: 'carla@arena.com',
    description:
      'Gravado sem espaços nas pontas e em minúsculas: " Ana@Arena.com " e "ana@arena.com" são a mesma conta.',
  })
  @Transform(normalizeEmail)
  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  email: string;

  @ApiProperty({
    format: 'password',
    minLength: MIN_PASSWORD_LENGTH,
    example: 'senha-do-operador',
  })
  @IsString({ message: 'Informe a senha.' })
  @MinLength(MIN_PASSWORD_LENGTH, {
    message: `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`,
  })
  password: string;
}
