import { Test, TestingModule } from '@nestjs/testing';
import { PrismaNetflixRepository } from './prisma-netflix.repository';
import { PrismaNetflixService } from '@nx-microservices/prisma-netflix';
import { NetflixShow } from '../../domain/entities/netflix-show.entity';
import { LOGGER_TOKEN } from '@nx-microservices/observability';

describe('PrismaNetflixRepository', () => {
  let repository: PrismaNetflixRepository;
  let prismaService: PrismaNetflixService;

  const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };

  const mockPrismaService = {
    netflixShow: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockPrismaShow = {
    show_id: 's1',
    type: 'Movie',
    title: 'Test Movie',
    director: 'Director',
    cast_members: 'Cast',
    country: 'USA',
    date_added: new Date('2023-01-01'),
    release_year: 2023,
    rating: 'PG-13',
    duration: '120 min',
    listed_in: 'Action',
    description: 'Description',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaNetflixRepository,
        {
          provide: LOGGER_TOKEN,
          useValue: mockLogger,
        },
        {
          provide: PrismaNetflixService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<PrismaNetflixRepository>(PrismaNetflixRepository);
    prismaService = module.get<PrismaNetflixService>(PrismaNetflixService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create a new show', async () => {
      const show = new NetflixShow(
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

      mockPrismaService.netflixShow.create.mockResolvedValue(mockPrismaShow);

      const result = await repository.create(show);

      expect(prismaService.netflixShow.create).toHaveBeenCalledWith({
        data: show,
      });
      expect(mockLogger.info).toHaveBeenCalledWith(
        `Creating Netflix show: ${show.show_id}`
      );
      expect(result).toBeInstanceOf(NetflixShow);
      expect(result.show_id).toBe('s1');
    });
  });

  describe('findAll', () => {
    it('should return all shows without filters', async () => {
      mockPrismaService.netflixShow.findMany.mockResolvedValue([
        mockPrismaShow,
      ]);

      const result = await repository.findAll({});

      expect(prismaService.netflixShow.findMany).toHaveBeenCalledWith({
        skip: undefined,
        take: undefined,
        where: {},
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(NetflixShow);
    });

    it('should return shows with pagination', async () => {
      mockPrismaService.netflixShow.findMany.mockResolvedValue([
        mockPrismaShow,
      ]);

      const params = { skip: 10, take: 20 };
      await repository.findAll(params);

      expect(prismaService.netflixShow.findMany).toHaveBeenCalledWith({
        skip: 10,
        take: 20,
        where: {},
      });
    });

    it('should filter by type', async () => {
      mockPrismaService.netflixShow.findMany.mockResolvedValue([
        mockPrismaShow,
      ]);

      const filter = { type: 'Movie' };
      await repository.findAll({ filter });

      expect(prismaService.netflixShow.findMany).toHaveBeenCalledWith({
        skip: undefined,
        take: undefined,
        where: { type: 'Movie' },
      });
    });

    it('should filter by release_year', async () => {
      mockPrismaService.netflixShow.findMany.mockResolvedValue([
        mockPrismaShow,
      ]);

      const filter = { release_year: 2023 };
      await repository.findAll({ filter });

      expect(prismaService.netflixShow.findMany).toHaveBeenCalledWith({
        skip: undefined,
        take: undefined,
        where: { release_year: 2023 },
      });
    });

    it('should filter by country with case-insensitive search', async () => {
      mockPrismaService.netflixShow.findMany.mockResolvedValue([
        mockPrismaShow,
      ]);

      const filter = { country: 'USA' };
      await repository.findAll({ filter });

      expect(prismaService.netflixShow.findMany).toHaveBeenCalledWith({
        skip: undefined,
        take: undefined,
        where: { country: { contains: 'USA', mode: 'insensitive' } },
      });
    });

    it('should filter by title with case-insensitive search', async () => {
      mockPrismaService.netflixShow.findMany.mockResolvedValue([
        mockPrismaShow,
      ]);

      const filter = { title: 'Test' };
      await repository.findAll({ filter });

      expect(prismaService.netflixShow.findMany).toHaveBeenCalledWith({
        skip: undefined,
        take: undefined,
        where: { title: { contains: 'Test', mode: 'insensitive' } },
      });
    });

    it('should apply multiple filters', async () => {
      mockPrismaService.netflixShow.findMany.mockResolvedValue([
        mockPrismaShow,
      ]);

      const filter = {
        type: 'Movie',
        release_year: 2023,
        country: 'USA',
        title: 'Test',
      };
      await repository.findAll({ filter });

      expect(prismaService.netflixShow.findMany).toHaveBeenCalledWith({
        skip: undefined,
        take: undefined,
        where: {
          type: 'Movie',
          release_year: 2023,
          country: { contains: 'USA', mode: 'insensitive' },
          title: { contains: 'Test', mode: 'insensitive' },
        },
      });
    });
  });

  describe('findOne', () => {
    it('should return a show by id', async () => {
      mockPrismaService.netflixShow.findUnique.mockResolvedValue(
        mockPrismaShow
      );

      const result = await repository.findOne('s1');

      expect(prismaService.netflixShow.findUnique).toHaveBeenCalledWith({
        where: { show_id: 's1' },
      });
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Finding Netflix show by ID: s1'
      );
      expect(result).toBeInstanceOf(NetflixShow);
      expect(result?.show_id).toBe('s1');
    });

    it('should return null when show not found', async () => {
      mockPrismaService.netflixShow.findUnique.mockResolvedValue(null);

      const result = await repository.findOne('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a show', async () => {
      const updateData = { title: 'Updated Title' };
      mockPrismaService.netflixShow.update.mockResolvedValue({
        ...mockPrismaShow,
        ...updateData,
      });

      const result = await repository.update('s1', updateData);

      expect(prismaService.netflixShow.update).toHaveBeenCalledWith({
        where: { show_id: 's1' },
        data: updateData,
      });
      expect(result).toBeInstanceOf(NetflixShow);
      expect(result.title).toBe('Updated Title');
    });
  });

  describe('delete', () => {
    it('should delete a show', async () => {
      mockPrismaService.netflixShow.delete.mockResolvedValue(mockPrismaShow);

      const result = await repository.delete('s1');

      expect(prismaService.netflixShow.delete).toHaveBeenCalledWith({
        where: { show_id: 's1' },
      });
      expect(result).toBeInstanceOf(NetflixShow);
      expect(result.show_id).toBe('s1');
    });
  });

  describe('count', () => {
    it('should count all shows without filters', async () => {
      mockPrismaService.netflixShow.count.mockResolvedValue(10);

      const result = await repository.count();

      expect(prismaService.netflixShow.count).toHaveBeenCalledWith({
        where: {},
      });
      expect(result).toBe(10);
    });

    it('should count shows with filters', async () => {
      mockPrismaService.netflixShow.count.mockResolvedValue(5);

      const filter = { type: 'Movie', release_year: 2023 };
      const result = await repository.count(filter);

      expect(prismaService.netflixShow.count).toHaveBeenCalledWith({
        where: {
          type: 'Movie',
          release_year: 2023,
        },
      });
      expect(result).toBe(5);
    });
  });
});
