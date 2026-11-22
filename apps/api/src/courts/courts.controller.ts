import { Controller, Get } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOperation,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { Public } from '../common/auth/public.decorator.js';
import { CourtsService } from './courts.service.js';
import { CourtDto } from './dto/court.dto.js';

@ApiTags('courts')
@ApiExtraModels(CourtDto)
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
}
