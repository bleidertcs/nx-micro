import { Controller, Inject } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { AppService } from './app.service';
import { LOGGER_TOKEN } from '@nx-microservices/observability';
import { Logger } from 'winston';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @Inject(LOGGER_TOKEN) private readonly logger: Logger,
  ) {
    this.logger.info('Service2 Controller initialized');
  }

  @MessagePattern({ cmd: 'find_all_examples' })
  findAllExamples() {
    this.logger.info('FIND_ALL_EXAMPLES message pattern called');
    return this.appService.findAllExamples();
  }

  @MessagePattern({ cmd: 'hello' })
  getData() {
    this.logger.info('HELLO message pattern called on Service2');
    return this.appService.getData();
  }

  @MessagePattern({ cmd: 'health' })
  getHealth() {
    this.logger.info('HEALTH message pattern called on Service2');
    return this.appService.getHealth();
  }
}
