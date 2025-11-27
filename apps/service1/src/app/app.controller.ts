import { Controller, Inject } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AppService } from './app.service';
import { LOGGER_TOKEN } from '@nx-microservices/observability';
import { Logger } from 'winston';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @Inject(LOGGER_TOKEN) private readonly logger: Logger,
  ) {
    this.logger.info('AppController initialized from service1');
  }

  @MessagePattern({ cmd: 'create_example' })
  createExample(@Payload() data: { name: string }) {
    this.logger.info(`CREATE_EXAMPLE message pattern called with name: ${data.name}`);
    return this.appService.createExample(data.name);
  }

  @MessagePattern({ cmd: 'hello' })
  getHello(): string {
    this.logger.info('HELLO message pattern called from service1');
    return this.appService.getHello();
  }

  @MessagePattern({ cmd: 'health' })
  getHealth() {
    this.logger.info('HEALTH message pattern called from service1');
    return this.appService.getHealth();
  }

  @MessagePattern({ cmd: 'error' })
  getError() {
    this.logger.warn('ERROR message pattern called - this will trigger an error');
    return this.appService.exampleError();
  }
}
