import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service.js';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Confere que a API está no ar' })
  @ApiResponse({
    status: 200,
    description: 'Saudação, dentro do envelope `data`',
    schema: {
      type: 'object',
      properties: { data: { type: 'string', example: 'Hello World!' } },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Erro interno, no formato único de erro',
  })
  getHello(): string {
    return this.appService.getHello();
  }
}
