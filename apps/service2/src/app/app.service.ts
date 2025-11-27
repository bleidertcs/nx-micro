import { Inject, Injectable } from '@nestjs/common';
import { LOGGER_TOKEN } from '@nx-microservices/observability';
import { PrismaService } from '@nx-microservices/prisma-client';
import { Logger } from 'winston';

@Injectable()
export class AppService {
  constructor(
    @Inject(LOGGER_TOKEN) private readonly logger: Logger,
    private readonly prisma: PrismaService,
  ) {
    this.logger.info('Service2 Service initialized');
  }

  async findAllExamples() {
    this.logger.info('Finding all examples');
    return this.prisma.example.findMany();
  }

  getData(): { message: string } {
    this.logger.info('Service2 says hello!');
    return { message: 'Hello from Service2' };
  }

  getHealth(): object {
    this.logger.info('Service2 health check');
    return {
      status: 'ok',
      service: 'service2',
      timestamp: new Date().toISOString(),
    };
  }
}
