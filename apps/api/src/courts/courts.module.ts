import { Module } from '@nestjs/common';
import { ArenaModule } from '../arena/arena.module.js';
import { CourtsController } from './courts.controller.js';
import { CourtsService } from './courts.service.js';

@Module({
  imports: [ArenaModule],
  controllers: [CourtsController],
  providers: [CourtsService],
  exports: [CourtsService],
})
export class CourtsModule {}
