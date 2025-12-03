import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UpdateNetflixShowUseCase } from './update-netflix-show.use-case';
import { NetflixShowRepository } from '../../domain/repositories/netflix-show.repository';
import { UpdateNetflixShowDto } from '../dtos/update-netflix-show.dto';
import { NetflixShow } from '../../domain/entities/netflix-show.entity';
import { NETFLIX_SHOW_REPOSITORY } from '../../config/constants';

describe('UpdateNetflixShowUseCase', () => {
  let useCase: UpdateNetflixShowUseCase;
  let repository: NetflixShowRepository;

  const mockRepository = {
    findOne: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateNetflixShowUseCase,
        {
          provide: NETFLIX_SHOW_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<UpdateNetflixShowUseCase>(UpdateNetflixShowUseCase);
    repository = module.get<NetflixShowRepository>(NETFLIX_SHOW_REPOSITORY);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should update existing show', async () => {
    const existingShow = new NetflixShow(
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

    const dto: UpdateNetflixShowDto = {
      title: 'Updated Title',
      description: 'Updated Description',
    };

    const updatedShow = { ...existingShow, ...dto };

    mockRepository.findOne.mockResolvedValue(existingShow);
    mockRepository.update.mockResolvedValue(updatedShow);

    const result = await useCase.execute('s1', dto);

    expect(repository.findOne).toHaveBeenCalledWith('s1');
    expect(repository.update).toHaveBeenCalledWith('s1', dto);
    expect(result).toEqual(updatedShow);
  });

  it('should throw NotFoundException when show does not exist', async () => {
    mockRepository.findOne.mockResolvedValue(null);

    const dto: UpdateNetflixShowDto = { title: 'Updated' };

    await expect(useCase.execute('nonexistent', dto)).rejects.toThrow(
      NotFoundException
    );
    await expect(useCase.execute('nonexistent', dto)).rejects.toThrow(
      'Netflix show with ID nonexistent not found'
    );
  });

  it('should convert date_added string to Date object', async () => {
    const existingShow = new NetflixShow(
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

    const dto: UpdateNetflixShowDto = {
      date_added: '2024-06-15',
    };

    mockRepository.findOne.mockResolvedValue(existingShow);
    mockRepository.update.mockResolvedValue(existingShow);

    await useCase.execute('s1', dto);

    expect(repository.update).toHaveBeenCalledWith('s1', {
      date_added: new Date('2024-06-15'),
    });
  });
});
