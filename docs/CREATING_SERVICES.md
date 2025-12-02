# Guía para Crear Nuevos Servicios

Esta guía detalla el proceso paso a paso para crear un nuevo microservicio en el monorepo nx-microservices.

## 📋 Tabla de Contenidos

- [Paso 1: Generar la Aplicación](#paso-1-generar-la-aplicación-nestjs)
- [Paso 2: Configurar como Microservicio](#paso-2-configurar-como-microservicio-tcp)
- [Paso 3: Integrar con API Gateway](#paso-3-integrar-con-api-gateway)
- [Paso 4: Configurar Variables de Entorno](#paso-4-configurar-variables-de-entorno)
- [Paso 5: Agregar Scripts](#paso-5-agregar-scripts)
- [Paso 6: Crear Librería (Opcional)](#paso-6-crear-librería-opcional)

## Paso 1: Generar la Aplicación NestJS

Usa el generador de Nx para crear una nueva aplicación NestJS:

```bash
npx nx generate @nx/nest:application mi-nuevo-servicio --directory=apps/mi-nuevo-servicio
```

Esto creará:

- `apps/mi-nuevo-servicio/` - Directorio del servicio
- `apps/mi-nuevo-servicio-e2e/` - Tests end-to-end

## Paso 2: Configurar como Microservicio TCP

Edita `apps/mi-nuevo-servicio/src/main.ts` usando las utilidades compartidas:

```typescript
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app/app.module';
import { configureMicroservice } from '@nx-microservices/shared-lib';
import { initObservability } from '@nx-microservices/observability';
import { envs } from './config';

async function bootstrap() {
  // 1. Inicializar observabilidad
  initObservability('mi-nuevo-servicio');

  // 2. Crear microservicio
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0', // Permite conexiones desde cualquier interfaz (necesario para Docker)
      port: envs.port,
    },
  });

  // 3. Aplicar configuración estándar (ValidationPipe + ExceptionFilter)
  configureMicroservice(app);

  // 4. Iniciar servicio
  await app.listen();
  Logger.log(`🚀 Mi Nuevo Servicio running on TCP port: ${envs.port}`);
}

bootstrap();
```

### Crear Configuración de Entorno

Crea `apps/mi-nuevo-servicio/src/config/envs.ts`:

```typescript
import 'dotenv/config';
import * as joi from 'joi';

interface EnvVars {
  PORT_MI_NUEVO_SERVICIO: number;
}

const envsSchema = joi
  .object({
    PORT_MI_NUEVO_SERVICIO: joi.number().required(),
  })
  .unknown(true);

const { error, value } = envsSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

export const envs = {
  port: value.PORT_MI_NUEVO_SERVICIO,
};
```

Crea `apps/mi-nuevo-servicio/src/config/index.ts`:

```typescript
export * from './envs';
```

> **💡 Tip**: Usa `configureMicroservice()` de `@nx-microservices/shared-lib` para aplicar automáticamente ValidationPipe y RpcCustomExceptionFilter con configuración estándar.

## Paso 3: Integrar con API Gateway

### 3.1 Agregar Constante de Servicio

Edita `apps/api-gateway/src/config/constants.ts`:

```typescript
export const SERVICES = {
  // ... servicios existentes
  MI_NUEVO_SERVICIO: 'mi-nuevo-servicio',
} as const;

export const TCP_CONFIG = {
  HOST: process.env.SERVICE_HOST || '127.0.0.1',
  TIMEOUT: parseInt(process.env.TCP_TIMEOUT || '5000'),
  PORTS: {
    // ... puertos existentes
    MI_NUEVO_SERVICIO: parseInt(process.env.PORT_MI_NUEVO_SERVICIO || '3004'),
  },
} as const;
```

### 3.2 Registrar Cliente TCP

Edita `apps/api-gateway/src/config/microservices.config.ts`:

```typescript
import { ClientsModule, Transport } from '@nestjs/microservices';
import { SERVICES, TCP_CONFIG } from './constants';

export const microservicesConfig = ClientsModule.register([
  // ... clientes existentes
  {
    name: SERVICES.MI_NUEVO_SERVICIO,
    transport: Transport.TCP,
    options: {
      host: TCP_CONFIG.HOST,
      port: TCP_CONFIG.PORTS.MI_NUEVO_SERVICIO,
    },
  },
]);
```

### 3.3 Inyectar en GatewayService

Edita `apps/api-gateway/src/app/services/gateway.service.ts`:

```typescript
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { SERVICES } from '../../config/constants';

@Injectable()
export class GatewayService {
  constructor(
    // ... clientes existentes
    @Inject(SERVICES.MI_NUEVO_SERVICIO)
    private readonly miNuevoServicioClient: ClientProxy
  ) {}

  private getClient(serviceName: string): ClientProxy {
    switch (serviceName) {
      // ... casos existentes
      case SERVICES.MI_NUEVO_SERVICIO:
        return this.miNuevoServicioClient;
      default:
        throw new Error(`Service ${serviceName} not found`);
    }
  }
}
```

### 3.4 Crear Controlador en Gateway

Crea `apps/api-gateway/src/app/controllers/mi-nuevo-servicio.controller.ts`:

```typescript
import { Controller, Get, Post, Body, Param, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { SERVICES } from '../../config/constants';

@ApiTags('Mi Nuevo Servicio')
@Controller('mi-nuevo-servicio')
export class MiNuevoServicioController {
  constructor(
    @Inject(SERVICES.MI_NUEVO_SERVICIO)
    private readonly client: ClientProxy
  ) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todos los items' })
  async findAll() {
    return firstValueFrom(this.client.send({ cmd: 'mi-nuevo-servicio.findAll' }, {}));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un item por ID' })
  async findOne(@Param('id') id: string) {
    return firstValueFrom(this.client.send({ cmd: 'mi-nuevo-servicio.findOne' }, id));
  }

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo item' })
  async create(@Body() data: any) {
    return firstValueFrom(this.client.send({ cmd: 'mi-nuevo-servicio.create' }, data));
  }
}
```

### 3.5 Registrar Controlador en AppModule

Edita `apps/api-gateway/src/app/app.module.ts`:

```typescript
import { MiNuevoServicioController } from './controllers/mi-nuevo-servicio.controller';

@Module({
  imports: [
    // ... imports existentes
  ],
  controllers: [
    // ... controladores existentes
    MiNuevoServicioController,
  ],
})
export class AppModule {}
```

## Paso 4: Configurar Variables de Entorno

Agrega al archivo `.env` en la raíz del proyecto:

```env
# Mi Nuevo Servicio
PORT_MI_NUEVO_SERVICIO=3004
```

## Paso 5: Agregar Scripts

Agrega al `package.json` en la raíz:

```json
{
  "scripts": {
    "start:mi-nuevo-servicio": "nx serve mi-nuevo-servicio",
    "build:mi-nuevo-servicio": "nx build mi-nuevo-servicio",
    "test:mi-nuevo-servicio": "nx test mi-nuevo-servicio",
    "test:mi-nuevo-servicio:e2e": "nx e2e mi-nuevo-servicio-e2e"
  }
}
```

## Paso 6: Crear Librería (Opcional)

Si tu servicio necesita su propia base de datos con Prisma:

### 6.1 Generar Librería

```bash
npx nx generate @nx/nest:library mi-servicio-db --directory=libs/mi-servicio-db
```

### 6.2 Configurar Prisma

Crea `libs/mi-servicio-db/prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../src/generated/client"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL_MI_SERVICIO")
}

model MiEntidad {
  id        String   @id @default(uuid())
  nombre    String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("mi_entidad")
}
```

### 6.3 Crear PrismaService

Crea `libs/mi-servicio-db/src/lib/mi-servicio-db.service.ts`:

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../generated/client';

@Injectable()
export class MiServicioDbService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}
```

### 6.4 Agregar Scripts de Prisma

Agrega al `package.json`:

```json
{
  "scripts": {
    "prisma:mi-servicio:migrate": "dotenv -e .env -- prisma migrate dev --schema=libs/mi-servicio-db/prisma/schema.prisma --name",
    "prisma:mi-servicio:generate": "prisma generate --schema=libs/mi-servicio-db/prisma/schema.prisma",
    "prisma:mi-servicio:push": "dotenv -e .env -- prisma db push --schema=libs/mi-servicio-db/prisma/schema.prisma",
    "prisma:mi-servicio:pull": "dotenv -e .env -- prisma db pull --schema=libs/mi-servicio-db/prisma/schema.prisma"
  }
}
```

### 6.5 Agregar Variable de Entorno

Agrega al `.env`:

```env
DATABASE_URL_MI_SERVICIO=postgresql://postgres:root@localhost:5432/mi_servicio?schema=public
```

## Verificación

Después de completar todos los pasos:

1. **Build del servicio**:

   ```bash
   pnpm build:mi-nuevo-servicio
   ```

2. **Iniciar el servicio**:

   ```bash
   pnpm start:mi-nuevo-servicio
   ```

3. **Iniciar API Gateway**:

   ```bash
   pnpm start:api-gateway
   ```

4. **Verificar en Swagger**:
   - Abrir http://localhost:3000/api/docs
   - Buscar la sección "Mi Nuevo Servicio"
   - Probar los endpoints

## Próximos Pasos

1. Implementar lógica de negocio en el microservicio
2. Crear DTOs específicos del servicio
3. Implementar casos de uso siguiendo Clean Architecture
4. Agregar tests unitarios y e2e
5. Documentar endpoints en Swagger

---

📖 **Volver a**: [README Principal](../README.md) | [Glosario](GLOSSARY.md) | [Mejores Prácticas](BEST_PRACTICES.md)
