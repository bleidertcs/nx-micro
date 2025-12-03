import axios, { AxiosError } from 'axios';

describe('Netflix HTTP E2E via API Gateway', () => {
  const gatewayUrl = `http://localhost:3000/api`;
  const netflixPath = `${gatewayUrl}/services/netflix/netflix`;
  const testShowId = `e2e-http-${Date.now()}`;

  describe('CRUD Operations', () => {
    it('should create a new netflix show via POST', async () => {
      const createDto = {
        show_id: testShowId,
        type: 'Movie',
        title: 'HTTP E2E Test Movie',
        director: 'Test Director',
        cast_members: 'Actor 1, Actor 2',
        country: 'USA',
        date_added: '2023-01-01',
        release_year: 2023,
        rating: 'PG-13',
        duration: '120 min',
        listed_in: 'Action, Drama',
        description: 'This is a test movie for HTTP e2e testing',
      };

      const response = await axios.post(netflixPath, createDto);

      expect(response.status).toBe(201);
      expect(response.data).toBeDefined();
      expect(response.data.show_id).toBe(testShowId);
      expect(response.data.title).toBe('HTTP E2E Test Movie');
      expect(response.data.type).toBe('Movie');
    });

    it('should get all netflix shows via GET', async () => {
      const response = await axios.get(netflixPath);

      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data.data)).toBeTruthy();
      expect(typeof response.data.total).toBe('number');
      expect(response.data.data.length).toBeGreaterThan(0);
    });

    it('should get shows with pagination via GET with query params', async () => {
      const response = await axios.get(netflixPath, {
        params: { skip: 0, take: 5 },
      });

      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data.data)).toBeTruthy();
      expect(response.data.data.length).toBeLessThanOrEqual(5);
    });

    it('should get a single netflix show by id via GET /:id', async () => {
      const response = await axios.get(`${netflixPath}/${testShowId}`);

      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
      expect(response.data.show_id).toBe(testShowId);
      expect(response.data.title).toBe('HTTP E2E Test Movie');
    });

    it('should search netflix shows by title via GET /search', async () => {
      const response = await axios.get(`${netflixPath}/search`, {
        params: { title: 'HTTP E2E Test' },
      });

      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data.data)).toBeTruthy();
      expect(response.data.data.length).toBeGreaterThan(0);
      const found = response.data.data.find(
        (show: any) => show.show_id === testShowId
      );
      expect(found).toBeDefined();
    });

    it('should filter netflix shows by type via GET /filter', async () => {
      const response = await axios.get(`${netflixPath}/filter`, {
        params: { type: 'Movie' },
      });

      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data.data)).toBeTruthy();
      response.data.data.forEach((show: any) => {
        expect(show.type).toBe('Movie');
      });
    });

    it('should filter netflix shows by year via GET /filter', async () => {
      const response = await axios.get(`${netflixPath}/filter`, {
        params: { year: 2023 },
      });

      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data.data)).toBeTruthy();
      const found = response.data.data.find(
        (show: any) => show.show_id === testShowId
      );
      expect(found).toBeDefined();
    });

    it('should filter netflix shows by country via GET /filter', async () => {
      const response = await axios.get(`${netflixPath}/filter`, {
        params: { country: 'USA' },
      });

      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data.data)).toBeTruthy();
      response.data.data.forEach((show: any) => {
        expect(show.country).toContain('USA');
      });
    });

    it('should filter with multiple params via GET /filter', async () => {
      const response = await axios.get(`${netflixPath}/filter`, {
        params: { type: 'Movie', year: 2023, country: 'USA' },
      });

      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data.data)).toBeTruthy();
    });

    it('should update a netflix show via PUT /:id', async () => {
      const updateDto = {
        title: 'Updated HTTP E2E Test Movie',
        description: 'Updated description for HTTP e2e testing',
      };

      const response = await axios.put(
        `${netflixPath}/${testShowId}`,
        updateDto
      );

      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
      expect(response.data.show_id).toBe(testShowId);
      expect(response.data.title).toBe('Updated HTTP E2E Test Movie');
      expect(response.data.description).toBe(
        'Updated description for HTTP e2e testing'
      );
    });

    it('should verify the update persisted via GET /:id', async () => {
      const response = await axios.get(`${netflixPath}/${testShowId}`);

      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
      expect(response.data.title).toBe('Updated HTTP E2E Test Movie');
      expect(response.data.description).toBe(
        'Updated description for HTTP e2e testing'
      );
    });

    it('should delete a netflix show via DELETE /:id', async () => {
      const response = await axios.delete(`${netflixPath}/${testShowId}`);

      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
      expect(response.data.show_id).toBe(testShowId);
    });

    it('should return error when getting deleted show via GET /:id', async () => {
      try {
        await axios.get(`${netflixPath}/${testShowId}`);
        fail('Should have thrown an error');
      } catch (error) {
        const axiosError = error as AxiosError;
        // API Gateway may return 404 or 500 depending on error handling
        expect(axiosError.response?.status).toBeGreaterThanOrEqual(400);
        expect(axiosError.response?.status).toBeLessThan(600);
      }
    });
  });
});
