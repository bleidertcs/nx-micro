# Shared Library

Librería compartida que proporciona utilidades y componentes comunes utilizados en múltiples servicios. Actualmente incluye filtros de excepciones para manejo de errores en comunicación RPC.

## 📋 Tabla de Contenidos

- [Descripción](#descripción)
- [Componentes](#componentes)
- [Uso](#uso)
- [RpcCustomExceptionFilter](#rpccustomexceptionfilter)

## 🎯 Descripción

La librería `@nx-microservices/shared-lib` es una librería compartida que:

- Proporciona filtros de excepciones para comunicación RPC
- Centraliza utilidades comunes entre servicios
- Facilita el manejo consistente de errores en microservicios

## 📦 Componentes

### RpcCustomExceptionFilter

Filtro de excepciones que maneja errores de comunicación RPC y los transforma en respuestas HTTP apropiadas.

**Ubicación**: `libs/shared-lib/src/lib/filters/rpc-custom-exception.filter.ts`

**Funcionalidad**:
- Captura excepciones `RpcException`
- Transforma errores RPC en respuestas HTTP estructuradas
- Maneja diferentes tipos de errores RPC
- Proporciona respuestas consistentes entre servicios

## 🚀 Uso

### Importar el Filtro

```typescript
import { RpcCustomExceptionFilter } from '@nx-microservices/shared-lib';
```

### Usar en un Microservicio

En el archivo `main.ts` de tu microservicio:

```typescript
import { RpcCustomExceptionFilter } from '@nx-microservices/shared-lib';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(AppModule, {
    // ... configuración
  });

  // Aplicar el filtro globalmente
  app.useGlobalFilters(new RpcCustomExceptionFilter());

  await app.listen();
}

bootstrap();
```

### Usar en el Módulo

Alternativamente, puedes registrarlo como provider en el módulo:

```typescript
import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { RpcCustomExceptionFilter } from '@nx-microservices/shared-lib';

@Module({
  providers: [
    {
      provide: APP_FILTER,
      useClass: RpcCustomExceptionFilter,
    },
  ],
})
export class AppModule {}
```

## 🔍 RpcCustomExceptionFilter

### Funcionalidad

El filtro maneja tres tipos de errores RPC:

#### 1. Errores con Respuesta Vacía

Si el error contiene "Empty response", retorna un error 500:

```typescript
{
  status: 500,
  message: "Empty response"
}
```

#### 2. Errores Estructurados

Si el error es un objeto con `status` y `message`, retorna ese objeto:

```typescript
{
  status: 400,  // o el status del error
  message: "Error message"
}
```

#### 3. Errores Genéricos

Para otros tipos de errores, retorna un error 400 genérico:

```typescript
{
  status: 400,
  message: "Error message"
}
```

### Ejemplo de Uso

Cuando un microservicio lanza una excepción:

```typescript
// En el microservicio
throw new RpcException({
  status: 404,
  message: 'User not found',
});
```

El filtro captura esta excepción y la transforma en una respuesta HTTP apropiada cuando se comunica a través del API Gateway.

### Casos de Uso

El filtro es útil cuando:

- Un microservicio necesita retornar un error estructurado
- Se requiere consistencia en el formato de errores
- Se necesita manejar errores de comunicación RPC (timeouts, conexiones perdidas, etc.)

## 📦 Estructura

```
libs/shared-lib/
├── src/
│   ├── lib/
│   │   ├── filters/
│   │   │   └── rpc-custom-exception.filter.ts
│   │   └── shared-lib.module.ts
│   └── index.ts
└── README.md
```

## 🔗 Servicios que Usan esta Librería

- **api-auth**: Manejo de errores en autenticación
- **csv-processor**: Manejo de errores en procesamiento de CSV
- **netflix**: Manejo de errores en operaciones CRUD

## 🧪 Testing

### Tests Unitarios

Ejecuta los tests de la librería:

```bash
nx test shared-lib
```

### Ejemplo de Test

```typescript
describe('RpcCustomExceptionFilter', () => {
  it('should transform RpcException to HTTP response', () => {
    // Test implementation
  });
});
```

## 📚 Referencias

- [README Principal](../../README.md)
- [Documentación de NestJS Exception Filters](https://docs.nestjs.com/exception-filters)
- [Documentación de NestJS Microservices](https://docs.nestjs.com/microservices/basics)
- [DeepWiki - Error Handling](https://deepwiki.com/bleidertcs/nx-micro/6-error-handling)
