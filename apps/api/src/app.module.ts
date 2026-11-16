import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AllExceptionsFilter } from './common/all-exceptions.filter.js';
import { TransformInterceptor } from './common/transform.interceptor.js';
import { createValidationPipe } from './common/validation.pipe.js';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [
    AppService,
    // Registrados aqui, e não no main.ts, para valerem também nos testes de
    // ponta a ponta, que montam o AppModule sem passar pelo main.ts.
    { provide: APP_PIPE, useFactory: createValidationPipe },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
