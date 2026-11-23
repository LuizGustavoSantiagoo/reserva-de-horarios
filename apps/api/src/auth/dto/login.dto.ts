import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { normalizeEmail } from '../../common/normalize-email.js';

export class LoginDto {
  @ApiProperty({
    example: 'admin@exemplo.com',
    description:
      'Comparado sem espaços nas pontas e em minúsculas: " Ana@Arena.com " e "ana@arena.com" são a mesma conta.',
  })
  @Transform(normalizeEmail)
  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  email: string;

  @ApiProperty({ format: 'password', example: 'troque-esta-senha' })
  @IsString({ message: 'Informe a senha.' })
  @IsNotEmpty({ message: 'Informe a senha.' })
  password: string;
}
