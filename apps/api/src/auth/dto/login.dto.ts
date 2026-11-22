import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

// Mesma normalização do e-mail que o seed aplica em prisma/admin-seed.ts (o seed
// não importa nada de src/): sem espaços nas pontas e em minúsculas.
function normalizeEmail({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}

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
