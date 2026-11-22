import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOperation,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { Public } from '../common/auth/public.decorator.js';
import { AuthService } from './auth.service.js';
import { AccessTokenDto } from './dto/access-token.dto.js';
import { LoginDto } from './dto/login.dto.js';

@ApiTags('auth')
@ApiExtraModels(AccessTokenDto)
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Entra no painel com e-mail e senha e recebe o token (rota pública)',
  })
  @ApiResponse({
    status: 200,
    description: 'Token de acesso, dentro do envelope `data`',
    schema: {
      type: 'object',
      properties: { data: { $ref: getSchemaPath(AccessTokenDto) } },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'E-mail mal formado ou senha vazia, com o campo que falhou em `fields`',
  })
  @ApiResponse({
    status: 401,
    description:
      '"E-mail ou senha inválidos." — a mesma resposta para senha errada e e-mail inexistente',
  })
  @ApiResponse({
    status: 500,
    description: 'Erro interno, no formato único de erro',
  })
  login(@Body() body: LoginDto): Promise<AccessTokenDto> {
    return this.auth.login(body.email, body.password);
  }
}
