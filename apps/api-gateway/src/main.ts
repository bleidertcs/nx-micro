/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger, RequestMethod, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { json, urlencoded } from 'express';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { SwaggerModule } from '@nestjs/swagger';
import { swaggerConfig } from './config/swagger.config';
import { envs } from './config/envs';
import { initObservability, NestLoggerService } from '@nx-microservices/observability';


async function bootstrap() {
  // Initialize observability with the correct service name
  initObservability('api-gateway');

  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const logger = app.get(NestLoggerService);
  app.useLogger(logger);


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



// ...

  // Enable Helmet for security headers
  app.use(helmet());

  // Enable Compression
  app.use(compression());

  // Enable HTTP Request Logging
  app.use(morgan('combined'));

  // Set Body Parser Limits
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));

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
