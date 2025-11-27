import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { GatewayController } from './controllers/gateway.controller';
import { HealthController } from './controllers/health.controller';
import { ObservabilityModule } from '@nx-microservices/observability';
import { microservicesConfig } from '../config/microservices.config';
import { providersConfig } from '../config/providers.config';

import { CsvController } from './controllers/csv.controller';

@Module({
  imports: [
    ObservabilityModule.forRoot('api-gateway'),
    microservicesConfig,
  ],
  controllers: [AppController, GatewayController, HealthController, CsvController],
  providers: providersConfig,
})
export class AppModule { }
