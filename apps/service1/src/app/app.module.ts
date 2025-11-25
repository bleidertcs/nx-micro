import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ObservabilityModule } from '@nx-microservices/observability';
import { PrismaClientModule } from '@nx-microservices/prisma-client';
import { RpcCustomExceptionFilter } from '@nx-microservices/shared-lib';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ObservabilityModule.forRoot('service1'),
    PrismaClientModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: RpcCustomExceptionFilter,
    },
  ],
})
export class AppModule { }
