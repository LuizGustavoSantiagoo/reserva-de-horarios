import { ApiProperty } from '@nestjs/swagger';

export class AccessTokenDto {
  @ApiProperty({
    description:
      'JWT HS256 com `sub` (id do usuário), `role`, `iat` e `exp`; vale 8 horas por padrão. Enviar como `Authorization: Bearer <token>`.',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;
}
