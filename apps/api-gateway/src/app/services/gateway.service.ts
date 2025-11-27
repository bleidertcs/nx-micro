import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { LOGGER_TOKEN } from '@nx-microservices/observability';
import { Logger } from 'winston';
import { timeout } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';
import { SERVICES, COMMANDS, TCP_CONFIG } from '../../config/constants';
import { ServiceHealth, AllServicesHealth, ServiceResponse } from '../../interfaces/service-health.interface';

@Injectable()
export class GatewayService {
  constructor(
    @Inject(SERVICES.SERVICE1) private readonly service1Client: ClientProxy,
    @Inject(SERVICES.SERVICE2) private readonly service2Client: ClientProxy,
    @Inject(LOGGER_TOKEN) private readonly logger: Logger,
  ) {
    this.logger.info('Gateway Service initialized with TCP clients');
  }

  private getClient(serviceName: string): ClientProxy {
    switch (serviceName) {
      case SERVICES.SERVICE1:
        return this.service1Client;
      case SERVICES.SERVICE2:
        return this.service2Client;
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

  async getServiceHealth(serviceName: string): Promise<ServiceHealth> {
    const response = await this.sendCommand(serviceName, COMMANDS.HEALTH);

    if (response.success) {
      return response.data;
    } else {
      throw new Error(response.error);
    }
  }

  async getAllServicesHealth(): Promise<AllServicesHealth> {
    const healthChecks = await Promise.allSettled(
      Object.values(SERVICES).map(async (name) => {
        try {
          const health = await this.getServiceHealth(name);
          return { service: name, status: 'healthy', ...health };
        } catch (error) {
          return { service: name, status: 'unhealthy', error: (error as Error).message };
        }
      })
    );

    return {
      gateway: {
        service: 'api-gateway',
        status: 'healthy',
        timestamp: new Date().toISOString(),
      },
      services: healthChecks.map(result =>
        result.status === 'fulfilled' ? result.value : result.reason
      ),
    };
  }

  async callServiceHello(serviceName: string): Promise<ServiceResponse> {
    return this.sendCommand(serviceName, COMMANDS.HELLO);
  }

  async callServiceError(serviceName: string): Promise<ServiceResponse> {
    return this.sendCommand(serviceName, COMMANDS.ERROR);
  }
}
