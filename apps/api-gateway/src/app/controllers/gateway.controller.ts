import { Controller, Inject } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GatewayService } from '../services/gateway.service';
import { LOGGER_TOKEN } from '@nx-microservices/observability';
import { Logger } from 'winston';

@ApiTags('Gateway')
@Controller('services')
export class GatewayController {
    constructor(
        private readonly gatewayService: GatewayService,
        @Inject(LOGGER_TOKEN) private readonly logger: Logger,
    ) {
        this.logger.info('Gateway Controller initialized');
    }


}
