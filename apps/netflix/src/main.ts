import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { AppModule } from './app/app.module';
import { RpcCustomExceptionFilter } from './common/exceptions/rpc-custom-exception.filter';
import { envs } from './app/config';
import { initObservability } from '@nx-microservices/observability';

async function bootstrap() {
    // Initialize observability with the correct service name
    initObservability('netflix');

    const app = await NestFactory.createMicroservice<MicroserviceOptions>(
        AppModule,
        {
            transport: Transport.TCP,
            options: {
                host: '0.0.0.0',
                port: envs.portNetflix,
            },
        }
    );

    app.useGlobalFilters(new RpcCustomExceptionFilter());

    await app.listen();
    Logger.log(`Netflix microservice is running on TCP port: ${envs.portNetflix}`);
}

bootstrap();
