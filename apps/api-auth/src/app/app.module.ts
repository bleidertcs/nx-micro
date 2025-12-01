import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { ObservabilityModule } from '@nx-microservices/observability';
import { PrismaClientModule } from '@nx-microservices/test_micro';
import { RpcCustomExceptionFilter } from '@nx-microservices/shared-lib';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Domain repositories
import { UserRepository } from '../domain/repositories/user.repository.interface';
import { PrismaUserRepository } from '../infrastructure/database/prisma-user.repository';

// Use cases
import { RegisterUserUseCase } from '../application/use-cases/register-user.use-case';
import { LoginUserUseCase } from '../application/use-cases/login-user.use-case';
import { ValidateTokenUseCase } from '../application/use-cases/validate-token.use-case';
import { RefreshTokenUseCase } from '../application/use-cases/refresh-token.use-case';
import { GetUserProfileUseCase } from '../application/use-cases/get-user-profile.use-case';

// Infrastructure services
import { BcryptService } from '../infrastructure/security/bcrypt.service';
import { JwtService } from '../infrastructure/security/jwt.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ObservabilityModule.forRoot('api-auth'),
    PrismaClientModule,
    JwtModule.register({
      global: true,
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: RpcCustomExceptionFilter,
    },
    // Infrastructure services
    BcryptService,
    JwtService,
    // Repository
    {
      provide: 'UserRepository',
      useClass: PrismaUserRepository,
    },
    // Use cases
    RegisterUserUseCase,
    LoginUserUseCase,
    ValidateTokenUseCase,
    RefreshTokenUseCase,
    GetUserProfileUseCase,
  ],
})
export class AppModule { }
