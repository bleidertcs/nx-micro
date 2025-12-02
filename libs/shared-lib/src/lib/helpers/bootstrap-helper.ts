import { INestMicroservice, ValidationPipe } from '@nestjs/common';
import { RpcCustomExceptionFilter } from '../filters/rpc-custom-exception.filter';

/**
 * Configures common microservice settings including validation and exception handling
 * @param app - The NestJS microservice instance
 */
export function configureMicroservice(app: INestMicroservice): void {
  // Global validation pipe with whitelist and forbid non-whitelisted properties
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    })
  );

  // Global RPC exception filter
  app.useGlobalFilters(new RpcCustomExceptionFilter());
}
