import { Test, TestingModule } from '@nestjs/testing';
import { GetNetflixShowsUseCase } from './get-netflix-shows.use-case';
import { NetflixShowRepository } from '../../domain/repositories/netflix-show.repository';
import { NetflixShow } from '../../domain/entities/netflix-show.entity';
import { NETFLIX_SHOW_REPOSITORY } from '../../config/constants';

describe('GetNetflixShowsUseCase', () => {
  let useCase: GetNetflixShowsUseCase;
  let repository: NetflixShowRepository;

  const mockRepository = {
    findAll: jest.fn(),
    count: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetNetflixShowsUseCase,
        {
          provide: NETFLIX_SHOW_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetNetflixShowsUseCase>(GetNetflixShowsUseCase);
    repository = module.get<NetflixShowRepository>(NETFLIX_SHOW_REPOSITORY);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should return data and total count', async () => {
    const mockShows = [
      new NetflixShow(
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
      ),
    ];

    mockRepository.findAll.mockResolvedValue(mockShows);
    mockRepository.count.mockResolvedValue(1);

    const result = await useCase.execute({});

    expect(repository.findAll).toHaveBeenCalledWith({});
    expect(repository.count).toHaveBeenCalledWith(undefined);
    expect(result).toEqual({ data: mockShows, total: 1 });
  });

  it('should call repository with correct params', async () => {
    const params = { skip: 10, take: 20 };
    mockRepository.findAll.mockResolvedValue([]);
    mockRepository.count.mockResolvedValue(0);

    await useCase.execute(params);

    expect(repository.findAll).toHaveBeenCalledWith(params);
    expect(repository.count).toHaveBeenCalledWith(undefined);
  });

  it('should handle filters correctly', async () => {
    const filter = {
      type: 'Movie',
      release_year: 2023,
      country: 'USA',
      title: 'Test',
    };
    const params = { filter };

    mockRepository.findAll.mockResolvedValue([]);
    mockRepository.count.mockResolvedValue(0);

    await useCase.execute(params);

    expect(repository.findAll).toHaveBeenCalledWith(params);
    expect(repository.count).toHaveBeenCalledWith(filter);
  });
});
