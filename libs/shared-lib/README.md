# Shared Library

Librería compartida que proporciona utilidades y componentes comunes utilizados en múltiples servicios. Incluye filtros de excepciones, helpers de configuración y middleware reutilizable.

## 📋 Tabla de Contenidos

- [Descripción](#descripción)
- [Componentes](#componentes)
- [Uso](#uso)
  - [RpcCustomExceptionFilter](#rpccustomexceptionfilter)
  - [Bootstrap Helper](#bootstrap-helper)
  - [Gateway Middleware](#gateway-middleware)

## 🎯 Descripción

La librería `@nx-microservices/shared-lib` es una librería compartida que:

- Proporciona filtros de excepciones para comunicación RPC
- Centraliza configuración común de microservicios
- Ofrece middleware reutilizable para API Gateways
- Facilita el manejo consistente de errores y configuración

## 📦 Componentes

### RpcCustomExceptionFilter

Filtro de excepciones que maneja errores de comunicación RPC y los transforma en respuestas HTTP apropiadas.

**Ubicación**: `libs/shared-lib/src/lib/filters/rpc-custom-exception.filter.ts`

### Bootstrap Helper

Función helper para configurar microservicios con settings comunes.

**Ubicación**: `libs/shared-lib/src/lib/helpers/bootstrap-helper.ts`

### Gateway Middleware

Función helper para configurar middleware común en API Gateways.

**Ubicación**: `libs/shared-lib/src/lib/middleware/gateway-middleware.ts`

## 🚀 Uso

### RpcCustomExceptionFilter

#### Importar el Filtro

```typescript
import { RpcCustomExceptionFilter } from '@nx-microservices/shared-lib';
```

#### Usar en un Microservicio

En el archivo `main.ts` de tu microservicio:

```typescript
import { RpcCustomExceptionFilter } from '@nx-microservices/shared-lib';
{{ ... }}
}

bootstrap();
```

#### Usar en el Módulo

Alternativamente, puedes registrarlo como provider en el módulo:

```typescript
import { Module } from '@nestjs/common';
{{ ... }}
  ],
})
export class AppModule {}
```

#### Funcionalidad

El filtro maneja tres tipos de errores RPC:

**1. Errores con Respuesta Vacía**

Si el error contiene "Empty response", retorna un error 500:

```typescript
{
  status: 500,
  message: "Empty response"
}
```

**2. Errores Estructurados**

Si el error es un objeto con `status` y `message`, retorna ese objeto:

```typescript
{
  status: 400,  // o el status del error
  message: "Error message"
}
```

**3. Errores Genéricos**

Para otros tipos de errores, retorna un error 400 genérico:

```typescript
{
  status: 400,
  message: "Error message"
}
```

### Bootstrap Helper

Función para configurar microservicios con settings comunes de validación y manejo de errores.

#### Importar

```typescript
import { configureMicroservice } from '@nx-microservices/shared-lib';
```

#### Uso

```typescript
import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { configureMicroservice } from '@nx-microservices/shared-lib';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0',
      port: 3001,
    },
  });

  // Aplica ValidationPipe y RpcCustomExceptionFilter
  configureMicroservice(app);

  await app.listen();
}

bootstrap();
```

#### Configuración Aplicada

La función `configureMicroservice()` configura automáticamente:

1. **ValidationPipe Global**:

   - `whitelist: true` - Elimina propiedades no definidas en el DTO
   - `forbidNonWhitelisted: true` - Lanza error si hay propiedades extra

2. **RpcCustomExceptionFilter Global**: Manejo consistente de errores RPC

### Gateway Middleware

Función para configurar middleware común en API Gateways (seguridad, compresión, logging, CORS).

#### Importar

```typescript
import { configureGatewayMiddleware } from '@nx-microservices/shared-lib';
```

#### Uso Básico

```typescript
import { NestFactory } from '@nestjs/core';
import { configureGatewayMiddleware } from '@nx-microservices/shared-lib';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Aplica todo el middleware con configuración por defecto
  configureGatewayMiddleware(app);

  await app.listen(3000);
}

bootstrap();
```

#### Uso con Opciones Personalizadas

```typescript
configureGatewayMiddleware(app, {
  enableHelmet: true,
  enableCompression: true,
  enableLogging: true,
  bodyLimit: '10mb',
  cors: {
    origin: ['http://localhost:4200', 'https://myapp.com'],
    credentials: true,
  },
});
```

#### Opciones Disponibles

```typescript
interface GatewayMiddlewareOptions {
  /** Enable helmet security headers (default: true) */
  enableHelmet?: boolean;
  /** Enable compression (default: true) */
  enableCompression?: boolean;
  /** Enable HTTP request logging with morgan (default: true) */
  enableLogging?: boolean;
  /** Body parser size limit (default: '10mb') */
  bodyLimit?: string;
  /** CORS configuration */
  cors?: {
    origin?: boolean | string | string[];
    credentials?: boolean;
  };
}
```

#### Middleware Configurado

La función `configureGatewayMiddleware()` configura:

1. **Helmet**: Headers de seguridad HTTP
2. **Compression**: Compresión gzip de respuestas
3. **Morgan**: Logging de peticiones HTTP (formato 'combined')
4. **Body Parser**: Límites configurables para JSON y URL-encoded
5. **CORS**: Configuración de Cross-Origin Resource Sharing

## 📦 Estructura

```
libs/shared-lib/
├── src/
│   ├── lib/
│   │   ├── filters/
│   │   │   └── rpc-custom-exception.filter.ts
│   │   ├── helpers/
│   │   │   └── bootstrap-helper.ts
│   │   ├── middleware/
│   │   │   └── gateway-middleware.ts
│   │   └── shared-lib.module.ts
│   └── index.ts
└── README.md
```

## 🔗 Servicios que Usan esta Librería

- **api-auth**: RpcCustomExceptionFilter
- **csv-processor**: RpcCustomExceptionFilter
- **netflix**: RpcCustomExceptionFilter
- **api-gateway**: Puede usar configureGatewayMiddleware

## 🧪 Testing

### Tests Unitarios

Ejecuta los tests de la librería:

```bash
nx test shared-lib
```

## 📚 Referencias

- [README Principal](../../README.md)
- [Documentación de NestJS Exception Filters](https://docs.nestjs.com/exception-filters)
- [Documentación de NestJS Microservices](https://docs.nestjs.com/microservices/basics)
- [Documentación de Helmet](https://helmetjs.github.io/)
- [Documentación de Morgan](https://github.com/expressjs/morgan)
