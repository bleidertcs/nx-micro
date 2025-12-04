import { Test, TestingModule } from '@nestjs/testing';
import { CreateNetflixShowUseCase } from './create-netflix-show.use-case';
import { NetflixShowRepository } from '../../domain/repositories/netflix-show.repository';
import { CreateNetflixShowDto } from '../dtos/create-netflix-show.dto';
import { NetflixShow } from '../../domain/entities/netflix-show.entity';
import { NETFLIX_SHOW_REPOSITORY } from '../../config/constants';

describe('CreateNetflixShowUseCase', () => {
  let useCase: CreateNetflixShowUseCase;
  let repository: NetflixShowRepository;

  const mockRepository = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateNetflixShowUseCase,
        {
          provide: NETFLIX_SHOW_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<CreateNetflixShowUseCase>(CreateNetflixShowUseCase);
    repository = module.get<NetflixShowRepository>(NETFLIX_SHOW_REPOSITORY);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should create a new netflix show', async () => {
    const dto: CreateNetflixShowDto = {
      show_id: 's1',
      type: 'Movie',
      title: 'Test Movie',
      director: 'Test Director',
      cast_members: 'Actor 1, Actor 2',
      country: 'USA',
      date_added: '2023-01-01',
      release_year: 2023,
      rating: 'PG-13',
      duration: '120 min',
      listed_in: 'Action',
      description: 'A test movie',
    };

    const expectedEntity = new NetflixShow(
      dto.show_id,
      dto.type,
      dto.title,
      dto.director,
      dto.cast_members,
      dto.country,
      new Date(dto.date_added!),
      dto.release_year,
      dto.rating,
      dto.duration,
      dto.listed_in,
      dto.description
    );

    mockRepository.create.mockResolvedValue(expectedEntity);

    const result = await useCase.execute(dto);

    expect(repository.create).toHaveBeenCalledWith(expect.any(NetflixShow));
    expect(result).toEqual(expectedEntity);
  });
});
