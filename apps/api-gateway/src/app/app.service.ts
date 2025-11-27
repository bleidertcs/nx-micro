import { Inject, Injectable } from '@nestjs/common';
import { LOGGER_TOKEN } from '@nx-microservices/observability';
import { Logger } from 'winston';

@Injectable()
export class AppService {
  constructor(
    @Inject(LOGGER_TOKEN) private readonly logger: Logger,
  ) {
    this.logger.info('API Gateway Service initialized');
  }

  getHello(): string {
    this.logger.info('API Gateway says hello!');
    return 'Hello from API Gateway!';
  }

  getHealth(): object {
    this.logger.info('API Gateway says hello!');
    return {
      status: 'ok',
      service: 'api-gateway',
      timestamp: new Date().toISOString(),
    };
  }
}
