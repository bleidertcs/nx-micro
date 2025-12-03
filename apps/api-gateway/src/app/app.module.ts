import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { GatewayController } from './controllers/gateway.controller';
import { ObservabilityModule } from '@nx-microservices/observability';
import { microservicesConfig } from '../config/microservices.config';
import { providersConfig } from '../config/providers.config';

import { CsvController } from './controllers/csv.controller';
import { NetflixController } from './controllers/netflix.controller';
import { AuthController } from './controllers/auth.controller';

@Module({
  imports: [
    ObservabilityModule.forRoot('api-gateway'),
    microservicesConfig,
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 10,
    }]),
  ],
  controllers: [
    AppController,
    GatewayController,
    CsvController,
    NetflixController,
    AuthController,
  ],
  providers: [
    ...providersConfig,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }
