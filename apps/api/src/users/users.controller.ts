import { Controller, Get } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiOperation,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import type { AuthUser } from '../common/auth/auth-user.js';
import { CurrentUser } from '../common/auth/current-user.decorator.js';
import { UserDto } from './dto/user.dto.js';
import { UsersService } from './users.service.js';

// Na classe: toda rota deste controller é protegida e sai com o Bearer no Swagger.
@ApiTags('users')
@ApiBearerAuth()
@ApiExtraModels(UserDto)
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  @ApiOperation({
    summary: 'Perfil de quem está logado (ADMIN ou OPERATOR)',
  })
  @ApiResponse({
    status: 200,
    description:
      'Id, e-mail e papel do dono do token, dentro do envelope `data`',
    schema: {
      type: 'object',
      properties: { data: { $ref: getSchemaPath(UserDto) } },
    },
  })
  @ApiResponse({
    status: 401,
    description:
      '"Autenticação necessária." — sem token, token inválido, vencido ou de usuário que não existe mais',
  })
  @ApiResponse({
    status: 500,
    description: 'Erro interno, no formato único de erro',
  })
  me(@CurrentUser() user: AuthUser): Promise<UserDto> {
    return this.users.findMe(user.id);
  }
}
