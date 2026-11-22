import { Module } from '@nestjs/common';
import { SchedulesService } from './schedules.service.js';

// Só a leitura que a grade usa; o cadastro da agenda (controller e rotas) é da US08 (#9).
@Module({
  providers: [SchedulesService],
  exports: [SchedulesService],
})
export class SchedulesModule {}
