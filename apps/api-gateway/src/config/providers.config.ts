import { APP_FILTER } from '@nestjs/core';
import { AppService } from '../app/app.service';
import { HttpExceptionFilter } from '../app/filters/http-exception.filter';
import { GatewayService } from '../app/services/gateway.service';
import { JwtAuthGuard } from '../app/guards/jwt-auth.guard';

export const providersConfig = [
  AppService,
  GatewayService,
  JwtAuthGuard,
  {
    provide: APP_FILTER,
    useClass: HttpExceptionFilter,
  },
];
