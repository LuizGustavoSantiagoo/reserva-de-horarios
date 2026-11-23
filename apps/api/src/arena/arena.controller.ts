import { Controller, Get } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiOperation,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { ArenaService } from './arena.service.js';
import { ArenaDto } from './dto/arena.dto.js';

// Sem @Roles: estar logado basta (o AuthGuard global exige o token); ADMIN e
// OPERATOR leem a arena.
@ApiTags('arena')
@ApiBearerAuth()
@ApiExtraModels(ArenaDto)
@Controller('arena')
export class ArenaController {
  constructor(private readonly arena: ArenaService) {}

  @Get()
  @ApiOperation({
    summary:
      'A arena com todas as suas quadras, ativas e inativas, por nome (ADMIN ou OPERATOR)',
  })
  @ApiResponse({
    status: 200,
    description:
      'Id, nome e endereço da arena e as quadras só com id, nome e isActive, dentro do envelope `data`',
    schema: {
      type: 'object',
      properties: { data: { $ref: getSchemaPath(ArenaDto) } },
    },
  })
  @ApiResponse({
    status: 401,
    description:
      '"Autenticação necessária." — sem token, token inválido ou vencido',
  })
  @ApiResponse({
    status: 404,
    description: '"arena não encontrada" — o seed não rodou',
  })
  @ApiResponse({
    status: 500,
    description: 'Erro interno, no formato único de erro',
  })
  find(): Promise<ArenaDto> {
    return this.arena.findWithCourts();
  }
}
