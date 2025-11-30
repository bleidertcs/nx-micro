# Prisma Netflix Library

Librería compartida que proporciona el cliente Prisma para la base de datos de Netflix (`netflix_shows`). Esta librería centraliza la configuración de Prisma para el servicio de Netflix y proporciona un script de seeding para poblar la base de datos.

## 📋 Tabla de Contenidos

- [Descripción](#descripción)
- [Modelo](#modelo)
- [Uso](#uso)
- [Configuración](#configuración)
- [Seeding](#seeding)
- [Migraciones](#migraciones)

## 🎯 Descripción

La librería `@nx-microservices/prisma-netflix` es una librería compartida que:

- Define el esquema de Prisma para la base de datos de Netflix (`netflix_shows`)
- Genera el cliente Prisma type-safe
- Proporciona un script de seeding para poblar la base de datos
- Centraliza la configuración de Prisma para el servicio Netflix

## 📊 Modelo

### NetflixShow

Modelo para shows de Netflix.

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

**Campos**:
- `show_id`: ID único del show (clave primaria)
- `type`: Tipo de contenido ('Movie' o 'TV Show')
- `title`: Título del show
- `director`: Director del show
- `cast_members`: Miembros del elenco
- `country`: País de origen
- `date_added`: Fecha en que se agregó a Netflix
- `release_year`: Año de lanzamiento
- `rating`: Clasificación (PG-13, R, etc.)
- `duration`: Duración (ej: '90 min', '2 Seasons')
- `listed_in`: Categorías/géneros
- `description`: Descripción del show

**Nota**: Todos los campos excepto `show_id` son opcionales (nullable).

## 🚀 Uso

### Importar el Cliente

El cliente Prisma se genera en `node_modules/@prisma/client-netflix` y se exporta desde esta librería:

```typescript
import { PrismaClient } from '@nx-microservices/prisma-netflix';

const prisma = new PrismaClient();
```

### Ejemplos de Queries

#### Crear Show

```typescript
const show = await prisma.netflixShow.create({
  data: {
    show_id: 's1',
    type: 'Movie',
    title: 'Dick Johnson Is Dead',
    director: 'Kirsten Johnson',
    release_year: 2020,
    rating: 'PG-13',
    duration: '90 min',
  },
});
```

#### Buscar Show por ID

```typescript
const show = await prisma.netflixShow.findUnique({
  where: { show_id: 's1' },
});
```

#### Listar Shows con Paginación

```typescript
const shows = await prisma.netflixShow.findMany({
  skip: 0,
  take: 10,
});
```

#### Buscar por Título

```typescript
const shows = await prisma.netflixShow.findMany({
  where: {
    title: {
      contains: 'Dick',
      mode: 'insensitive',
    },
  },
});
```

#### Filtrar por Múltiples Criterios

```typescript
const shows = await prisma.netflixShow.findMany({
  where: {
    type: 'Movie',
    release_year: 2020,
    country: 'United States',
  },
});
```

#### Actualizar Show

```typescript
const updatedShow = await prisma.netflixShow.update({
  where: { show_id: 's1' },
  data: {
    title: 'New Title',
    rating: 'R',
  },
});
```

#### Eliminar Show

```typescript
await prisma.netflixShow.delete({
  where: { show_id: 's1' },
});
```

#### Contar Shows

```typescript
const count = await prisma.netflixShow.count({
  where: {
    type: 'Movie',
  },
});
```

## ⚙️ Configuración

### Variables de Entorno

Agrega al archivo `.env` en la raíz del proyecto:

```env
# Base de Datos Netflix
DATABASE_URL_NETFLIX=postgresql://postgres:root@localhost:5432/netflix_shows?schema=public
```

### Esquema de Prisma

El esquema se encuentra en: `libs/prisma-netflix/prisma/schema.prisma`

**Configuración del generador**:
```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../../../node_modules/@prisma/client-netflix"
}
```

**Configuración del datasource**:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL_NETFLIX")
}
```

## 🌱 Seeding

La librería incluye un script de seeding que lee un archivo SQL y pobla la base de datos.

### Archivo SQL

El archivo `netflix_shows.sql` contiene los datos en formato PostgreSQL COPY.

**Ubicación**: `libs/prisma-netflix/netflix_shows.sql`

### Ejecutar Seeding

#### Opción 1: Usando ts-node (Recomendado)

```bash
npx ts-node --project libs/prisma-netflix/tsconfig.seed.json libs/prisma-netflix/seed.ts
```

#### Opción 2: Usando psql (Manual)

```bash
psql "postgresql://postgres:root@localhost:5432/netflix_shows" -f libs/prisma-netflix/netflix_shows.sql
```

### Proceso de Seeding

El script `seed.ts`:

1. Lee el archivo `netflix_shows.sql`
2. Parsea el bloque COPY para extraer los datos
3. Transforma los datos al formato esperado por Prisma
4. Inserta los datos en lotes de 100 registros
5. Omite duplicados (`skipDuplicates: true`)

**Características**:
- Procesamiento por lotes para eficiencia
- Manejo de valores NULL (`\N` en SQL)
- Conversión de tipos (fechas, números)
- Logging del progreso

### Configuración de Base de Datos

Antes de ejecutar el seeding, asegúrate de que:

1. La base de datos `netflix_shows` existe
2. La tabla `netflix_shows` está creada (ver [Migraciones](#migraciones))

## 🔄 Migraciones

### Crear la Tabla

#### Opción 1: Usando Prisma (Recomendado)

```bash
npx prisma db push --schema=libs/prisma-netflix/prisma/schema.prisma
```

Este comando:
- Crea la tabla si no existe
- Actualiza la tabla si el esquema cambió
- No crea migraciones (útil para desarrollo)

#### Opción 2: Crear Migración

```bash
npx prisma migrate dev --schema=libs/prisma-netflix/prisma/schema.prisma --name init
```

Este comando:
- Crea una migración
- Aplica la migración a la base de datos
- Regenera el cliente Prisma

### Aplicar Migraciones

```bash
npx prisma migrate deploy --schema=libs/prisma-netflix/prisma/schema.prisma
```

### Regenerar el Cliente

Después de cambiar el esquema:

```bash
npx prisma generate --schema=libs/prisma-netflix/prisma/schema.prisma
```

## 📦 Estructura

```
libs/prisma-netflix/
├── prisma/
│   └── schema.prisma          # Esquema de Prisma
├── src/
│   ├── lib/
│   │   └── prisma-netflix.module.ts  # Módulo NestJS (vacío por ahora)
│   └── index.ts               # Exports del cliente Prisma
├── seed.ts                    # Script de seeding
├── netflix_shows.sql          # Datos SQL para seeding
├── tsconfig.seed.json         # Configuración TypeScript para seeding
└── README.md
```

## 🔍 Cliente Prisma

El cliente Prisma se genera en:
```
node_modules/@prisma/client-netflix/
```

**Importación**:
```typescript
import { PrismaClient } from '@nx-microservices/prisma-netflix';
```

O directamente:
```typescript
import { PrismaClient } from '@prisma/client-netflix';
```

## 🧪 Testing

### Resetear Base de Datos en Tests

```typescript
beforeEach(async () => {
  await prisma.netflixShow.deleteMany();
});
```

### Usar Transacciones en Tests

```typescript
await prisma.$transaction(async (tx) => {
  const show1 = await tx.netflixShow.create({ data: {...} });
  const show2 = await tx.netflixShow.create({ data: {...} });
});
```

## 📚 Servicios que Usan esta Librería

- **netflix**: Servicio principal que gestiona shows de Netflix

## 🔗 Relación con el Servicio Netflix

El servicio Netflix (`apps/netflix`) utiliza esta librería para:

- Acceder a la base de datos `netflix_shows`
- Realizar operaciones CRUD sobre shows
- Implementar búsqueda y filtrado

Ver [apps/netflix/README.md](../../apps/netflix/README.md) para más detalles.

## 📚 Referencias

- [README Principal](../../README.md)
- [Documentación de Prisma](https://www.prisma.io/docs)
- [Documentación de Prisma Client](https://www.prisma.io/docs/concepts/components/prisma-client)
- [DeepWiki - Netflix Database Schema](https://deepwiki.com/bleidertcs/nx-micro/9.3-netflix-database-schema)
