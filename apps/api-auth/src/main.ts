/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app/app.module';
import { RpcCustomExceptionFilter } from '@nx-microservices/shared-lib';
import { envs } from './config/envs';
import { initObservability } from '@nx-microservices/observability';

async function bootstrap() {
  // Initialize observability with the correct service name
  initObservability('api-auth');

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options: {
        host: '0.0.0.0',
        port: envs.portApiAuth,
      },
    }
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    })
  );

  app.useGlobalFilters(new RpcCustomExceptionFilter());

  await app.listen();
  Logger.log(
    `🚀 API Auth microservice is running on TCP port: ${envs.portApiAuth}`
  );
}

bootstrap();
