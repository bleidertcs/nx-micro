import { Inject, Injectable } from '@nestjs/common';
import { LOGGER_TOKEN } from '@nx-microservices/observability';
// import { PrismaService } from '@nx-microservices/prisma-client';
import { Logger } from 'winston';

@Injectable()
export class AppService {
  constructor(
    @Inject(LOGGER_TOKEN) private readonly logger: Logger // private readonly prisma: PrismaService,
  ) {
    this.logger.info('AppService initialized');
  }
}
