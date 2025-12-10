import { DynamicModule, Global, Module } from '@nestjs/common';
import { logger } from './logger';
import { NestLoggerService } from './nest-logger.service';
import * as winston from 'winston';


export const LOGGER_TOKEN = 'LOGGER';

@Global()
@Module({})
export class ObservabilityModule {
  static forRoot(serviceName: string): DynamicModule {
    // Initialize the logger with the service name
    const loggerInstance = logger.child({ service: serviceName });

    return {
      module: ObservabilityModule,
      providers: [
        {
          provide: LOGGER_TOKEN,
          useValue: loggerInstance,
        },
        {
          provide: NestLoggerService,
          useFactory: (logger: winston.Logger) => {
            return new NestLoggerService(logger);
          },
          inject: [LOGGER_TOKEN],
        },
      ],
      exports: [LOGGER_TOKEN, NestLoggerService],

    };
  }
}
