import { Controller, Get, Post, Inject, Param, Body, Headers } from '@nestjs/common';
import { GatewayService } from '../services/gateway.service';
import { LOGGER_TOKEN } from '@nx-microservices/observability';
import { Logger } from 'winston';

@Controller('services')
export class GatewayController {
    constructor(
        private readonly gatewayService: GatewayService,
        @Inject(LOGGER_TOKEN) private readonly logger: Logger,
    ) {
        this.logger.info('Gateway Controller initialized');
    }

    @Get('health')
    async getAllServicesHealth() {
        this.logger.info('GET /services/health endpoint called - checking all services');
        return this.gatewayService.getAllServicesHealth();
    }

    @Get(':serviceName/health')
    async getServiceHealth(@Param('serviceName') serviceName: string) {
        this.logger.info(`GET /services/${serviceName}/health endpoint called`);
        return this.gatewayService.getServiceHealth(serviceName);
    }

    @Get(':serviceName/hello')
    async getServiceHello(@Param('serviceName') serviceName: string) {
        this.logger.info(`GET /services/${serviceName}/hello endpoint called`);
        return this.gatewayService.callServiceHello(serviceName);
    }

    @Get(':serviceName/error')
    async getServiceError(@Param('serviceName') serviceName: string) {
        this.logger.info(`GET /services/${serviceName}/error endpoint called`);
        return this.gatewayService.callServiceError(serviceName);
    }

    @Post(':serviceName/:command')
    async serviceCommand(
        @Param('serviceName') serviceName: string,
        @Param('command') command: string,
        @Body() body: any,
        @Headers() headers: Record<string, string>,
    ) {
        this.logger.info(`POST /services/${serviceName}/${command} endpoint called`, { body });
        return this.gatewayService.sendCommand(serviceName, command, body);
    }
}
