import { Controller, Get, Inject } from '@nestjs/common';
import { AppService } from '../app.service';
import { LOGGER_TOKEN } from '@nx-microservices/observability';
import { Logger } from 'winston';

@Controller()
export class HealthController {
    constructor(
        private readonly appService: AppService,
        @Inject(LOGGER_TOKEN) private readonly logger: Logger,
    ) {
        this.logger.info('Health Controller initialized');
    }

    @Get()
    getHello(): string {
        this.logger.info('GET / endpoint called on API Gateway');
        return this.appService.getHello();
    }

    @Get('health')
    getHealth() {
        this.logger.info('GET /health endpoint called on API Gateway');
        return this.appService.getHealth();
    }

    @Get('routes')
    getRoutes() {
        this.logger.info('GET /routes endpoint called - returning available routes');
        return {
            gateway: {
                'GET /': 'Gateway hello message',
                'GET /health': 'Gateway health check',
                'GET /services/health': 'Health of all services',
                'GET /services/:serviceName/health': 'Health of specific service',
                'GET /services/:serviceName/hello': 'Call hello command on service',
                'GET /services/:serviceName/error': 'Trigger error on service',
                'POST /services/:serviceName/:command': 'Send custom command to service',
                'GET /routes': 'Show available routes',
            },
            availableServices: ['service1', 'service2'],
            availableCommands: ['hello', 'health', 'error'],
            communication: 'TCP (Microservices)',
        };
    }
}
