import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app/app.module';
import { RpcCustomExceptionFilter } from '@nx-microservices/shared-lib';
import { envs } from './config';
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


    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
        })
    );

    app.useGlobalFilters(new RpcCustomExceptionFilter());

    await app.listen();
    Logger.log(`Netflix microservice is running on TCP port: ${envs.portNetflix}`);
}

bootstrap();
