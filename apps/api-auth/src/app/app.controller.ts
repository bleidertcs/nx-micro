import { Controller, Inject } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AppService } from './app.service';
import { LOGGER_TOKEN } from '@nx-microservices/observability';
import { Logger } from 'winston';
import { RegisterUserUseCase } from '../application/use-cases/register-user.use-case';
import { LoginUserUseCase } from '../application/use-cases/login-user.use-case';
import { ValidateTokenUseCase } from '../application/use-cases/validate-token.use-case';
import { RefreshTokenUseCase } from '../application/use-cases/refresh-token.use-case';
import { GetUserProfileUseCase } from '../application/use-cases/get-user-profile.use-case';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @Inject(LOGGER_TOKEN) private readonly logger: Logger,
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUserUseCase: LoginUserUseCase,
    private readonly validateTokenUseCase: ValidateTokenUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly getUserProfileUseCase: GetUserProfileUseCase
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
}
