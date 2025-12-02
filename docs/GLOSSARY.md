# Glosario de Conceptos Técnicos

Esta guía explica los conceptos y términos técnicos clave utilizados en el proyecto nx-microservices.

## 📋 Tabla de Contenidos

- [Arquitectura y Patrones](#arquitectura-y-patrones)
- [Componentes de NestJS](#componentes-de-nestjs)
- [Utilidades y Helpers](#utilidades-y-helpers)
- [Comunicación y Protocolos](#comunicación-y-protocolos)
- [Observabilidad](#observabilidad)
- [Base de Datos](#base-de-datos)
- [Validación y Seguridad](#validación-y-seguridad)
- [Herramientas de Desarrollo](#herramientas-de-desarrollo)

## Arquitectura y Patrones

### API Gateway

Un **API Gateway** es un punto único de entrada para todas las peticiones de clientes externos. Actúa como un proxy reverso que:

- Enruta peticiones HTTP a los microservicios apropiados
- Maneja autenticación y autorización
- Implementa rate limiting y seguridad
- Transforma protocolos (HTTP → TCP en nuestro caso)
- Agrega respuestas de múltiples servicios si es necesario

**En este proyecto**: `api-gateway` recibe peticiones HTTP en el puerto 3000 y las enruta a microservicios vía TCP.

### Microservicio

Un **microservicio** es un servicio pequeño e independiente que:

- Se enfoca en una única responsabilidad de negocio
- Puede ser desarrollado, desplegado y escalado independientemente
- Se comunica con otros servicios vía protocolos ligeros (TCP, HTTP, etc.)
- Tiene su propia base de datos (database per service pattern)

**En este proyecto**: `api-auth`, `netflix`, y `csv-processor` son microservicios independientes.

### Clean Architecture (Arquitectura Limpia)

Patrón arquitectónico que separa el código en capas con dependencias unidireccionales:

- **Domain**: Entidades y lógica de negocio pura (sin dependencias externas)
- **Application**: Casos de uso que orquestan la lógica de negocio
- **Infrastructure**: Implementaciones concretas (bases de datos, APIs externas)
- **Presentation**: Controllers, DTOs, interfaces de usuario

**Beneficio**: Facilita testing, mantenimiento y cambio de tecnologías sin afectar la lógica de negocio.

## Componentes de NestJS

### DTO (Data Transfer Object)

Un **DTO** es una clase que define la estructura de datos que se transfiere entre capas o servicios:

- Define qué datos se esperan en una petición o respuesta
- Incluye validaciones usando decoradores (`@IsString()`, `@IsEmail()`, etc.)
- Incluye documentación para Swagger usando `@ApiProperty()`
- Asegura type-safety en TypeScript

**Ejemplo**:

```typescript
export class LoginUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Password123' })
  @IsString()
  password!: string;
}
```

**Uso**: Validar y documentar datos de entrada en endpoints HTTP o comandos RPC.

### Middleware

Un **middleware** es una función que se ejecuta antes de que la petición llegue al controlador:

- Puede modificar el objeto request/response
- Puede terminar el ciclo request-response
- Puede llamar al siguiente middleware en la cadena
- Se usa para logging, autenticación, CORS, compresión, etc.

**Ejemplos en este proyecto**:

- `helmet()`: Agrega headers de seguridad HTTP
- `compression()`: Comprime respuestas
- `morgan()`: Registra peticiones HTTP
- `cors()`: Habilita Cross-Origin Resource Sharing

### Guard

Un **Guard** determina si una petición debe ser manejada o rechazada:

- Se ejecuta después del middleware pero antes del interceptor
- Retorna `true` (permitir) o `false` (rechazar)
- Se usa para autenticación y autorización

**Ejemplo en este proyecto**: `ThrottlerGuard` para rate limiting.

### Filter (Exception Filter)

Un **Filter** captura excepciones y las transforma en respuestas apropiadas:

- Maneja errores de manera centralizada
- Transforma excepciones en respuestas HTTP estructuradas
- Permite logging de errores consistente

**Ejemplo en este proyecto**: `RpcCustomExceptionFilter` transforma `RpcException` en respuestas HTTP.

### Pipe

Un **Pipe** transforma o valida datos de entrada:

- Se ejecuta antes de que los datos lleguen al handler del controlador
- Puede transformar datos (ej: string → number)
- Puede validar datos y lanzar excepciones si son inválidos

**Ejemplo en este proyecto**: `ValidationPipe` valida DTOs usando decoradores de `class-validator`.

## Utilidades y Helpers

### Helper

Un **helper** es una función utilitaria reutilizable que:

- Encapsula lógica común
- No tiene estado (stateless)
- Puede ser usada en múltiples contextos
- Simplifica código repetitivo

**Ejemplos en este proyecto**:

- `configureMicroservice()`: Aplica configuración estándar a microservicios
- `configureGatewayMiddleware()`: Configura middleware común de API Gateway

### Factory

Un **factory** es una función o clase que crea instancias de objetos:

- Encapsula lógica de creación compleja
- Permite configuración flexible
- Facilita testing mediante inyección de dependencias

**Ejemplo**: `ClientsModule.register()` es un factory que crea clientes TCP.

## Comunicación y Protocolos

### TCP (Transmission Control Protocol)

Protocolo de comunicación orientado a conexión que:

- Garantiza entrega ordenada de datos
- Proporciona control de flujo y congestión
- Es más confiable pero ligeramente más lento que UDP

**En este proyecto**: Los microservicios se comunican entre sí vía TCP en lugar de HTTP para mayor eficiencia.

### RPC (Remote Procedure Call)

Patrón de comunicación que permite ejecutar funciones en servicios remotos como si fueran locales:

- El cliente envía un comando con datos
- El servidor ejecuta la lógica y retorna una respuesta
- Abstrae la complejidad de la comunicación de red

**En este proyecto**: NestJS Microservices usa RPC sobre TCP con patrón request-response.

### Message Pattern

Un **Message Pattern** identifica qué handler debe procesar un mensaje RPC:

- Define el "comando" que se ejecutará en el microservicio
- Se usa con el decorador `@MessagePattern()`

**Ejemplo**:

```typescript
@MessagePattern({ cmd: 'auth.login' })
async login(@Payload() data: LoginUserDto) {
  // Lógica de login
}
```

## Observabilidad

### Observabilidad

Capacidad de entender el estado interno de un sistema basándose en sus salidas externas:

- **Traces**: Seguimiento de peticiones a través de múltiples servicios
- **Metrics**: Mediciones numéricas (latencia, throughput, errores)
- **Logs**: Registros de eventos con contexto

**En este proyecto**: OpenTelemetry recolecta traces, metrics y logs de todos los servicios.

### OpenTelemetry

Framework estándar para instrumentación de observabilidad:

- Proporciona APIs y SDKs para generar telemetría
- Soporta múltiples lenguajes y frameworks
- Permite exportar datos a diferentes backends (SigNoz, Jaeger, Prometheus)

### Trace (Traza)

Representación del camino completo de una petición a través del sistema:

- Compuesto por múltiples **spans** (segmentos)
- Cada span representa una operación (llamada HTTP, query DB, etc.)
- Permite identificar cuellos de botella y errores

## Base de Datos

### Prisma

ORM (Object-Relational Mapping) moderno para TypeScript/JavaScript:

- Define esquema de base de datos en `schema.prisma`
- Genera cliente TypeScript type-safe
- Maneja migraciones de base de datos
- Soporta múltiples bases de datos (PostgreSQL, MySQL, SQLite, etc.)

**En este proyecto**: Cada dominio tiene su propio schema Prisma y base de datos PostgreSQL.

### Migration (Migración)

Script que modifica la estructura de la base de datos:

- Crea/modifica/elimina tablas y columnas
- Mantiene historial de cambios en la base de datos
- Permite versionar el esquema de base de datos
- Facilita despliegues consistentes

**Comandos**: `pnpm prisma:test_micro:migrate`, `pnpm prisma:netflix:migrate`

### Seed

Script que puebla la base de datos con datos iniciales:

- Útil para desarrollo y testing
- Crea datos de ejemplo o configuración inicial
- Se ejecuta después de las migraciones

## Validación y Seguridad

### class-validator

Librería que valida objetos usando decoradores:

- `@IsString()`: Valida que sea string
- `@IsEmail()`: Valida formato de email
- `@MinLength(8)`: Valida longitud mínima
- `@IsOptional()`: Campo opcional

**Uso**: Validar DTOs automáticamente con `ValidationPipe`.

### JWT (JSON Web Token)

Estándar para tokens de autenticación:

- Codifica información en formato JSON
- Firmado criptográficamente (no puede ser alterado)
- Stateless (no requiere almacenamiento en servidor)
- Compuesto por: Header, Payload, Signature

**En este proyecto**: Usado para autenticación con tokens de acceso (15min) y refresh (7 días).

### CORS (Cross-Origin Resource Sharing)

Mecanismo que permite a una aplicación web acceder recursos de otro dominio:

- Navegadores bloquean peticiones cross-origin por seguridad
- CORS permite configurar qué orígenes están permitidos
- Se configura en el servidor mediante headers HTTP

## Herramientas de Desarrollo

### Nx

Sistema de build inteligente para monorepos:

- Cachea builds para evitar recompilar código sin cambios
- Analiza dependencias entre proyectos
- Ejecuta tareas en paralelo
- Proporciona generadores para crear código consistente

**Comandos**: `nx build`, `nx serve`, `nx test`

### pnpm

Gestor de paquetes rápido y eficiente:

- Usa enlaces simbólicos para ahorrar espacio en disco
- Soporta workspaces (monorepos)
- Más rápido que npm y yarn
- Lockfile estricto para builds reproducibles

---

📖 **Volver a**: [README Principal](README.md) | [Mejores Prácticas](BEST_PRACTICES.md) | [Crear Servicios](CREATING_SERVICES.md)
