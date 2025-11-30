# Netflix Service - Gestión de Shows de Netflix

El servicio **netflix** es responsable de la gestión completa de datos de shows de Netflix. Proporciona operaciones CRUD (Create, Read, Update, Delete), búsqueda y filtrado avanzado de shows de Netflix.

## 📋 Tabla de Contenidos

- [Descripción](#descripción)
- [Arquitectura](#arquitectura)
- [Funcionalidades](#funcionalidades)
- [Comandos TCP](#comandos-tcp)
- [Modelo de Datos](#modelo-de-datos)
- [Configuración](#configuración)
- [Base de Datos](#base-de-datos)

## 🎯 Descripción

El servicio `netflix` es un microservicio NestJS que:

- Escucha en el puerto **3002** (configurable vía `PORT_NETFLIX`)
- Se comunica vía **TCP** con el API Gateway
- Gestiona datos de shows de Netflix con operaciones CRUD completas
- Proporciona capacidades de búsqueda y filtrado avanzado
- Utiliza una base de datos PostgreSQL dedicada (`netflix_shows`)
- Sigue una arquitectura **Clean Architecture** con separación de capas

## 🏗️ Arquitectura

### Clean Architecture

```mermaid
graph TD
    subgraph "Presentation Layer"
        Controller[NetflixController<br/>TCP MessagePattern]
    end
    
    subgraph "Application Layer"
        UC1[CreateUseCase]
        UC2[GetShowsUseCase]
        UC3[GetShowUseCase]
        UC4[UpdateUseCase]
        UC5[DeleteUseCase]
    end
    
    subgraph "Domain Layer"
        Entity[NetflixShow Entity]
        RepoInterface[NetflixShowRepository Interface]
    end
    
    subgraph "Infrastructure Layer"
        RepoImpl[PrismaNetflixRepository]
        Prisma[Prisma Client]
        DB[(netflix_shows DB)]
    end
    
    Controller --> UC1
    Controller --> UC2
    Controller --> UC3
    Controller --> UC4
    Controller --> UC5
    
    UC1 --> RepoInterface
    UC2 --> RepoInterface
    UC3 --> RepoInterface
    UC4 --> RepoInterface
    UC5 --> RepoInterface
    
    RepoInterface -.->|implementa| RepoImpl
    RepoImpl --> Prisma
    Prisma --> DB
    RepoImpl --> Entity
    
    style Domain fill:#e8f5e9,stroke:#4caf50
    style Application fill:#e3f2fd,stroke:#2196f3
    style Infrastructure fill:#fff3e0,stroke:#ff9800
    style Presentation fill:#f3e5f5,stroke:#9c27b0
```

El servicio está organizado siguiendo los principios de Clean Architecture:

```
apps/netflix/src/
├── domain/                    # Capa de Dominio
│   ├── entities/              # Entidades de negocio
│   │   └── netflix-show.entity.ts
│   └── repositories/          # Interfaces de repositorios
│       └── netflix-show.repository.ts
├── application/               # Capa de Aplicación (casos de uso)
│   ├── use-cases/
│   │   ├── create-netflix-show.use-case.ts
│   │   ├── get-netflix-shows.use-case.ts
│   │   ├── get-netflix-show.use-case.ts
│   │   ├── update-netflix-show.use-case.ts
│   │   └── delete-netflix-show.use-case.ts
│   └── dtos/                  # Data Transfer Objects
│       ├── create-netflix-show.dto.ts
│       └── update-netflix-show.dto.ts
├── infrastructure/            # Capa de Infraestructura
│   ├── database/              # Implementación de repositorio con Prisma
│   │   └── prisma-netflix.repository.ts
│   └── http/                  # Controladores TCP
│       └── controllers/
│           └── netflix.controller.ts
├── app/                       # Capa de Presentación
│   ├── app.module.ts          # Módulo principal
│   └── config/
│       └── constants.ts
├── config/                    # Configuración
│   └── constants.ts
└── main.ts                    # Punto de entrada
```

## ✨ Funcionalidades

### 1. Crear Show (Create)

Crea un nuevo show de Netflix en la base de datos.

**Comando TCP**: `create_netflix_show`

**Payload**:
```typescript
{
  show_id: string;           // ID único del show (requerido)
  type?: string;             // 'Movie' o 'TV Show'
  title?: string;            // Título del show
  director?: string;         // Director
  cast_members?: string;     // Miembros del elenco
  country?: string;          // País
  date_added?: string;       // Fecha de agregado (ISO date string)
  release_year?: number;     // Año de lanzamiento
  rating?: string;           // Clasificación (PG-13, R, etc.)
  duration?: string;         // Duración (ej: '90 min')
  listed_in?: string;        // Categorías/géneros
  description?: string;      // Descripción
}
```

**Respuesta**:
```typescript
{
  show_id: string;
  type: string | null;
  title: string | null;
  // ... otros campos
}
```

### 2. Listar Shows (Read - List)

Obtiene una lista paginada de shows de Netflix.

**Comando TCP**: `get_netflix_shows`

**Payload**:
```typescript
{
  skip?: number;    // Número de registros a omitir (paginación)
  take?: number;    // Número de registros a retornar
}
```

**Respuesta**:
```typescript
{
  data: NetflixShow[];
  total: number;    // Total de registros (sin paginación)
}
```

### 3. Obtener Show por ID (Read - Single)

Obtiene un show específico por su ID.

**Comando TCP**: `get_netflix_show`

**Payload**: `string` (ID del show)

**Respuesta**:
```typescript
NetflixShow
```

**Errores**:
- `NotFoundException`: Si el show no existe

### 4. Buscar Shows por Título

Busca shows que contengan un título específico.

**Comando TCP**: `search_netflix_shows`

**Payload**: `string` (título a buscar)

**Respuesta**:
```typescript
{
  data: NetflixShow[];
  total: number;
}
```

### 5. Filtrar Shows

Filtra shows por múltiples criterios.

**Comando TCP**: `filter_netflix_shows`

**Payload**:
```typescript
{
  type?: string;        // 'Movie' o 'TV Show'
  year?: number;        // Año de lanzamiento
  country?: string;     // País
}
```

**Respuesta**:
```typescript
{
  data: NetflixShow[];
  total: number;
}
```

### 6. Actualizar Show (Update)

Actualiza un show existente.

**Comando TCP**: `update_netflix_show`

**Payload**:
```typescript
{
  id: string;           // ID del show a actualizar
  dto: {
    type?: string;
    title?: string;
    director?: string;
    // ... otros campos opcionales
  }
}
```

**Respuesta**:
```typescript
NetflixShow  // Show actualizado
```

**Errores**:
- `NotFoundException`: Si el show no existe

### 7. Eliminar Show (Delete)

Elimina un show de la base de datos.

**Comando TCP**: `delete_netflix_show`

**Payload**: `string` (ID del show)

**Respuesta**:
```typescript
{
  success: boolean;
  message?: string;
}
```

**Errores**:
- `NotFoundException`: Si el show no existe

## 🔌 Comandos TCP

El servicio expone los siguientes comandos TCP que pueden ser invocados desde el API Gateway:

| Comando | Descripción | Payload |
|---------|-------------|---------|
| `create_netflix_show` | Crear nuevo show | `CreateNetflixShowDto` |
| `get_netflix_shows` | Listar shows (con paginación) | `{ skip?: number, take?: number }` |
| `get_netflix_show` | Obtener show por ID | `string` (ID) |
| `search_netflix_shows` | Buscar por título | `string` (título) |
| `filter_netflix_shows` | Filtrar shows | `{ type?: string, year?: number, country?: string }` |
| `update_netflix_show` | Actualizar show | `{ id: string, dto: UpdateNetflixShowDto }` |
| `delete_netflix_show` | Eliminar show | `string` (ID) |

### Ejemplo de Uso desde API Gateway

```typescript
// En el API Gateway
@Get()
async findAll(@Query('skip') skip?: number, @Query('take') take?: number) {
  return firstValueFrom(
    this.netflixClient.send({ cmd: 'get_netflix_shows' }, { skip, take })
  );
}
```

### Flujo de Operación CRUD

```mermaid
sequenceDiagram
    participant C as Cliente
    participant G as Gateway
    participant NC as NetflixController
    participant UC as UseCase
    participant R as Repository
    participant DB as netflix_shows DB
    
    Note over C,DB: Ejemplo: Crear un Show
    
    C->>G: HTTP POST /api/services/netflix/netflix
    G->>NC: TCP {cmd: 'create_netflix_show', dto}
    NC->>UC: CreateUseCase.execute(dto)
    UC->>R: create(showData)
    R->>DB: INSERT INTO netflix_shows ...
    DB-->>R: NetflixShow
    R-->>UC: NetflixShow Entity
    UC-->>NC: NetflixShow
    NC-->>G: TCP Response
    G-->>C: HTTP 201 Created
    
    Note over C,DB: Ejemplo: Buscar Shows
    
    C->>G: HTTP GET /api/services/netflix/netflix?skip=0&take=10
    G->>NC: TCP {cmd: 'get_netflix_shows', {skip, take}}
    NC->>UC: GetShowsUseCase.execute({skip, take})
    UC->>R: findAll({skip, take})
    R->>DB: SELECT * FROM netflix_shows LIMIT 10 OFFSET 0
    DB-->>R: NetflixShow[]
    R-->>UC: NetflixShow[]
    UC->>R: count()
    R->>DB: SELECT COUNT(*) FROM netflix_shows
    DB-->>R: total
    UC-->>NC: {data: [], total: number}
    NC-->>G: TCP Response
    G-->>C: HTTP 200 OK
```

## 📊 Modelo de Datos

### Entidad NetflixShow

```typescript
export class NetflixShow {
  show_id: string;           // ID único (clave primaria)
  type: string | null;       // 'Movie' o 'TV Show'
  title: string | null;      // Título
  director: string | null;   // Director
  cast_members: string | null;  // Elenco
  country: string | null;    // País
  date_added: Date | null;   // Fecha de agregado
  release_year: number | null;  // Año de lanzamiento
  rating: string | null;     // Clasificación
  duration: string | null;   // Duración
  listed_in: string | null;  // Categorías
  description: string | null;  // Descripción
}
```

### Esquema de Base de Datos

El servicio utiliza la base de datos `netflix_shows` con el siguiente esquema (definido en `libs/prisma-netflix/prisma/schema.prisma`):

```prisma
model NetflixShow {
  show_id      String    @id
  type         String?
  title        String?
  director     String?
  cast_members String?
  country      String?
  date_added   DateTime? @db.Date
  release_year Int?
  rating       String?
  duration     String?
  listed_in    String?
  description  String?

  @@map("netflix_shows")
}
```

## ⚙️ Configuración

### Variables de Entorno

Agrega al archivo `.env` en la raíz del proyecto:

```env
# Puerto del servicio
PORT_NETFLIX=3002

# Base de Datos Netflix
DATABASE_URL_NETFLIX=postgresql://postgres:root@localhost:5432/netflix_shows?schema=public

# OpenTelemetry
OTEL_SERVICE_NAME=netflix
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
```

### Configuración de Base de Datos

El servicio utiliza una base de datos PostgreSQL separada (`netflix_shows`) para mantener el aislamiento de datos por dominio.

## 💾 Base de Datos

### Configuración Inicial

#### Opción 1: Automática (Recomendado)

1. **Crear la tabla**:
```bash
npx prisma db push --schema=libs/prisma-netflix/prisma/schema.prisma
```

2. **Poblar la tabla con datos iniciales**:
```bash
npx ts-node --project libs/prisma-netflix/tsconfig.seed.json libs/prisma-netflix/seed.ts
```

#### Opción 2: Manual (psql)

1. **Crear la base de datos** (si no existe):
```bash
docker exec -it <nombre_contenedor_postgres> createdb -U postgres netflix_shows
```

2. **Importar los datos**:
```bash
psql "postgresql://postgres:root@localhost:5432/netflix_shows" -f libs/prisma-netflix/netflix_shows.sql
```

> El archivo `netflix_shows.sql` se encuentra en `libs/prisma-netflix/netflix_shows.sql`.

### Migraciones

Para aplicar cambios al esquema:

```bash
# Generar migración
npx prisma migrate dev --schema=libs/prisma-netflix/prisma/schema.prisma

# Regenerar cliente Prisma
npx prisma generate --schema=libs/prisma-netflix/prisma/schema.prisma
```

## 🚀 Ejecución

### Desarrollo

```bash
# Desde la raíz del proyecto
pnpm start:netflix

# O usando Nx directamente
nx serve netflix
```

### Producción

```bash
# Build
pnpm build:netflix

# Ejecutar build
node dist/apps/netflix/main.js
```

## 🧪 Testing

### Tests E2E

```bash
pnpm test:netflix:e2e
```

**Requisitos**:
- Base de datos `netflix_shows` configurada y poblada
- API Gateway corriendo (para tests de integración)

## 📊 Observabilidad

El servicio está instrumentado con OpenTelemetry:

- **Traces**: Todas las operaciones CRUD se rastrean
- **Metrics**: Métricas de rendimiento (tiempo de respuesta, número de queries, etc.)
- **Logs**: Logs estructurados con Winston

**Ver en SigNoz**: http://localhost:8080

## 📚 Casos de Uso

### Casos de Uso Implementados

1. **CreateNetflixShowUseCase**: Lógica de creación de shows
2. **GetNetflixShowsUseCase**: Lógica de listado con paginación y filtrado
3. **GetNetflixShowUseCase**: Lógica de obtención de un show específico
4. **UpdateNetflixShowUseCase**: Lógica de actualización
5. **DeleteNetflixShowUseCase**: Lógica de eliminación

### Repositorio

El repositorio abstrae el acceso a datos:

**Interfaz** (`domain/repositories/netflix-show.repository.ts`):
```typescript
export interface NetflixShowRepository {
  create(show: NetflixShow): Promise<NetflixShow>;
  findAll(params: { skip?: number; take?: number; filter?: NetflixShowFilter }): Promise<NetflixShow[]>;
  findOne(id: string): Promise<NetflixShow | null>;
  update(id: string, data: Partial<NetflixShow>): Promise<NetflixShow>;
  delete(id: string): Promise<void>;
  count(filter?: NetflixShowFilter): Promise<number>;
}
```

**Implementación** (`infrastructure/database/prisma-netflix.repository.ts`):
- Implementa la interfaz usando Prisma
- Maneja la persistencia en PostgreSQL
- Implementa filtrado y búsqueda

## 📚 Referencias

- [README Principal](../../README.md)
- [Documentación de NestJS Microservices](https://docs.nestjs.com/microservices/basics)
- [Documentación de Prisma](https://www.prisma.io/docs)
- [DeepWiki - Netflix Service](https://deepwiki.com/bleidertcs/nx-micro/9-netflix-service)

