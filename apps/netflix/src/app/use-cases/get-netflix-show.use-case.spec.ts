import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GetNetflixShowUseCase } from './get-netflix-show.use-case';
import { NetflixShowRepository } from '../../domain/repositories/netflix-show.repository';
import { NetflixShow } from '../../domain/entities/netflix-show.entity';
import { NETFLIX_SHOW_REPOSITORY } from '../../config/constants';

describe('GetNetflixShowUseCase', () => {
  let useCase: GetNetflixShowUseCase;
  let repository: NetflixShowRepository;

  const mockRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetNetflixShowUseCase,
        {
          provide: NETFLIX_SHOW_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetNetflixShowUseCase>(GetNetflixShowUseCase);
    repository = module.get<NetflixShowRepository>(NETFLIX_SHOW_REPOSITORY);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should return show when found', async () => {
    const mockShow = new NetflixShow(
      's1',
      'Movie',
      'Test Movie',
      'Director',
      'Cast',
      'USA',
      new Date('2023-01-01'),
      2023,
      'PG-13',
      '120 min',
      'Action',
      'Description'
    );

    mockRepository.findOne.mockResolvedValue(mockShow);

    const result = await useCase.execute('s1');

    expect(repository.findOne).toHaveBeenCalledWith('s1');
    expect(result).toEqual(mockShow);
  });

  it('should throw NotFoundException when show does not exist', async () => {
    mockRepository.findOne.mockResolvedValue(null);

    await expect(useCase.execute('nonexistent')).rejects.toThrow(
      NotFoundException
    );
    await expect(useCase.execute('nonexistent')).rejects.toThrow(
      'Netflix show with ID nonexistent not found'
    );
  });
});
