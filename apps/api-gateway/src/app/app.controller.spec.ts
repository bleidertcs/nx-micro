import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GatewayService } from './services/gateway.service';
import { LOGGER_TOKEN } from '@nx-microservices/observability';

describe('AppController', () => {
  let app: TestingModule;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        { provide: AppService, useValue: {} },
        { provide: GatewayService, useValue: {} },
        { provide: LOGGER_TOKEN, useValue: { info: jest.fn() } },
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
