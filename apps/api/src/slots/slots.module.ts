import { Module } from '@nestjs/common';
import { BlocksModule } from '../blocks/blocks.module.js';
import { clockProvider } from '../common/clock.js';
import { CourtsModule } from '../courts/courts.module.js';
import { SchedulesModule } from '../schedules/schedules.module.js';
import { SlotsController } from './slots.controller.js';
import { SlotsService } from './slots.service.js';

@Module({
  imports: [CourtsModule, SchedulesModule, BlocksModule],
  controllers: [SlotsController],
  providers: [SlotsService, clockProvider],
})
export class SlotsModule {}
