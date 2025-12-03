import { Test, TestingModule } from '@nestjs/testing';
import { NetflixController } from './netflix.controller';
import { CreateNetflixShowUseCase } from '../../../application/use-cases/create-netflix-show.use-case';
import { GetNetflixShowsUseCase } from '../../../application/use-cases/get-netflix-shows.use-case';
import { GetNetflixShowUseCase } from '../../../application/use-cases/get-netflix-show.use-case';
import { UpdateNetflixShowUseCase } from '../../../application/use-cases/update-netflix-show.use-case';
import { DeleteNetflixShowUseCase } from '../../../application/use-cases/delete-netflix-show.use-case';
import { CreateNetflixShowDto } from '../../../application/dtos/create-netflix-show.dto';
import { UpdateNetflixShowDto } from '../../../application/dtos/update-netflix-show.dto';
import { NetflixShow } from '../../../domain/entities/netflix-show.entity';
import { LOGGER_TOKEN } from '@nx-microservices/observability';

describe('NetflixController', () => {
  let controller: NetflixController;
  let createUseCase: CreateNetflixShowUseCase;
  let getShowsUseCase: GetNetflixShowsUseCase;
  let getShowUseCase: GetNetflixShowUseCase;
  let updateUseCase: UpdateNetflixShowUseCase;
  let deleteUseCase: DeleteNetflixShowUseCase;

  const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };

  const mockCreateUseCase = {
    execute: jest.fn(),
  };

  const mockGetShowsUseCase = {
    execute: jest.fn(),
  };

  const mockGetShowUseCase = {
    execute: jest.fn(),
  };

  const mockUpdateUseCase = {
    execute: jest.fn(),
  };

  const mockDeleteUseCase = {
    execute: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NetflixController],
      providers: [
        {
          provide: CreateNetflixShowUseCase,
          useValue: mockCreateUseCase,
        },
        {
          provide: GetNetflixShowsUseCase,
          useValue: mockGetShowsUseCase,
        },
        {
          provide: GetNetflixShowUseCase,
          useValue: mockGetShowUseCase,
        },
        {
          provide: UpdateNetflixShowUseCase,
          useValue: mockUpdateUseCase,
        },
        {
          provide: DeleteNetflixShowUseCase,
          useValue: mockDeleteUseCase,
        },
        {
          provide: LOGGER_TOKEN,
          useValue: mockLogger,
        },
      ],
    }).compile();

    controller = module.get<NetflixController>(NetflixController);
    createUseCase = module.get<CreateNetflixShowUseCase>(
      CreateNetflixShowUseCase
    );
    getShowsUseCase = module.get<GetNetflixShowsUseCase>(
      GetNetflixShowsUseCase
    );
    getShowUseCase = module.get<GetNetflixShowUseCase>(GetNetflixShowUseCase);
    updateUseCase = module.get<UpdateNetflixShowUseCase>(
      UpdateNetflixShowUseCase
    );
    deleteUseCase = module.get<DeleteNetflixShowUseCase>(
      DeleteNetflixShowUseCase
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new netflix show', async () => {
      const dto: CreateNetflixShowDto = {
        show_id: 's1',
        type: 'Movie',
        title: 'Test Movie',
        director: 'Director',
        cast_members: 'Cast',
        country: 'USA',
        date_added: '2023-01-01',
        release_year: 2023,
        rating: 'PG-13',
        duration: '120 min',
        listed_in: 'Action',
        description: 'Description',
      };

      const expectedShow = new NetflixShow(
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

      mockCreateUseCase.execute.mockResolvedValue(expectedShow);

      const result = await controller.create(dto);

      expect(createUseCase.execute).toHaveBeenCalledWith(dto);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Received create_netflix_show request'
      );
      expect(result).toEqual(expectedShow);
    });
  });

  describe('findAll', () => {
    it('should return all shows with pagination', async () => {
      const params = { skip: 0, take: 10 };
      const expectedResult = { data: [], total: 0 };

      mockGetShowsUseCase.execute.mockResolvedValue(expectedResult);

      const result = await controller.findAll(params);

      expect(getShowsUseCase.execute).toHaveBeenCalledWith(params);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Received get_netflix_shows request'
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('search', () => {
    it('should search shows by title', async () => {
      const title = 'Test';
      const expectedResult = { data: [], total: 0 };

      mockGetShowsUseCase.execute.mockResolvedValue(expectedResult);

      const result = await controller.search(title);

      expect(getShowsUseCase.execute).toHaveBeenCalledWith({
        filter: { title },
      });
      expect(result).toEqual(expectedResult);
    });
  });

  describe('filter', () => {
    it('should filter shows by type, year, and country', async () => {
      const filter = { type: 'Movie', year: 2023, country: 'USA' };
      const expectedResult = { data: [], total: 0 };

      mockGetShowsUseCase.execute.mockResolvedValue(expectedResult);

      const result = await controller.filter(filter);

      expect(getShowsUseCase.execute).toHaveBeenCalledWith({
        filter: {
          type: filter.type,
          release_year: filter.year,
          country: filter.country,
        },
      });
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findOne', () => {
    it('should return a single show by id', async () => {
      const id = 's1';
      const expectedShow = new NetflixShow(
        id,
        'Movie',
        'Test',
        'Director',
        'Cast',
        'USA',
        new Date(),
        2023,
        'PG-13',
        '120 min',
        'Action',
        'Description'
      );

      mockGetShowUseCase.execute.mockResolvedValue(expectedShow);

      const result = await controller.findOne(id);

      expect(getShowUseCase.execute).toHaveBeenCalledWith(id);
      expect(mockLogger.info).toHaveBeenCalledWith(
        `Received get_netflix_show request for ID: ${id}`
      );
      expect(result).toEqual(expectedShow);
    });
  });

  describe('update', () => {
    it('should update a show', async () => {
      const id = 's1';
      const dto: UpdateNetflixShowDto = { title: 'Updated Title' };
      const payload = { id, dto };

      const expectedShow = new NetflixShow(
        id,
        'Movie',
        'Updated Title',
        'Director',
        'Cast',
        'USA',
        new Date(),
        2023,
        'PG-13',
        '120 min',
        'Action',
        'Description'
      );

      mockUpdateUseCase.execute.mockResolvedValue(expectedShow);

      const result = await controller.update(payload);

      expect(updateUseCase.execute).toHaveBeenCalledWith(id, dto);
      expect(result).toEqual(expectedShow);
    });
  });

  describe('delete', () => {
    it('should delete a show', async () => {
      const id = 's1';
      const expectedShow = new NetflixShow(
        id,
        'Movie',
        'Test',
        'Director',
        'Cast',
        'USA',
        new Date(),
        2023,
        'PG-13',
        '120 min',
        'Action',
        'Description'
      );

      mockDeleteUseCase.execute.mockResolvedValue(expectedShow);

      const result = await controller.delete(id);

      expect(deleteUseCase.execute).toHaveBeenCalledWith(id);
      expect(result).toEqual(expectedShow);
    });
  });
});
