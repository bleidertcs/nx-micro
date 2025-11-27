import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ObservabilityModule } from '@nx-microservices/observability';
import { PrismaClientModule } from '@nx-microservices/prisma-client';

@Module({
  imports: [
    ObservabilityModule.forRoot('service2'),
    PrismaClientModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
