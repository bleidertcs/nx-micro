import { Controller, Inject } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AppService } from './app.service';
import { LOGGER_TOKEN } from '@nx-microservices/observability';
import { Logger } from 'winston';
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

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @Inject(LOGGER_TOKEN) private readonly logger: Logger,
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUserUseCase: LoginUserUseCase,
    private readonly validateTokenUseCase: ValidateTokenUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly getUserProfileUseCase: GetUserProfileUseCase,
    private readonly requestPasswordResetUseCase: RequestPasswordResetUseCase,
    private readonly verifyResetTokenUseCase: VerifyResetTokenUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
    private readonly updateUserProfileUseCase: UpdateUserProfileUseCase
  ) {
    this.logger.info('Auth AppController initialized');
  }

  @MessagePattern({ cmd: 'auth.register' })
  async register(
    @Payload() data: { email: string; password: string; name: string }
  ) {
    this.logger.info('Received auth.register command', { email: data.email });
    return this.registerUserUseCase.execute(data);
  }

  @MessagePattern({ cmd: 'auth.login' })
  async login(@Payload() data: { email: string; password: string }) {
    this.logger.info('Received auth.login command', { email: data.email });
    return this.loginUserUseCase.execute(data);
  }

  @MessagePattern({ cmd: 'auth.validate' })
  async validate(@Payload() data: { token: string }) {
    this.logger.info('Received auth.validate command');
    return this.validateTokenUseCase.execute(data);
  }

  @MessagePattern({ cmd: 'auth.refresh' })
  async refresh(@Payload() data: { refreshToken: string }) {
    this.logger.info('Received auth.refresh command');
    return this.refreshTokenUseCase.execute(data);
  }

  @MessagePattern({ cmd: 'auth.profile' })
  async getProfile(@Payload() data: { userId: string }) {
    this.logger.info('Received auth.profile command', { userId: data.userId });
    return this.getUserProfileUseCase.execute(data.userId);
  }

  @MessagePattern({ cmd: 'auth.request-password-reset' })
  async requestPasswordReset(@Payload() data: { email: string }) {
    this.logger.info('Received auth.request-password-reset command', {
      email: data.email,
    });
    return this.requestPasswordResetUseCase.execute(data);
  }

  @MessagePattern({ cmd: 'auth.verify-reset-token' })
  async verifyResetToken(@Payload() data: { token: string }) {
    this.logger.info('Received auth.verify-reset-token command');
    return this.verifyResetTokenUseCase.execute(data);
  }

  @MessagePattern({ cmd: 'auth.reset-password' })
  async resetPassword(
    @Payload() data: { token: string; newPassword: string }
  ) {
    this.logger.info('Received auth.reset-password command');
    return this.resetPasswordUseCase.execute(data);
  }

  @MessagePattern({ cmd: 'auth.change-password' })
  async changePassword(
    @Payload()
    data: { userId: string; currentPassword: string; newPassword: string }
  ) {
    this.logger.info('Received auth.change-password command', {
      userId: data.userId,
    });
    return this.changePasswordUseCase.execute(data);
  }

  @MessagePattern({ cmd: 'auth.update-profile' })
  async updateProfile(@Payload() data: { userId: string; name: string }) {
    this.logger.info('Received auth.update-profile command', {
      userId: data.userId,
    });
    return this.updateUserProfileUseCase.execute(data);
  }
}
