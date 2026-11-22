import { Body, Controller, Get, Param, Post } from '@nestjs/common';
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
import { UserIdParamDto } from './dto/user-id-param.dto.js';
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

  @Get()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Lista os usuários do painel (só ADMIN)' })
  @ApiResponse({
    status: 200,
    description:
      'Todos os usuários, ordenados por e-mail, cada um só com id, e-mail e papel, dentro do envelope `data`',
    schema: {
      type: 'object',
      properties: {
        data: { type: 'array', items: { $ref: getSchemaPath(UserDto) } },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description:
      '"Autenticação necessária." — sem token, token inválido ou vencido',
  })
  @ApiResponse({
    status: 403,
    description:
      '"Seu perfil não tem acesso a esta operação." — token de OPERATOR; nenhum usuário é listado',
  })
  @ApiResponse({
    status: 500,
    description: 'Erro interno, no formato único de erro',
  })
  findAll(): Promise<UserDto[]> {
    return this.users.findAll();
  }

  // Declarada depois de `GET /users/me`: antes dela, `me` cairia na validação de UUID.
  @Get(':id')
  @ApiOperation({
    summary:
      'Consulta um usuário: o ADMIN vê qualquer um; o OPERATOR, só a si mesmo',
  })
  @ApiResponse({
    status: 200,
    description: 'Id, e-mail e papel do usuário, dentro do envelope `data`',
    schema: {
      type: 'object',
      properties: { data: { $ref: getSchemaPath(UserDto) } },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'O id não é um UUID, apontado em `fields.id`',
  })
  @ApiResponse({
    status: 401,
    description:
      '"Autenticação necessária." — sem token, token inválido ou vencido',
  })
  @ApiResponse({
    status: 403,
    description:
      '"Seu perfil não tem acesso a esta operação." — OPERATOR com id de outra pessoa, exista ela ou não',
  })
  @ApiResponse({
    status: 404,
    description: '"Usuário não encontrado." — só para o ADMIN',
  })
  @ApiResponse({
    status: 500,
    description: 'Erro interno, no formato único de erro',
  })
  findOne(
    @CurrentUser() user: AuthUser,
    @Param() params: UserIdParamDto,
  ): Promise<UserDto> {
    return this.users.findOneFor(user, params.id);
  }
}
