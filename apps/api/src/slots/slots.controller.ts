import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { Public } from '../common/auth/public.decorator.js';
import { SlotGridDto } from './dto/slot-grid.dto.js';
import { SlotsQueryDto } from './dto/slots-query.dto.js';
import { SlotsService } from './slots.service.js';

@ApiTags('slots')
@ApiExtraModels(SlotGridDto)
@Controller('courts/:courtId/slots')
export class SlotsController {
  constructor(private readonly slots: SlotsService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Grade pública de uma quadra em um dia (rota pública)',
  })
  @ApiParam({ name: 'courtId', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'A grade do dia, dentro do envelope `data`',
    schema: {
      type: 'object',
      properties: { data: { $ref: getSchemaPath(SlotGridDto) } },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      '`date` mal formada, inexistente no calendário ou antes de hoje; o campo vem em `fields.date`',
  })
  @ApiResponse({
    status: 404,
    description:
      '"Quadra não encontrada": a mesma resposta para id que não é UUID, quadra inexistente e quadra inativa',
  })
  @ApiResponse({
    status: 500,
    description: 'Erro interno, no formato único de erro',
  })
  findGrid(
    @Param('courtId') courtId: string,
    @Query() query: SlotsQueryDto,
  ): Promise<SlotGridDto> {
    return this.slots.findGrid(courtId, query.date);
  }
}
