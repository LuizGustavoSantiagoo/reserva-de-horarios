import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiOperation,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { Public } from '../common/auth/public.decorator.js';
import { Roles } from '../common/auth/roles.decorator.js';
import { CourtsService } from './courts.service.js';
import { AdminCourtDto, CreatedCourtDto } from './dto/admin-court.dto.js';
import { CourtIdParamDto } from './dto/court-id-param.dto.js';
import { CourtNameDto } from './dto/court-name.dto.js';
import { CourtDto } from './dto/court.dto.js';

// O Bearer vai em cada rota protegida, e não na classe: `GET /courts` é pública.
@ApiTags('courts')
@ApiExtraModels(CourtDto, AdminCourtDto, CreatedCourtDto)
@Controller('courts')
export class CourtsController {
  constructor(private readonly courts: CourtsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Lista as quadras ativas, por nome (rota pública)' })
  @ApiResponse({
    status: 200,
    description: 'Quadras ativas, dentro do envelope `data`',
    schema: {
      type: 'object',
      properties: {
        data: { type: 'array', items: { $ref: getSchemaPath(CourtDto) } },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Erro interno, no formato único de erro',
  })
  list(): Promise<CourtDto[]> {
    return this.courts.listActive();
  }

  @Post()
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Cadastra uma quadra ativa ligada à arena única (só ADMIN); o cliente não informa a arena',
  })
  @ApiResponse({
    status: 201,
    description:
      'Id, arenaId, nome (sem espaços nas pontas) e isActive `true` da quadra nova, dentro do envelope `data`',
    schema: {
      type: 'object',
      properties: { data: { $ref: getSchemaPath(CreatedCourtDto) } },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Nome faltando, vazio, só com espaços, com mais de 60 caracteres, que não é texto, ou campo não declarado (ex.: `arenaId`, `isActive`), com cada campo que falhou em `fields`',
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
    status: 404,
    description: '"arena não encontrada" — o seed não rodou',
  })
  @ApiResponse({
    status: 409,
    description:
      '"Já existe uma quadra com este nome." — mesmo nome de outra quadra da arena, ativa ou inativa, sem diferenciar maiúsculas nem espaços nas pontas',
  })
  @ApiResponse({
    status: 500,
    description: 'Erro interno, no formato único de erro',
  })
  create(@Body() body: CourtNameDto): Promise<CreatedCourtDto> {
    return this.courts.create(body.name);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Renomeia uma quadra, ativa ou inativa (só ADMIN); isActive não muda',
  })
  @ApiResponse({
    status: 200,
    description:
      'Id, nome novo (sem espaços nas pontas) e isActive da quadra, dentro do envelope `data`',
    schema: {
      type: 'object',
      properties: { data: { $ref: getSchemaPath(AdminCourtDto) } },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'O id não é um UUID (`fields.id`), ou o nome está faltando, vazio, só com espaços, com mais de 60 caracteres, não é texto, ou há campo não declarado, com cada campo que falhou em `fields`',
  })
  @ApiResponse({
    status: 401,
    description:
      '"Autenticação necessária." — sem token, token inválido ou vencido',
  })
  @ApiResponse({
    status: 403,
    description:
      '"Seu perfil não tem acesso a esta operação." — token de OPERATOR; recusado antes de olhar o corpo e a existência da quadra',
  })
  @ApiResponse({
    status: 404,
    description: '"quadra não encontrada" — nenhuma quadra com este id',
  })
  @ApiResponse({
    status: 409,
    description:
      '"Já existe uma quadra com este nome." — mesmo nome de outra quadra da arena, ativa ou inativa, sem diferenciar maiúsculas nem espaços nas pontas; o próprio nome não conta',
  })
  @ApiResponse({
    status: 500,
    description: 'Erro interno, no formato único de erro',
  })
  rename(
    @Param() params: CourtIdParamDto,
    @Body() body: CourtNameDto,
  ): Promise<AdminCourtDto> {
    return this.courts.rename(params.id, body.name);
  }
}
