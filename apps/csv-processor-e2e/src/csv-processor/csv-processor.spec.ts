import axios from 'axios';
import { PrismaClient } from '@nx-microservices/prisma-client';

describe('CSV Processor E2E', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = new PrismaClient();
    await prisma.$connect();
    // Clean up before test
    await prisma.review.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should process CSV and save data to database', async () => {
    // Trigger CSV processing
    const response = await axios.post('http://localhost:3000/api/csv/process');

    expect(response.status).toBe(201);
    expect(response.data).toHaveProperty('message', 'CSV processed successfully');
    expect(response.data).toHaveProperty('count');

    // Verify data in database
    const count = await prisma.review.count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBe(response.data.count);

    // Verify a sample record (assuming train.csv has specific data, or just check structure)
    const sample = await prisma.review.findFirst();
    expect(sample).toBeDefined();
    expect(sample.rating).toBeDefined();
    expect(sample.title).toBeDefined();
    expect(sample.content).toBeDefined();
  }, 300000); // Increase timeout for CSV processing (5 minutes)
});
