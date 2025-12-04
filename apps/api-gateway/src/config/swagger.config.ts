import { DocumentBuilder } from '@nestjs/swagger';

export const swaggerConfig = new DocumentBuilder()
    .setTitle('Microservices API')
    .setDescription('API documentation for the microservices project - includes authentication, password recovery, Netflix shows management, and CSV processing')
    .setVersion('1.0')
    .addTag('Services', 'All services')
    .addTag('CSV', 'CSV processor')
    .addTag('Netflix', 'Netflix shows management')
    .addTag('Auth', 'Authentication and authorization')
    .addBearerAuth(
        {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            name: 'JWT',
            description: 'Enter JWT token',
            in: 'header',
        },
        'access-token',
    )
    .build();
