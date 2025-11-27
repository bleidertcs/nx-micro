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
    this.logger.info('AppService initialized');
  }

  async createExample(name: string) {
    this.logger.info(`Creating example with name: ${name}`);
    return this.prisma.example.create({
      data: {
        name,
      },
    });
  }

  getHello(): string {
    this.logger.info('Hello endpoint called');
    return 'Hello World!';
  }

  getHealth(): object {
    this.logger.info('Health check endpoint called');
    return {
      status: 'ok',
      service: 'service1',
      timestamp: new Date().toISOString(),
    };
  }

  exampleError(): void {
    try {
      // Simulate an error
      throw new Error('This is a test error');
    } catch (error) {
      this.logger.error('An error occurred in exampleError', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }
}
