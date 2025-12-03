import { Controller, Inject } from '@nestjs/common';
import { AppService } from './app.service';
import { GatewayService } from './services/gateway.service';
import { LOGGER_TOKEN } from '@nx-microservices/observability';
import { Logger } from 'winston';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly gatewayService: GatewayService,
    @Inject(LOGGER_TOKEN) private readonly logger: Logger,
  ) {
    this.logger.info('API Gateway Controller initialized');
  }


}
