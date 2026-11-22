import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../../generated/prisma/enums.js';

/** Usuário do painel na saída de qualquer rota: nunca leva a senha nem o hash. */
export class UserDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'ana@arena.com' })
  email: string;

  @ApiProperty({ enum: Role, enumName: 'Role', example: Role.OPERATOR })
  role: Role;
}
