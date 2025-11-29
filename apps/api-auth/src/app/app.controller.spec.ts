import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LOGGER_TOKEN } from '@nx-microservices/observability';
import { RegisterUserUseCase } from '../application/use-cases/register-user.use-case';
import { LoginUserUseCase } from '../application/use-cases/login-user.use-case';
import { ValidateTokenUseCase } from '../application/use-cases/validate-token.use-case';
import { RefreshTokenUseCase } from '../application/use-cases/refresh-token.use-case';
import { GetUserProfileUseCase } from '../application/use-cases/get-user-profile.use-case';

describe('AppController', () => {
  let app: TestingModule;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        { provide: AppService, useValue: {} },
        { provide: LOGGER_TOKEN, useValue: { info: jest.fn(), error: jest.fn() } },
        { provide: RegisterUserUseCase, useValue: {} },
        { provide: LoginUserUseCase, useValue: {} },
        { provide: ValidateTokenUseCase, useValue: {} },
        { provide: RefreshTokenUseCase, useValue: {} },
        { provide: GetUserProfileUseCase, useValue: {} },
      ],
    }).compile();
  });

  describe('root', () => {
    it('should be defined', () => {
      const controller = app.get<AppController>(AppController);
      expect(controller).toBeDefined();
    });
  });
});
