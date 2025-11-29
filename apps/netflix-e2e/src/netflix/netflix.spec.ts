import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

describe('Netflix E2E', () => {
  let client: ClientProxy;

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

  it('should handle get_netflix_shows command', async () => {
    const response = await firstValueFrom(
      client.send({ cmd: 'get_netflix_shows' }, {})
    );
    expect(response).toBeDefined();
    expect(Array.isArray(response.data)).toBeTruthy();
    expect(typeof response.total).toBe('number');
  });
});
