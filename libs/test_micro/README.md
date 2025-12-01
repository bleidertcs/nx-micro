# TestMicro Library

Librería compartida que proporciona el cliente Prisma para la base de datos principal (`test_micro`). Esta librería centraliza la configuración de Prisma y proporciona un servicio NestJS para acceso a la base de datos.

## 📋 Tabla de Contenidos

- [Descripción](#descripción)
- [Modelos](#modelos)
- [Uso](#uso)
- [Configuración](#configuración)
- [Migraciones](#migraciones)
- [Generación del Cliente](#generación-del-cliente)

## 🎯 Descripción

La librería `@nx-microservices/test_micro` es una librería compartida que:

- Define el esquema de Prisma para la base de datos principal (`test_micro`)
- Genera el cliente Prisma type-safe
- Proporciona un servicio NestJS (`PrismaService`) para acceso a la base de datos
- Centraliza la configuración de Prisma en un solo lugar

## 📊 Modelos

### User

Modelo para usuarios del sistema.

```prisma
model User {
  id            String         @id @default(cuid())
  email         String         @unique
  password      String
  name          String
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  refreshTokens RefreshToken[]
}
```

**Campos**:

- `id`: ID único del usuario (CUID)
- `email`: Email único del usuario
- `password`: Contraseña hasheada
- `name`: Nombre del usuario
- `createdAt`: Fecha de creación
- `updatedAt`: Fecha de última actualización
- `refreshTokens`: Relación con tokens de refresco

### RefreshToken

Modelo para tokens de refresco JWT.

```prisma
model RefreshToken {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  createdAt DateTime @default(now())
}
```

**Campos**:

- `id`: ID único del token (CUID)
- `token`: Token de refresco (único)
- `userId`: ID del usuario propietario
- `user`: Relación con el usuario
- `expiresAt`: Fecha de expiración
- `createdAt`: Fecha de creación

**Relación**:

- `onDelete: Cascade` - Si se elimina el usuario, se eliminan sus tokens

### Review

Modelo para reseñas procesadas desde archivos CSV.

```prisma
model Review {
  id      Int      @id @default(autoincrement())
  rating  Int
  title   String
  content String
}
```

**Campos**:

- `id`: ID único (auto-incremento)
- `rating`: Calificación (1-5)
- `title`: Título de la reseña
- `content`: Contenido de la reseña

### Example

Modelo de ejemplo (puede ser eliminado si no se usa).

```prisma
model Example {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  name      String
}
```

## 🚀 Uso

### Importar el Módulo

En el `app.module.ts` de tu servicio:

```typescript
import { PrismaClientModule } from '@nx-microservices/test_micro';

@Module({
  imports: [
    PrismaClientModule,
    // ... otros módulos
  ],
  // ...
})
export class AppModule {}
```

### Usar PrismaService

Inyecta `PrismaService` en tus servicios o repositorios:

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@nx-microservices/test_micro';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async create(userData: { email: string; password: string; name: string }) {
    return this.prisma.user.create({
      data: userData,
    });
  }
}
```

### Ejemplos de Queries

#### Crear Usuario

```typescript
const user = await this.prisma.user.create({
  data: {
    email: 'user@example.com',
    password: 'hashedPassword',
    name: 'John Doe',
  },
});
```

#### Buscar Usuario por Email

```typescript
const user = await this.prisma.user.findUnique({
  where: { email: 'user@example.com' },
});
```

#### Crear Refresh Token

```typescript
const refreshToken = await this.prisma.refreshToken.create({
  data: {
    token: 'refreshTokenString',
    userId: user.id,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
  },
});
```

#### Crear Múltiples Reviews (Batch)

```typescript
await this.prisma.review.createMany({
  data: [
    { rating: 5, title: 'Great', content: 'Excellent product' },
    { rating: 4, title: 'Good', content: 'Very good product' },
  ],
});
```

#### Queries con Relaciones

```typescript
const userWithTokens = await this.prisma.user.findUnique({
  where: { email: 'user@example.com' },
  include: {
    refreshTokens: true,
  },
});
```

## ⚙️ Configuración

### Variables de Entorno

Agrega al archivo `.env` en la raíz del proyecto:

```env
# Base de Datos Principal
DATABASE_URL=postgresql://postgres:root@localhost:5432/test_micro?schema=public
```

### Esquema de Prisma

El esquema se encuentra en: `libs/test_micro/prisma/schema.prisma`

**Configuración del generador**:

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../src/lib/generated/prisma-client-lib"
}
```

**Configuración del datasource**:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

## 🔄 Migraciones

### Crear una Nueva Migración

```bash
pnpm prisma:test_micro:migrate
```

Este comando:

1. Detecta cambios en el esquema
2. Crea una nueva migración
3. Aplica la migración a la base de datos
4. Regenera el cliente Prisma

### Aplicar Migraciones Existentes

```bash
npx prisma migrate deploy
```

### Revertir una Migración

```bash
npx prisma migrate resolve --rolled-back <migration_name>
```

### Ver Estado de Migraciones

```bash
npx prisma migrate status
```

## 🔧 Generación del Cliente

### Regenerar el Cliente

Después de cambiar el esquema, regenera el cliente:

```bash
pnpm prisma:test_micro:generate
```

O directamente:

```bash
npx prisma generate --schema=libs/test_micro/prisma/schema.prisma
```

### Ubicación del Cliente Generado

El cliente se genera en:

```
libs/test_micro/src/lib/generated/prisma-client-lib/
```

## 📦 Estructura

```
libs/test_micro/
├── prisma/
│   ├── schema.prisma          # Esquema de Prisma
│   └── migrations/            # Migraciones de base de datos
│       └── ...
├── src/
│   ├── lib/
│   │   ├── generated/         # Cliente Prisma generado
│   │   │   └── prisma-client-lib/
│   │   ├── prisma.service.ts  # Servicio NestJS
│   │   └── prisma-client.module.ts  # Módulo NestJS
│   └── index.ts               # Exports
└── README.md
```

## 🔍 PrismaService

El `PrismaService` extiende `PrismaClient` y se conecta automáticamente cuando el módulo se inicializa.

**Características**:

- Se conecta automáticamente en `onModuleInit`
- Type-safe: Todas las queries están tipadas
- Instrumentación: Compatible con OpenTelemetry para observabilidad

## 🧪 Testing

### Resetear Base de Datos en Tests

```typescript
beforeEach(async () => {
  await prisma.review.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
});
```

### Usar Transacciones en Tests

```typescript
await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({ data: {...} });
  await tx.refreshToken.create({ data: {...} });
});
```

## 📚 Servicios que Usan esta Librería

- **api-auth**: Para gestión de usuarios y tokens
- **csv-processor**: Para almacenar reviews procesadas desde CSV

## 🔗 Relaciones

### User ↔ RefreshToken

- Un usuario puede tener múltiples refresh tokens
- Si se elimina un usuario, se eliminan automáticamente sus tokens (Cascade)

## 📚 Referencias

- [README Principal](../../README.md)
- [Documentación de Prisma](https://www.prisma.io/docs)
- [Documentación de Prisma Client](https://www.prisma.io/docs/concepts/components/prisma-client)
- [DeepWiki - Data Layer Architecture](https://deepwiki.com/bleidertcs/nx-micro/6-data-layer-architecture)
