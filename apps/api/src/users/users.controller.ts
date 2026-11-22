import { Body, Controller, Get, Post } from '@nestjs/common';
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
import { Roles } from '../common/auth/roles.decorator.js';
import { CreateUserDto } from './dto/create-user.dto.js';
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

  @Post()
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Cadastra um operador (só ADMIN); o papel é sempre OPERATOR',
  })
  @ApiResponse({
    status: 201,
    description:
      'Id, e-mail (normalizado) e papel `OPERATOR` do novo usuário, dentro do envelope `data`; sem a senha nem o hash',
    schema: {
      type: 'object',
      properties: { data: { $ref: getSchemaPath(UserDto) } },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'E-mail mal formado, senha com menos de 8 caracteres, campo faltando ou campo não declarado (ex.: `role`), com cada campo que falhou em `fields`',
  })
  @ApiResponse({
    status: 401,
    description:
      '"Autenticação necessária." — sem token, token inválido ou vencido',
  })
  @ApiResponse({
    status: 403,
    description:
      '"Seu perfil não tem acesso a esta operação." — token de OPERATOR; recusado antes de olhar o corpo',
  })
  @ApiResponse({
    status: 409,
    description:
      '"Já existe uma conta com este e-mail." — mesmo com maiúsculas ou espaços diferentes',
  })
  @ApiResponse({
    status: 500,
    description: 'Erro interno, no formato único de erro',
  })
  create(@Body() body: CreateUserDto): Promise<UserDto> {
    return this.users.createOperator(body.email, body.password);
  }
}
