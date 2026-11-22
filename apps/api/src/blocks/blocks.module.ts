import { Module } from '@nestjs/common';
import { BlocksService } from './blocks.service.js';

// Só a leitura que a grade usa; criar bloqueio (controller e rotas) é da US10 (#11).
@Module({
  providers: [BlocksService],
  exports: [BlocksService],
})
export class BlocksModule {}
