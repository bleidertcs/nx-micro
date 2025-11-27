import { Controller, Get, Post, Inject, Param, Body, Headers } from '@nestjs/common';
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

  @Get('services/health')
  async getAllServicesHealth() {
    this.logger.info('GET /services/health endpoint called - checking all services');
    return this.gatewayService.getAllServicesHealth();
  }

  @Get('services/:serviceName/health')
  async getServiceHealth(@Param('serviceName') serviceName: string) {
    this.logger.info(`GET /services/${serviceName}/health endpoint called`);
    return this.gatewayService.getServiceHealth(serviceName);
  }

  @Get('services/:serviceName/hello')
  async getServiceHello(@Param('serviceName') serviceName: string) {
    this.logger.info(`GET /services/${serviceName}/hello endpoint called`);
    return this.gatewayService.callServiceHello(serviceName);
  }

  @Get('services/:serviceName/error')
  async getServiceError(@Param('serviceName') serviceName: string) {
    this.logger.info(`GET /services/${serviceName}/error endpoint called`);
    return this.gatewayService.callServiceError(serviceName);
  }

  @Post('services/:serviceName/:command')
  async serviceCommand(
    @Param('serviceName') serviceName: string,
    @Param('command') command: string,
    @Body() body: any,
    @Headers() headers: Record<string, string>,
  ) {
    this.logger.info(`POST /services/${serviceName}/${command} endpoint called`, { body });
    return this.gatewayService.sendCommand(serviceName, command, body);
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
