import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ObservabilityModule } from '@nx-microservices/observability';
import { PrismaClientModule } from '@nx-microservices/test_micro';
import { RpcCustomExceptionFilter } from '@nx-microservices/shared-lib';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CsvController } from '../infrastructure/http/controllers/csv.controller';
import { ProcessCsvUseCase } from './use-cases/process-csv.use-case';
import { PrismaReviewRepository } from '../infrastructure/persistence/prisma/prisma-review.repository';

@Module({
  imports: [
    ObservabilityModule.forRoot('csv-processor'),
    PrismaClientModule,
  ],
  controllers: [AppController, CsvController],
  providers: [
    AppService,
    ProcessCsvUseCase,
    {
      provide: 'IReviewRepository',
      useClass: PrismaReviewRepository,
    },
    {
      provide: APP_FILTER,
      useClass: RpcCustomExceptionFilter,
    },
  ],
})
export class AppModule { }
