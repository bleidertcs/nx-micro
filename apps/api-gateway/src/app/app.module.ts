import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
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
  ],
  controllers: [
    AppController,
    GatewayController,
    CsvController,
    NetflixController,
    AuthController,
  ],
  providers: providersConfig,
})
export class AppModule { }
