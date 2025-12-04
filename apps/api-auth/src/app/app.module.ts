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
import { RegisterUserUseCase } from './use-cases/register-user.use-case';
import { LoginUserUseCase } from './use-cases/login-user.use-case';
import { ValidateTokenUseCase } from './use-cases/validate-token.use-case';
import { RefreshTokenUseCase } from './use-cases/refresh-token.use-case';
import { GetUserProfileUseCase } from './use-cases/get-user-profile.use-case';
import { RequestPasswordResetUseCase } from './use-cases/request-password-reset.use-case';
import { VerifyResetTokenUseCase } from './use-cases/verify-reset-token.use-case';
import { ResetPasswordUseCase } from './use-cases/reset-password.use-case';
import { ChangePasswordUseCase } from './use-cases/change-password.use-case';
import { UpdateUserProfileUseCase } from './use-cases/update-user-profile.use-case';

// Infrastructure services
import { BcryptService } from '../infrastructure/security/bcrypt.service';
import { JwtService } from '../infrastructure/security/jwt.service';
import { EmailService } from '../infrastructure/email/email.service';

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
    EmailService,
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
    RequestPasswordResetUseCase,
    VerifyResetTokenUseCase,
    ResetPasswordUseCase,
    ChangePasswordUseCase,
    UpdateUserProfileUseCase,
  ],
})
export class AppModule { }
