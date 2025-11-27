/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app/app.module';
import { RpcCustomExceptionFilter } from './common/exceptions/rpc-custom-exception.filter';
import { envs } from './app/config';
import { initObservability } from '@nx-microservices/observability';

async function bootstrap() {
  // Initialize observability with the correct service name
  initObservability('service2');

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.TCP,
    options: {
      host: '127.0.0.1', // IPv4 localhost
      port: envs.portService2,
    },
  });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

  app.useGlobalFilters(new RpcCustomExceptionFilter());

  await app.listen();
  Logger.log(`🚀 Service2 microservice is running on TCP port: ${envs.portService2}`);
}

bootstrap();
