import { Module } from '@nestjs/common';
import { ArenaController } from './arena.controller.js';
import { ArenaService } from './arena.service.js';

@Module({
  controllers: [ArenaController],
  providers: [ArenaService],
  exports: [ArenaService],
})
export class ArenaModule {}
