# Mejores Prácticas y Estándares de Código

Este documento define los estándares de código y mejores prácticas para el proyecto nx-microservices.

## 📋 Tabla de Contenidos

- [Configuración Estándar de Microservicios](#configuración-estándar-de-microservicios)
- [Validación de DTOs](#validación-de-dtos)
- [Uso de Librerías Compartidas](#uso-de-librerías-compartidas)
- [Arquitectura Limpia](#arquitectura-limpia-clean-architecture)
- [Configuración de Entorno](#configuración-de-entorno)
- [Logging Consistente](#logging-consistente)
- [Manejo de Errores](#manejo-de-errores)
- [Prisma](#prisma)

## Configuración Estándar de Microservicios

Todos los microservicios deben seguir esta configuración estándar en su archivo `main.ts`:

```typescript
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app/app.module';
import { configureMicroservice } from '@nx-microservices/shared-lib';
import { initObservability } from '@nx-microservices/observability';

async function bootstrap() {
  // 1. Inicializar observabilidad PRIMERO
  initObservability('nombre-servicio');

  // 2. Crear microservicio con host 0.0.0.0 (Docker-compatible)
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0', // Permite conexiones desde cualquier interfaz
      port: envs.port,
    },
  });

  // 3. Aplicar configuración estándar (ValidationPipe + ExceptionFilter)
  configureMicroservice(app);

  // 4. Iniciar servicio
  await app.listen();
  Logger.log(`🚀 Servicio corriendo en puerto TCP: ${envs.port}`);
}

bootstrap();
```

### Puntos Clave

1. **Observabilidad primero**: Siempre inicializar OpenTelemetry antes de crear la aplicación
2. **Host 0.0.0.0**: Necesario para Docker y conexiones externas
3. **Helper compartido**: Usar `configureMicroservice()` para configuración consistente
4. **Logging estructurado**: Usar Logger de NestJS o winston logger inyectado

## Validación de DTOs

Todos los DTOs deben seguir estas reglas:

### 1. Decoradores de Validación

Usar decoradores de `class-validator`:

```typescript
import { IsString, IsNotEmpty, IsEmail, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com', description: 'User email address' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: 'Password123', description: 'User password', minLength: 8 })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password!: string;

  @ApiPropertyOptional({ example: 'John Doe', description: 'User full name' })
  @IsString()
  @IsOptional()
  name?: string;
}
```

### 2. Documentación Swagger

- Usar `@ApiProperty()` para campos requeridos
- Usar `@ApiPropertyOptional()` para campos opcionales
- Incluir `example` y `description` en todos los decoradores

### 3. TypeScript Strict Mode

- Usar `!` (definite assignment assertion) en propiedades requeridas
- Usar `?` para propiedades opcionales
- Esto cumple con `strictPropertyInitialization`

## Uso de Librerías Compartidas

### DTOs de Autenticación

Usar `@nx-microservices/shared-dtos` para DTOs de autenticación:

```typescript
import { LoginUserDto, RegisterUserDto, RefreshTokenDto, ValidateTokenDto } from '@nx-microservices/shared-dtos';
```

### Configuración de Microservicios

Usar `@nx-microservices/shared-lib` para configuración estándar:

```typescript
import { configureMicroservice } from '@nx-microservices/shared-lib';
```

### Middleware de Gateway

Usar `@nx-microservices/shared-lib` para middleware común:

```typescript
import { configureGatewayMiddleware } from '@nx-microservices/shared-lib';

const app = await NestFactory.create(AppModule);
configureGatewayMiddleware(app, {
  bodyLimit: '10mb',
  cors: { origin: true, credentials: true },
});
```

### Observabilidad

Usar `@nx-microservices/observability` para logging y telemetría:

```typescript
import { initObservability, LOGGER_TOKEN } from '@nx-microservices/observability';
```

## Arquitectura Limpia (Clean Architecture)

Los servicios deben seguir esta estructura de directorios:

```
apps/mi-servicio/src/
├── app/                    # Capa de aplicación NestJS
│   ├── app.module.ts
│   └── app.controller.ts
├── application/            # Casos de uso
│   ├── use-cases/
│   └── dtos/              # DTOs internos (interfaces)
├── domain/                 # Lógica de negocio
│   ├── entities/
│   └── repositories/       # Interfaces de repositorios
├── infrastructure/         # Implementaciones
│   ├── database/           # Repositorios Prisma
│   ├── http/              # Controllers HTTP (si aplica)
│   └── security/          # Servicios de seguridad
├── config/                # Configuración
│   ├── envs.ts
│   └── index.ts
└── main.ts                # Bootstrap
```

### Principios

1. **Dependencias hacia adentro**: Domain no depende de nada, Application depende de Domain, Infrastructure depende de todo
2. **Interfaces en Domain**: Definir interfaces de repositorios en `domain/repositories`
3. **Implementaciones en Infrastructure**: Implementar repositorios en `infrastructure/database`
4. **Use Cases en Application**: Lógica de orquestación en `application/use-cases`

## Configuración de Entorno

Todos los servicios deben validar variables de entorno con `joi`:

```typescript
import 'dotenv/config';
import * as joi from 'joi';

interface EnvVars {
  PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
  // ... otras variables
}

const envsSchema = joi
  .object({
    PORT: joi.number().required(),
    DATABASE_URL: joi.string().required(),
    JWT_SECRET: joi.string().required(),
  })
  .unknown(true);

const { error, value } = envsSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

export const envs: EnvVars = value;
```

### Estructura de Config

- Archivo principal: `config/envs.ts`
- Barrel export: `config/index.ts` que exporta todo desde `envs.ts`
- Import en código: `import { envs } from './config'`

## Logging Consistente

### Usar Logger de Observabilidad

En lugar de `console.log`, usar el logger inyectado:

```typescript
import { Inject } from '@nestjs/common';
import { LOGGER_TOKEN } from '@nx-microservices/observability';
import { Logger } from 'winston';

export class MiServicio {
  constructor(@Inject(LOGGER_TOKEN) private readonly logger: Logger) {}

  metodo() {
    this.logger.info('Mensaje informativo', { metadata: 'valor' });
    this.logger.warn('Advertencia', { userId: 123 });
    this.logger.error('Error', { error: 'detalles', stack: error.stack });
  }
}
```

### Niveles de Log

- `info`: Información general del flujo
- `warn`: Situaciones anormales pero manejables
- `error`: Errores que requieren atención
- `debug`: Información detallada para debugging (solo en desarrollo)

### Contexto en Logs

Siempre incluir contexto relevante como segundo parámetro:

```typescript
this.logger.info('User logged in', {
  userId: user.id,
  email: user.email,
  timestamp: new Date().toISOString(),
});
```

## Manejo de Errores

### En Microservicios

Lanzar `RpcException` con estructura consistente:

```typescript
import { RpcException } from '@nestjs/microservices';

// Error con status y mensaje
throw new RpcException({
  status: 404,
  message: 'Recurso no encontrado',
});

// Error con datos adicionales
throw new RpcException({
  status: 400,
  message: 'Validación fallida',
  errors: ['Email inválido', 'Password muy corto'],
});
```

### En API Gateway

Los errores RPC se transforman automáticamente vía `RpcCustomExceptionFilter`. No es necesario código adicional.

### Códigos de Status Comunes

- `400`: Bad Request - Datos inválidos
- `401`: Unauthorized - No autenticado
- `403`: Forbidden - No autorizado
- `404`: Not Found - Recurso no existe
- `409`: Conflict - Conflicto (ej: email duplicado)
- `500`: Internal Server Error - Error del servidor

## Prisma

### Esquemas Separados

Cada dominio debe tener su propia base de datos y schema Prisma:

- `libs/test_micro/prisma/schema.prisma` - Base de datos principal
- `libs/prisma-netflix/prisma/schema.prisma` - Base de datos Netflix

### Scripts Estandarizados

Usar los scripts definidos en `package.json`:

```bash
# Migraciones
pnpm prisma:test_micro:migrate    # Migrar base de datos principal
pnpm prisma:netflix:migrate       # Migrar base de datos Netflix

# Generar clientes
pnpm prisma:generate:all          # Generar todos los clientes Prisma

# Introspección
pnpm prisma:test_micro:pull       # Actualizar schema desde DB
pnpm prisma:netflix:pull
```

### Naming Conventions

- **Modelos**: PascalCase singular (ej: `User`, `NetflixShow`)
- **Campos**: camelCase (ej: `createdAt`, `userId`)
- **Relaciones**: camelCase plural para many (ej: `posts`), singular para one (ej: `author`)

### Ejemplo de Schema

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}
```

---

📖 **Volver a**: [README Principal](../README.md) | [Glosario](GLOSSARY.md) | [Crear Servicios](CREATING_SERVICES.md)
