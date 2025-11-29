import { Test } from '@nestjs/testing';
import { AppService } from './app.service';
import { LOGGER_TOKEN } from '@nx-microservices/observability';

describe('AppService', () => {
  let service: AppService;

  beforeAll(async () => {
    const app = await Test.createTestingModule({
      providers: [
        AppService,
        { provide: LOGGER_TOKEN, useValue: { info: jest.fn() } },
      ],
    }).compile();

    service = app.get<AppService>(AppService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
