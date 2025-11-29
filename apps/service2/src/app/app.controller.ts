import { Controller, Inject } from '@nestjs/common';
import { Logger } from 'winston';
import { LOGGER_TOKEN } from '@nx-microservices/observability';

@Controller()
export class AppController {
  constructor(
    @Inject(LOGGER_TOKEN) private readonly logger: Logger,
  ) {
    this.logger.info('Service2 Controller initialized');
  }
}
