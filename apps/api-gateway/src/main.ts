/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger, RequestMethod, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { SwaggerModule } from '@nestjs/swagger';
import { swaggerConfig } from './config/swagger.config';
import { envs } from './config/envs';
import { initObservability } from '@nx-microservices/observability';

async function bootstrap() {
  // Initialize observability with the correct service name
  initObservability('api-gateway');

  const app = await NestFactory.create(AppModule);

  const globalPrefix = 'api';

  app.setGlobalPrefix(globalPrefix, {
    exclude: [{
      path: '',
      method: RequestMethod.GET,
    }]
  });

  // Swagger Setup
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

  // Enable Helmet for security headers
  app.use(helmet());

  // Enable CORS for API Gateway
  app.enableCors({
    origin: true,
    credentials: true,
  });

  await app.listen(envs.portGateway);

  Logger.log(`🚀 API Gateway is running on: http://localhost:${envs.portGateway}/${globalPrefix}`);
  Logger.log(`📝 Swagger is running on: http://localhost:${envs.portGateway}/${globalPrefix}/docs`);
}

bootstrap();
