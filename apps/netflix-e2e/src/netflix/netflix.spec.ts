import {
  ClientProxy,
  ClientProxyFactory,
  Transport,
} from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

describe('Netflix E2E', () => {
  let client: ClientProxy;
  const testShowId = `e2e-test-${Date.now()}`;

  beforeAll(() => {
    client = ClientProxyFactory.create({
      transport: Transport.TCP,
      options: {
        host: '127.0.0.1',
        port: 3002,
      },
    });
  });

  afterAll(async () => {
    await client.close();
  });

  describe('CRUD Operations', () => {
    it('should create a new netflix show', async () => {
      const createDto = {
        show_id: testShowId,
        type: 'Movie',
        title: 'E2E Test Movie',
        director: 'Test Director',
        cast_members: 'Actor 1, Actor 2',
        country: 'USA',
        date_added: '2023-01-01',
        release_year: 2023,
        rating: 'PG-13',
        duration: '120 min',
        listed_in: 'Action, Drama',
        description: 'This is a test movie for e2e testing',
      };

      const response = await firstValueFrom(
        client.send({ cmd: 'create_netflix_show' }, createDto)
      );

      expect(response).toBeDefined();
      expect(response.show_id).toBe(testShowId);
      expect(response.title).toBe('E2E Test Movie');
      expect(response.type).toBe('Movie');
    });

    it('should get all netflix shows', async () => {
      const response = await firstValueFrom(
        client.send({ cmd: 'get_netflix_shows' }, {})
      );

      expect(response).toBeDefined();
      expect(Array.isArray(response.data)).toBeTruthy();
      expect(typeof response.total).toBe('number');
      expect(response.data.length).toBeGreaterThan(0);
    });

    it('should get shows with pagination', async () => {
      const response = await firstValueFrom(
        client.send({ cmd: 'get_netflix_shows' }, { skip: 0, take: 5 })
      );

      expect(response).toBeDefined();
      expect(Array.isArray(response.data)).toBeTruthy();
      expect(response.data.length).toBeLessThanOrEqual(5);
    });

    it('should get a single netflix show by id', async () => {
      const response = await firstValueFrom(
        client.send({ cmd: 'get_netflix_show' }, testShowId)
      );

      expect(response).toBeDefined();
      expect(response.show_id).toBe(testShowId);
      expect(response.title).toBe('E2E Test Movie');
    });

    it('should search netflix shows by title', async () => {
      const response = await firstValueFrom(
        client.send({ cmd: 'search_netflix_shows' }, 'E2E Test')
      );

      expect(response).toBeDefined();
      expect(Array.isArray(response.data)).toBeTruthy();
      expect(response.data.length).toBeGreaterThan(0);
      const found = response.data.find(
        (show: any) => show.show_id === testShowId
      );
      expect(found).toBeDefined();
    });

    it('should filter netflix shows by type', async () => {
      const response = await firstValueFrom(
        client.send(
          { cmd: 'filter_netflix_shows' },
          { type: 'Movie', year: undefined, country: undefined }
        )
      );

      expect(response).toBeDefined();
      expect(Array.isArray(response.data)).toBeTruthy();
      response.data.forEach((show: any) => {
        expect(show.type).toBe('Movie');
      });
    });

    it('should filter netflix shows by year', async () => {
      const response = await firstValueFrom(
        client.send(
          { cmd: 'filter_netflix_shows' },
          { type: undefined, year: 2023, country: undefined }
        )
      );

      expect(response).toBeDefined();
      expect(Array.isArray(response.data)).toBeTruthy();
      const found = response.data.find(
        (show: any) => show.show_id === testShowId
      );
      expect(found).toBeDefined();
    });

    it('should filter netflix shows by country', async () => {
      const response = await firstValueFrom(
        client.send(
          { cmd: 'filter_netflix_shows' },
          { type: undefined, year: undefined, country: 'USA' }
        )
      );

      expect(response).toBeDefined();
      expect(Array.isArray(response.data)).toBeTruthy();
      response.data.forEach((show: any) => {
        expect(show.country).toContain('USA');
      });
    });

    it('should update a netflix show', async () => {
      const updateDto = {
        title: 'Updated E2E Test Movie',
        description: 'Updated description for e2e testing',
      };

      const response = await firstValueFrom(
        client.send(
          { cmd: 'update_netflix_show' },
          { id: testShowId, dto: updateDto }
        )
      );

      expect(response).toBeDefined();
      expect(response.show_id).toBe(testShowId);
      expect(response.title).toBe('Updated E2E Test Movie');
      expect(response.description).toBe('Updated description for e2e testing');
    });

    it('should verify the update persisted', async () => {
      const response = await firstValueFrom(
        client.send({ cmd: 'get_netflix_show' }, testShowId)
      );

      expect(response).toBeDefined();
      expect(response.title).toBe('Updated E2E Test Movie');
      expect(response.description).toBe('Updated description for e2e testing');
    });

    it('should delete a netflix show', async () => {
      const response = await firstValueFrom(
        client.send({ cmd: 'delete_netflix_show' }, testShowId)
      );

      expect(response).toBeDefined();
      expect(response.show_id).toBe(testShowId);
    });

    it('should throw error when getting deleted show', async () => {
      try {
        await firstValueFrom(
          client.send({ cmd: 'get_netflix_show' }, testShowId)
        );
        fail('Should have thrown an error');
      } catch (error: any) {
        // RPC errors come wrapped in an error object
        expect(error).toBeDefined();
        // The error should indicate the show was not found
        const errorMessage =
          error.message || error.error || JSON.stringify(error);
        expect(
          errorMessage.includes('not found') ||
            errorMessage.includes('Internal server error')
        ).toBeTruthy();
      }
    });
  });
});
