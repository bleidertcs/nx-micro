# nx-microservices

Arquitectura de microservicios de producción construida con Nx monorepo, NestJS y TypeScript. Este proyecto demuestra un ecosistema completo de microservicios con patrón API Gateway, comunicación TCP entre servicios, observabilidad con OpenTelemetry, y bases de datos separadas por dominio.

> 📚 **Documentación completa disponible en**: [DeepWiki - nx-micro](https://deepwiki.com/bleidertcs/nx-micro/1-overview)

## 📋 Tabla de Contenidos

- [Descripción General](#-descripción-general)
- [Arquitectura del Sistema](#️-arquitectura-del-sistema)
- [Stack Tecnológico](#️-stack-tecnológico)
- [Estructura del Repositorio](#-estructura-del-repositorio)
- [Servicios Principales](#-servicios-principales)
- [Librerías Compartidas](#-librerías-compartidas)
- [Inicio Rápido](#-inicio-rápido)
- [Configuración del Entorno](#️-configuración-del-entorno)
- [Cómo Funciona la Comunicación](#-cómo-funciona-la-comunicación)
- [Crear una Nueva API](#-crear-una-nueva-api)
- [Crear una Nueva Librería](#-crear-una-nueva-librería)
- [Scripts Disponibles](#-scripts-disponibles)
- [Testing](#-testing)
- [Observabilidad](#-observabilidad)
- [Documentación de APIs](#-documentación-de-apis)
- [Mejores Prácticas y Estándares de Código](#-mejores-prácticas-y-estándares-de-código)
- [Glosario de Conceptos Técnicos](#-glosario-de-conceptos-técnicos)
- [Seguridad](#-seguridad)

## 🎯 Descripción General

Este proyecto implementa una arquitectura de microservicios con las siguientes características:

- **Patrón API Gateway**: Punto único de entrada (`api-gateway`) en el puerto 3000 que enruta todas las peticiones externas a los microservicios backend
- **Aislamiento de Servicios**: Tres microservicios específicos por dominio (`api-auth`, `netflix`, `csv-processor`) que se comunican vía TCP
- **Observabilidad-First**: Todos los servicios instrumentados con OpenTelemetry desde el inicio
- **Arquitectura Monorepo**: Workspace Nx que permite librerías compartidas y herramientas consistentes entre servicios
- **Separación de Bases de Datos**: Aislamiento de datos orientado a dominio con bases de datos PostgreSQL separadas

## 🏗️ Arquitectura del Sistema

```mermaid
graph TB
    Client[Cliente / Frontend] -->|HTTP/REST :3000| Gateway[API Gateway<br/>Puerto 3000<br/>Rate Limiting<br/>JWT Auth<br/>Swagger]

    Gateway -->|TCP :3001| Auth[api-auth<br/>Puerto 3001<br/>Autenticación<br/>JWT<br/>Usuarios]
    Gateway -->|TCP :3002| Netflix[netflix<br/>Puerto 3002<br/>CRUD Shows<br/>Búsqueda<br/>Filtrado]
    Gateway -->|TCP :3003| CSV[csv-processor<br/>Puerto 3003<br/>Upload CSV<br/>Procesamiento<br/>Batch]

    Auth -->|Prisma| DB1[(test_micro<br/>PostgreSQL)]
    Netflix -->|Prisma| DB2[(netflix_shows<br/>PostgreSQL)]
    CSV -->|Prisma| DB1

    Gateway -.->|Traces/Metrics/Logs| OTel[OpenTelemetry<br/>Collector<br/>:4318]
    Auth -.->|Traces/Metrics/Logs| OTel
    Netflix -.->|Traces/Metrics/Logs| OTel
    CSV -.->|Traces/Metrics/Logs| OTel

    OTel -->|Export| SigNoz[SigNoz<br/>:8080<br/>Visualización]

    style Gateway fill:#4a90e2,stroke:#2c5aa0,color:#fff
    style Auth fill:#50c878,stroke:#2d7a4a,color:#fff
    style Netflix fill:#ff6b6b,stroke:#cc5555,color:#fff
    style CSV fill:#ffa500,stroke:#cc8400,color:#fff
    style OTel fill:#9b59b6,stroke:#7d3c98,color:#fff
    style SigNoz fill:#e74c3c,stroke:#c0392b,color:#fff
```

### Flujo de Comunicación

```mermaid
sequenceDiagram
    participant C as Cliente
    participant G as API Gateway
    participant A as api-auth
    participant N as netflix
    participant DB as Base de Datos
    participant OTel as OpenTelemetry

    Note over C,OTel: Flujo de Petición HTTP → TCP → Base de Datos

    C->>G: HTTP POST /api/auth/login
    G->>G: Rate Limiting Check
    G->>G: Validar Request
    G->>A: TCP {cmd: 'auth.login', data}
    A->>DB: Query: findByEmail
    DB-->>A: User Data
    A->>A: Validar Password (bcrypt)
    A->>A: Generar JWT Tokens
    A->>DB: Save Refresh Token
    A-->>G: {accessToken, refreshToken, user}
    G-->>C: HTTP 200 {tokens, user}

    Note over G,OTel: Observabilidad
    G->>OTel: Trace: HTTP Request
    A->>OTel: Trace: TCP Command
    A->>OTel: Trace: DB Query
```

1. **Cliente → API Gateway**: El cliente realiza peticiones HTTP/REST al API Gateway
2. **API Gateway → Microservicios**: El Gateway enruta las peticiones a los microservicios correspondientes usando TCP
3. **Microservicios → Bases de Datos**: Cada microservicio accede a su propia base de datos PostgreSQL
4. **Observabilidad**: Todos los servicios envían telemetría (traces, metrics, logs) al OpenTelemetry Collector

## 🛠️ Stack Tecnológico

| Tecnología        | Versión                      | Propósito                                                                          | Paquetes Clave                                                                               |
| ----------------- | ---------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **Nx**            | 22.0.2                       | Herramientas de monorepo, sistema de build, gestión de grafo de dependencias       | `nx`, `@nx/nest`, `@nx/node`, `@nx/webpack`                                                  |
| **NestJS**        | 11.1.9                       | Framework de microservicios, inyección de dependencias, decoradores                | `@nestjs/core`, `@nestjs/microservices`, `@nestjs/platform-express`                          |
| **TypeScript**    | 5.9.3                        | Lenguaje type-safe, definiciones de tipos compartidas entre servicios              | `typescript`, `ts-node`, `tslib`                                                             |
| **Prisma**        | 5.22.0                       | Cliente de base de datos type-safe, gestión de esquemas, migraciones               | `@prisma/client`, `prisma`, `@prisma/instrumentation`                                        |
| **PostgreSQL**    | N/A                          | Base de datos relacional, dos bases de datos separadas para aislamiento de dominio | Contenedores Docker en puerto 5432                                                           |
| **OpenTelemetry** | 1.9.0 (API)<br>0.208.0 (SDK) | Trazado distribuido, métricas, logs, instrumentación de observabilidad             | `@opentelemetry/api`, `@opentelemetry/sdk-node`, `@opentelemetry/auto-instrumentations-node` |
| **JWT**           | 11.0.1                       | Autenticación stateless, seguridad basada en tokens                                | `@nestjs/jwt`, `bcrypt` (6.0.0)                                                              |
| **Swagger**       | 11.2.3                       | Documentación de API, explorador interactivo de API                                | `@nestjs/swagger`, `swagger-ui-express`                                                      |
| **pnpm**          | Latest                       | Gestor de paquetes, gestión de workspace                                           | Lockfile: `pnpm-lock.yaml`                                                                   |

## 📁 Estructura del Repositorio

```
nx-microservices/
├── apps/
│   ├── api-gateway/          # API Gateway (puerto 3000)
│   ├── api-auth/             # Servicio de autenticación (puerto 3001)
│   ├── netflix/              # Servicio de gestión de shows (puerto 3002)
│   ├── csv-processor/        # Servicio de procesamiento CSV (puerto 3003)
│   └── *-e2e/                # Tests end-to-end para cada servicio
├── libs/
│   ├── observability/        # Librería de observabilidad OpenTelemetry
│   ├── test_micro/           # Cliente Prisma para base de datos principal
│   ├── prisma-netflix/       # Cliente Prisma para base de datos Netflix
│   ├── shared-lib/           # Utilidades, helpers y middleware compartidos
│   └── shared-dtos/          # DTOs de autenticación compartidos
├── docs/                     # Documentación adicional
├── signoz-config/            # Configuración de SigNoz
├── docker-compose.yaml       # Configuración de Docker para SigNoz
├── otel-collector-config.yaml # Configuración del OpenTelemetry Collector
├── package.json              # Dependencias y scripts del proyecto
├── nx.json                   # Configuración de Nx
└── tsconfig.base.json        # Configuración base de TypeScript con path mappings
```

El archivo `tsconfig.base.json` define mapeos de rutas como `@nx-microservices/observability` que resuelven a `libs/observability/src/index.ts`, permitiendo imports limpios sin rutas relativas.

## 🚀 Servicios Principales

### api-gateway (Puerto 3000)

Punto único de entrada para todas las peticiones externas. Implementa:

- **Prefijo Global de API**: Todos los endpoints prefijados con `/api`
- **Rate Limiting**: `ThrottlerGuard` aplica límite de 10 peticiones por 60 segundos
- **Enrutamiento de Peticiones**: Delega a microservicios backend vía TCP
- **Manejo de Errores**: Respuestas de error estandarizadas vía `HttpExceptionFilter`
- **Documentación de API**: Swagger UI disponible en `/api/docs`

📖 **Documentación detallada**: Ver [apps/api-gateway/README.md](apps/api-gateway/README.md)

### api-auth (Puerto 3001)

Maneja todas las operaciones de autenticación y gestión de usuarios:

- **Registro**: Creación de usuarios con hash de contraseñas con bcrypt
- **Login**: Estrategia de doble token (access: 15m, refresh: 7d)
- **Validación de Token**: Verificación de firma JWT
- **Refresh de Token**: Rotación de tokens para seguridad
- **Acceso a Perfil**: Endpoint protegido de perfil de usuario

📖 **Documentación detallada**: Ver [apps/api-auth/README.md](apps/api-auth/README.md)

### netflix (Puerto 3002)

Gestiona datos de shows de Netflix con operaciones CRUD completas:

- **Create/Update/Delete**: Gestión de shows con validación
- **Search**: Consulta de shows por título, género u otros campos
- **Filter**: Capacidades avanzadas de filtrado
- **Base de Datos**: Base de datos dedicada `netflix_shows`

📖 **Documentación detallada**: Ver [apps/netflix/README.md](apps/netflix/README.md)

### csv-processor (Puerto 3003)

Pipeline de procesamiento asíncrono de archivos CSV:

- **Carga de Archivos**: Maneja uploads multipart vía multer
- **Streaming**: Procesa archivos grandes sin cargar en memoria
- **Validación**: Validación a nivel de fila con logging de errores
- **Inserción por Lotes**: Agrupa 1,000 registros por operación de base de datos
- **Manejo de Errores**: Degradación elegante en filas inválidas

📖 **Documentación detallada**: Ver [apps/csv-processor/README.md](apps/csv-processor/README.md)

## 📚 Librerías Compartidas

El monorepo incluye cinco librerías compartidas que promueven la reutilización de código:

| Librería              | Nombre del Paquete                 | Propósito                                                        | Usado Por               |
| --------------------- | ---------------------------------- | ---------------------------------------------------------------- | ----------------------- |
| `libs/observability`  | `@nx-microservices/observability`  | Función de inicialización de OpenTelemetry `initObservability()` | Todos los servicios     |
| `libs/test_micro`     | `@nx-microservices/test_micro`     | Cliente Prisma para base de datos `test_micro`                   | api-auth, csv-processor |
| `libs/prisma-netflix` | `@nx-microservices/prisma-netflix` | Cliente Prisma para base de datos `netflix_shows`                | netflix                 |
| `libs/shared-lib`     | `@nx-microservices/shared-lib`     | Utilidades, helpers y middleware comunes                         | Todos los servicios     |
| `libs/shared-dtos`    | `@nx-microservices/shared-dtos`    | DTOs de autenticación compartidos                                | api-gateway, api-auth   |

La librería `observability` es particularmente crítica ya que centraliza la configuración de OpenTelemetry. Cada servicio importa y llama a `initObservability()` durante el bootstrap para habilitar trazado distribuido, recolección de métricas y correlación de logs.

La librería `shared-dtos` centraliza los DTOs de autenticación, eliminando duplicación entre servicios y asegurando consistencia en validaciones.

La librería `shared-lib` proporciona utilidades reutilizables como `configureMicroservice()` para configuración estándar de microservicios y `configureGatewayMiddleware()` para middleware de API Gateway.

📖 **Documentación detallada de cada librería**:

- [libs/observability/README.md](libs/observability/README.md)
- [libs/test_micro/README.md](libs/test_micro/README.md)
- [libs/prisma-netflix/README.md](libs/prisma-netflix/README.md)
- [libs/shared-lib/README.md](libs/shared-lib/README.md)
- [libs/shared-dtos/README.md](libs/shared-dtos/README.md)

## 🚀 Inicio Rápido

### Prerrequisitos

Asegúrate de tener instalado lo siguiente:

- [Node.js](https://nodejs.org/) (v20 o superior recomendado)
- [pnpm](https://pnpm.io/installation)
- [Docker](https://www.docker.com/get-started/) y Docker Compose

### Instalación

1. **Clonar el repositorio**:

```bash
git clone <repository-url>
cd nx-microservices
```

2. **Instalar dependencias**:

```bash
pnpm install
```

3. **Configurar variables de entorno**:
   Crea un archivo `.env` en la raíz del proyecto. Ver sección [Configuración del Entorno](#configuración-del-entorno).

4. **Iniciar bases de datos y servicios de observabilidad**:

```bash
docker-compose up -d
```

5. **Aplicar migraciones de base de datos**:

```bash
# Base de datos principal
pnpm prisma:test_micro:migrate

# Base de datos Netflix
pnpm prisma:netflix:migrate
# Seed de datos (Netflix)
npx ts-node --project libs/prisma-netflix/tsconfig.seed.json libs/prisma-netflix/seed.ts
```

6. **Iniciar todos los servicios**:

```bash
pnpm start:all
```

Los servicios estarán disponibles en:

- API Gateway: http://localhost:3000/api
- Swagger UI: http://localhost:3000/api/docs
- SigNoz: http://localhost:8080

## ⚙️ Configuración del Entorno

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
# Puertos de Servicios
PORT_GATEWAY=3000
PORT_APIAUTH=3001
PORT_NETFLIX=3002
PORT_CSV_PROCESSOR=3003

# Configuración TCP
SERVICE_HOST=127.0.0.1
TCP_TIMEOUT=5000

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production-please-use-a-strong-random-string
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Base de Datos Principal
DATABASE_URL=postgresql://postgres:root@localhost:5432/test_micro?schema=public

# Base de Datos Netflix
DATABASE_URL_NETFLIX=postgresql://postgres:root@localhost:5432/netflix_shows?schema=public

# OpenTelemetry Configuration
OTEL_SERVICE_NAME=microservices
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://localhost:4318/v1/traces
OTEL_EXPORTER_OTLP_METRICS_ENDPOINT=http://localhost:4318/v1/metrics
OTEL_METRIC_EXPORT_INTERVAL=60000
OTEL_LOG_LEVEL=info
```

## 🔄 Cómo Funciona la Comunicación

### Comunicación API Gateway → Microservicios

El API Gateway se comunica con los microservicios usando **TCP** a través de `@nestjs/microservices`. Aquí está el flujo:

```mermaid
graph LR
    subgraph "API Gateway"
        Controller[HTTP Controller]
        Service[GatewayService]
        Client1[TCP Client<br/>api-auth]
        Client2[TCP Client<br/>netflix]
        Client3[TCP Client<br/>csv-processor]
    end

    subgraph "Microservicios"
        Auth[api-auth<br/>:3001]
        Netflix[netflix<br/>:3002]
        CSV[csv-processor<br/>:3003]
    end

    Controller -->|1. Recibe HTTP| Service
    Service -->|2. Selecciona Cliente| Client1
    Service -->|2. Selecciona Cliente| Client2
    Service -->|3. Selecciona Cliente| Client3

    Client1 -->|4. TCP Command| Auth
    Client2 -->|4. TCP Command| Netflix
    Client3 -->|4. TCP Command| CSV

    Auth -->|5. Response| Client1
    Netflix -->|5. Response| Client2
    CSV -->|5. Response| Client3

    Client1 -->|6. Transforma| Service
    Client2 -->|6. Transforma| Service
    Client3 -->|6. Transforma| Service

    Service -->|7. HTTP Response| Controller

    style Service fill:#4a90e2,stroke:#2c5aa0,color:#fff
    style Auth fill:#50c878,stroke:#2d7a4a,color:#fff
    style Netflix fill:#ff6b6b,stroke:#cc5555,color:#fff
    style CSV fill:#ffa500,stroke:#cc8400,color:#fff
```

1. **Configuración de Clientes TCP** (`apps/api-gateway/src/config/microservices.config.ts`):

```typescript
export const microservicesConfig = ClientsModule.register([
  {
    name: SERVICES.API_AUTH,
    transport: Transport.TCP,
    options: {
      host: TCP_CONFIG.HOST,
      port: TCP_CONFIG.PORTS.API_AUTH,
    },
  },
  // ... otros servicios
]);
```

2. **Envío de Comandos** (`apps/api-gateway/src/app/services/gateway.service.ts`):

```typescript
async sendCommand(serviceName: string, pattern: string, data?: any) {
  const client = this.getClient(serviceName);
  const command = { cmd: pattern };

  await client.connect();
  const response = await firstValueFrom(
    client.send(command, payload).pipe(timeout(TCP_CONFIG.TIMEOUT))
  );

  return response;
}
```

3. **Recepción en Microservicios** (`apps/api-auth/src/app/app.controller.ts`):

```typescript
@MessagePattern({ cmd: 'auth.register' })
async register(@Payload() data: { email: string; password: string; name: string }) {
  return this.registerUserUseCase.execute(data);
}
```

### Patrones de Comunicación

- **Request-Response**: El Gateway envía un comando y espera una respuesta
- **Timeout**: Configurado a 5 segundos por defecto (`TCP_TIMEOUT`)
- **Error Handling**: Los errores se capturan y se devuelven como respuestas estructuradas

Para más detalles, ver la documentación de cada servicio.

## ➕ Crear una Nueva API

Para una guía detallada paso a paso sobre cómo crear, configurar e integrar nuevos microservicios, consulta:

📖 [Guía para Crear Nuevos Servicios](docs/CREATING_SERVICES.md)

## 📦 Crear una Nueva Librería

Para crear una nueva librería compartida:

### 1. Generar la librería

```bash
# Librería NestJS (si necesita módulos NestJS)
npx nx generate @nx/nest:library mi-nueva-lib

# Librería TypeScript genérica
npx nx generate @nx/js:library mi-nueva-lib
```

### 2. Configurar Path Mapping

Agrega al `tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@nx-microservices/mi-nueva-lib": ["libs/mi-nueva-lib/src/index.ts"]
    }
  }
}
```

### 3. Exportar desde index.ts

Edita `libs/mi-nueva-lib/src/index.ts`:

```typescript
export * from './lib/mi-nueva-lib';
// Exporta otros módulos según sea necesario
```

### 4. Usar en Servicios

```typescript
import { algoDeMiNuevaLib } from '@nx-microservices/mi-nueva-lib';
```

## 📜 Scripts Disponibles

### Desarrollo

```bash
# Iniciar todos los servicios
pnpm start:all

# Iniciar un servicio específico
pnpm start:api-gateway
pnpm start:api-auth
pnpm start:netflix
pnpm start:csv-processor

# Build de todos los servicios
pnpm build:all

# Build de un servicio específico
pnpm build:api-gateway
pnpm build:api-auth
pnpm build:netflix
pnpm build:csv-processor
```

### Base de Datos

```bash
# Crear y aplicar migraciones
pnpm prisma:test_micro:migrate   # Base de datos principal
pnpm prisma:netflix:migrate  # Base de datos Netflix

# Regenerar cliente Prisma
pnpm prisma:generate:all     # Generar todos los clientes

# Actualizar schema desde base de datos
pnpm prisma:test_micro:pull
pnpm prisma:netflix:pull

# Base de datos Netflix (Push directo sin migraciones)
pnpm prisma:netflix:push

# Seed de datos
npx ts-node --project libs/prisma-netflix/tsconfig.seed.json libs/prisma-netflix/seed.ts
```

### Testing

```bash
# Tests E2E de todos los servicios
pnpm test:all:e2e

# Tests E2E de un servicio específico
pnpm test:api-gateway:e2e
pnpm test:api-auth:e2e
pnpm test:netflix:e2e
pnpm test:csv-processor:e2e

# Tests unitarios (desde la raíz)
nx test <nombre-del-proyecto>
```

## 🧪 Testing

### Tests End-to-End

Los tests E2E validan el flujo completo desde el API Gateway hasta los microservicios. Cada servicio tiene su propio proyecto de tests E2E en `apps/*-e2e/`.

**Requisitos previos**:

1. Todos los servicios deben estar corriendo (`pnpm start:all`)
2. Las bases de datos deben estar configuradas y migradas

**Ejecutar tests**:

```bash
pnpm test:api-gateway:e2e
```

### Tests Unitarios

Los tests unitarios validan la lógica de negocio de cada componente. Ejecuta tests para un proyecto específico:

```bash
nx test api-auth
nx test netflix
```

## 📊 Observabilidad

El proyecto está completamente instrumentado con OpenTelemetry. Todos los servicios envían telemetría al OpenTelemetry Collector que luego la exporta a SigNoz.

```mermaid
graph TB
    subgraph "Servicios"
        G[API Gateway]
        A[api-auth]
        N[netflix]
        C[csv-processor]
    end

    subgraph "OpenTelemetry SDK"
        SDK1[OTel SDK<br/>Traces]
        SDK2[OTel SDK<br/>Metrics]
        SDK3[OTel SDK<br/>Logs]
    end

    subgraph "OpenTelemetry Collector"
        RC[OTLP Receiver<br/>:4318]
        PE[Processor]
        EX[Exporter]
    end

    subgraph "SigNoz"
        S[SigNoz UI<br/>:8080]
        CH[ClickHouse<br/>Storage]
    end

    G -->|Traces| SDK1
    A -->|Traces| SDK1
    N -->|Traces| SDK1
    C -->|Traces| SDK1

    G -->|Metrics| SDK2
    A -->|Metrics| SDK2
    N -->|Metrics| SDK2
    C -->|Metrics| SDK2

    G -->|Logs| SDK3
    A -->|Logs| SDK3
    N -->|Logs| SDK3
    C -->|Logs| SDK3

    SDK1 -->|OTLP HTTP| RC
    SDK2 -->|OTLP HTTP| RC
    SDK3 -->|OTLP HTTP| RC

    RC --> PE
    PE --> EX
    EX -->|Export| S
    EX -->|Store| CH

    S -->|Query| CH

    style SDK1 fill:#9b59b6,stroke:#7d3c98,color:#fff
    style SDK2 fill:#9b59b6,stroke:#7d3c98,color:#fff
    style SDK3 fill:#9b59b6,stroke:#7d3c98,color:#fff
    style RC fill:#3498db,stroke:#2980b9,color:#fff
    style S fill:#e74c3c,stroke:#c0392b,color:#fff
```

### Componentes

1. **OpenTelemetry SDK**: Inicializado en cada servicio vía `initObservability()`
2. **OpenTelemetry Collector**: Recolecta traces, metrics y logs
3. **SigNoz**: Plataforma de visualización y análisis

### Configuración

1. **Iniciar SigNoz y Collector**:

```bash
docker-compose up -d
```

2. **Acceder a SigNoz**:

- URL: http://localhost:8080
- Usuario por defecto: `admin`
- Contraseña por defecto: `admin`

3. **Ver Traces**: Navega a "Traces" en SigNoz para ver el flujo completo de peticiones
4. **Ver Metrics**: Navega a "Metrics" para ver métricas de rendimiento
5. **Ver Logs**: Navega a "Logs" para ver logs estructurados

Para más detalles, ver [libs/observability/README.md](libs/observability/README.md).

## 📖 Documentación de APIs

Todas las APIs están disponibles a través del API Gateway con el prefijo `/api`:

| Categoría de Endpoint | Base Path       | Servicio      | Documentación                                                    |
| --------------------- | --------------- | ------------- | ---------------------------------------------------------------- |
| Estado de Servicios   | `/api/services` | Gateway       | Ver [apps/api-gateway/README.md](apps/api-gateway/README.md)     |
| Autenticación         | `/api/auth`     | api-auth      | Ver [apps/api-auth/README.md](apps/api-auth/README.md)           |
| Netflix Shows         | `/api/netflix`  | netflix       | Ver [apps/netflix/README.md](apps/netflix/README.md)             |
| Procesamiento CSV     | `/api/csv`      | csv-processor | Ver [apps/csv-processor/README.md](apps/csv-processor/README.md) |

**Swagger UI**: Documentación interactiva disponible en http://localhost:3000/api/docs cuando el API Gateway está corriendo.

## 📐 Mejores Prácticas y Estándares de Código

Para mantener la calidad y consistencia del código, consulta nuestra guía completa de estándares:

📖 [Mejores Prácticas y Estándares](docs/BEST_PRACTICES.md)

## 📖 Glosario de Conceptos Técnicos

Para explicaciones detalladas de los términos técnicos y conceptos utilizados en el proyecto:

📖 [Glosario de Conceptos Técnicos](docs/GLOSSARY.md)

## �🔒 Seguridad

El sistema implementa seguridad en profundidad:

1. **CORS Policy**: Lista blanca configurable de orígenes
2. **Helmet Middleware**: 14 headers HTTP relacionados con seguridad
3. **Rate Limiting**: Throttle global de 10 req/60s vía `@nestjs/throttler`
4. **Validación de Inputs**: `class-validator` con modo whitelist
5. **Autenticación JWT**: Secreto de 256 bits, tokens de corta duración

## 📝 Licencia

MIT

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor, abre un issue o pull request.

## 📚 Recursos Adicionales

- [Documentación de Nx](https://nx.dev)
- [Documentación de NestJS](https://docs.nestjs.com)
- [Documentación de Prisma](https://www.prisma.io/docs)
- [Documentación de OpenTelemetry](https://opentelemetry.io/docs)
- [DeepWiki - nx-micro](https://deepwiki.com/bleidertcs/nx-micro/1-overview)
