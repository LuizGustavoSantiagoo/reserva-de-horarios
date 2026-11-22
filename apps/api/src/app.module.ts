import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { AllExceptionsFilter } from './common/all-exceptions.filter.js';
import { AuthGuard } from './common/auth/auth.guard.js';
import { RolesGuard } from './common/auth/roles.guard.js';
import { TransformInterceptor } from './common/transform.interceptor.js';
import { createValidationPipe } from './common/validation.pipe.js';
import { validateEnv } from './config/env.validation.js';
import { CourtsModule } from './courts/courts.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { SlotsModule } from './slots/slots.module.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    PrismaModule,
    CourtsModule,
    SlotsModule,
    AuthModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Registrados aqui, e não no main.ts, para valerem também nos testes de
    // ponta a ponta, que montam o AppModule sem passar pelo main.ts.
    { provide: APP_PIPE, useFactory: createValidationPipe },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    // Nesta ordem: o AuthGuard grava o request.user que o RolesGuard lê.
    // Toda rota exige token, salvo as marcadas com @Public().
    { provide: APP_GUARD, useClass: AuthGuard },
    // Rota com @Roles(...) recusa com 403 quem tem outro papel.
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
