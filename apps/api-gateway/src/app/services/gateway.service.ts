import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { LOGGER_TOKEN } from '@nx-microservices/observability';
import { Logger } from 'winston';
import { timeout } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';
import { SERVICES, TCP_CONFIG } from '../../config/constants';
import { ServiceResponse } from '../../interfaces/service-health.interface';

@Injectable()
export class GatewayService {
  constructor(
    @Inject(SERVICES.API_AUTH) private readonly apiAuthClient: ClientProxy,
    @Inject(SERVICES.NETFLIX) private readonly netflixClient: ClientProxy,
    @Inject(LOGGER_TOKEN) private readonly logger: Logger,
  ) {
    this.logger.info('Gateway Service initialized with TCP clients');
  }

  private getClient(serviceName: string): ClientProxy {
    switch (serviceName) {
      case SERVICES.API_AUTH:
        return this.apiAuthClient;
      case SERVICES.NETFLIX:
        return this.netflixClient;
      default:
        throw new Error(`Service ${serviceName} not found`);
    }
  }

  async sendCommand(serviceName: string, pattern: string, data?: any): Promise<ServiceResponse> {
    const client = this.getClient(serviceName);
    const command = { cmd: pattern };
    const payload = data ?? {};

    this.logger.info(`Sending TCP command to ${serviceName}: ${pattern}`, { command, payload });

    try {
      // Ensure client is connected
      await client.connect();

      const response = await firstValueFrom(
        client.send(command, payload).pipe(timeout(TCP_CONFIG.TIMEOUT))
      );

      this.logger.info(`TCP response from ${serviceName}`, {
        pattern,
        response,
      });

      return {
        success: true,
        data: response,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Error sending TCP command to ${serviceName}`, {
        pattern,
        command,
        error: error.message,
        errorDetails: error,
      });

      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

}
