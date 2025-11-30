# CSV Processor Service - Procesamiento de Archivos CSV

El servicio **csv-processor** es responsable del procesamiento asíncrono de archivos CSV. Procesa archivos CSV grandes de forma eficiente usando streaming, validación a nivel de fila, e inserción por lotes en la base de datos.

## 📋 Tabla de Contenidos

- [Descripción](#descripción)
- [Arquitectura](#arquitectura)
- [Funcionalidades](#funcionalidades)
- [Comandos TCP](#comandos-tcp)
- [Formato de CSV](#formato-de-csv)
- [Pipeline de Procesamiento](#pipeline-de-procesamiento)
- [Configuración](#configuración)
- [Base de Datos](#base-de-datos)

## 🎯 Descripción

El servicio `csv-processor` es un microservicio NestJS que:

- Escucha en el puerto **3003** (configurable vía `PORT_CSV_PROCESSOR`)
- Se comunica vía **TCP** con el API Gateway
- Procesa archivos CSV de forma asíncrona usando **streaming**
- Valida filas a nivel individual y maneja errores de forma elegante
- Inserta datos en la base de datos por **lotes** (1,000 registros por operación)
- Sigue una arquitectura **Clean Architecture** con separación de capas

## 🏗️ Arquitectura

### Clean Architecture

El servicio está organizado siguiendo los principios de Clean Architecture:

```
apps/csv-processor/src/
├── domain/                    # Capa de Dominio
│   ├── entities/              # Entidades de negocio
│   │   └── review.entity.ts
│   └── repositories/          # Interfaces de repositorios
│       └── review.repository.interface.ts
├── application/               # Capa de Aplicación
│   └── use-cases/
│       └── process-csv.use-case.ts
├── infrastructure/            # Capa de Infraestructura
│   ├── persistence/           # Implementación de repositorio con Prisma
│   │   └── prisma/
│   │       └── prisma-review.repository.ts
│   └── http/                  # Controladores TCP
│       └── controllers/
│           └── csv.controller.ts
├── app/                       # Capa de Presentación
│   ├── app.module.ts          # Módulo principal
│   └── app.service.ts
├── config/                    # Configuración
│   └── envs.ts
└── main.ts                    # Punto de entrada
```

## ✨ Funcionalidades

### 1. Procesamiento de CSV

Procesa archivos CSV y guarda los datos en la base de datos.

**Comando TCP**: `process_csv`

**Payload**:
```typescript
{
  filePath: string;  // Ruta absoluta al archivo CSV
}
```

**Proceso**:
1. Valida que el archivo exista
2. Lee el archivo usando streaming (no carga todo en memoria)
3. Parsea cada fila del CSV
4. Valida cada fila (rating, title, content)
5. Agrupa filas válidas en lotes de 1,000
6. Inserta lotes en la base de datos
7. Registra filas inválidas en logs
8. Retorna el número total de registros procesados

**Respuesta**:
```typescript
{
  message: string;   // "CSV processed successfully"
  count: number;     // Número total de registros procesados
}
```

**Errores**:
- `Error`: Si el archivo no existe o hay un error en el procesamiento

## 🔌 Comandos TCP

El servicio expone el siguiente comando TCP que puede ser invocado desde el API Gateway:

| Comando | Descripción | Payload |
|---------|-------------|---------|
| `process_csv` | Procesar archivo CSV | `{ filePath: string }` |

### Flujo Completo desde API Gateway

1. **Cliente sube archivo** al API Gateway vía HTTP POST `/api/csv/process`
2. **API Gateway guarda archivo** en `./tmp/uploads/` con nombre aleatorio
3. **API Gateway envía comando TCP** `process_csv` con la ruta absoluta del archivo
4. **CSV Processor procesa** el archivo y guarda datos en la base de datos
5. **CSV Processor retorna** resultado al API Gateway
6. **API Gateway retorna** respuesta HTTP al cliente

## 📄 Formato de CSV

El servicio espera archivos CSV con el siguiente formato:

### Estructura

```csv
rating,title,content
5,Great movie,This is an excellent film with great acting.
4,Good film,Really enjoyed watching this movie.
3,Average,It was okay, nothing special.
```

### Columnas

1. **rating** (número): Calificación del 1 al 5
2. **title** (string): Título de la reseña
3. **content** (string): Contenido de la reseña

### Validación

- **rating**: Debe ser un número válido (1-5)
- **title**: Debe ser una cadena de texto no vacía
- **content**: Debe ser una cadena de texto no vacía

**Filas inválidas**:
- Se registran en logs con nivel `warn`
- Se omiten del procesamiento
- No detienen el procesamiento del resto del archivo

## 🔄 Pipeline de Procesamiento

```mermaid
graph LR
    subgraph "Cliente"
        C[Cliente]
    end
    
    subgraph "API Gateway"
        AG[Gateway Controller]
        FS[File Storage<br/>./tmp/uploads/]
    end
    
    subgraph "CSV Processor"
        CC[CSV Controller]
        PCU[ProcessCsvUseCase]
        Stream[CSV Stream Parser]
        Valid[Row Validator]
        Batch[Batch Collector<br/>1000 rows]
        Repo[Review Repository]
    end
    
    subgraph "Database"
        DB[(PostgreSQL<br/>test_micro)]
    end
    
    C -->|1. POST /api/csv/process<br/>multipart/form-data| AG
    AG -->|2. Save File| FS
    AG -->|3. TCP {cmd: 'process_csv',<br/>filePath}| CC
    CC -->|4. Execute| PCU
    PCU -->|5. Read File| Stream
    Stream -->|6. Parse Row| Valid
    Valid -->|7. Valid Row?| Batch
    Batch -->|8. Batch Full?<br/>1000 rows| Repo
    Repo -->|9. createMany| DB
    DB -->|10. Success| Repo
    Repo -->|11. Response| PCU
    PCU -->|12. Response| CC
    CC -->|13. TCP Response| AG
    AG -->|14. HTTP Response| C
    
    style AG fill:#4a90e2,stroke:#2c5aa0,color:#fff
    style PCU fill:#ffa500,stroke:#cc8400,color:#fff
    style DB fill:#50c878,stroke:#2d7a4a,color:#fff
```

### 1. Recepción del Archivo

El API Gateway recibe el archivo CSV vía multipart/form-data y lo guarda en `./tmp/uploads/`:

```typescript
// En API Gateway
@Post('process')
@UseInterceptors(FileInterceptor('file', {
  storage: diskStorage({
    destination: './tmp/uploads',
    filename: (req, file, cb) => {
      const randomName = Array(32).fill(null)
        .map(() => (Math.round(Math.random() * 16)).toString(16))
        .join('');
      return cb(null, `${randomName}${extname(file.originalname)}`);
    }
  })
}))
async processCsv(@UploadedFile() file: Express.Multer.File) {
  const absolutePath = fs.realpathSync(file.path);
  return this.client.send({ cmd: 'process_csv' }, { filePath: absolutePath });
}
```

### 2. Streaming del Archivo

El servicio lee el archivo usando streaming para no cargar todo en memoria:

```typescript
const stream = fs.createReadStream(csvFilePath)
  .pipe(csv.parse({ headers: false }));
```

### 3. Procesamiento por Lotes

```mermaid
flowchart TD
    Start[Iniciar Procesamiento] --> Read[Leer Fila CSV]
    Read --> Validate{Validar Fila}
    Validate -->|Válida| Add[Agregar a Batch]
    Validate -->|Inválida| Log[Log Warning]
    Log --> Read
    Add --> Check{Batch >= 1000?}
    Check -->|Sí| Insert[Insertar Batch en DB]
    Check -->|No| Read
    Insert --> Clear[Limpiar Batch]
    Clear --> Read
    Read --> End{Fin de Archivo?}
    End -->|No| Validate
    End -->|Sí| Final{¿Batch Restante?}
    Final -->|Sí| InsertFinal[Insertar Batch Final]
    Final -->|No| Complete[Procesamiento Completo]
    InsertFinal --> Complete
    
    style Start fill:#4a90e2,stroke:#2c5aa0,color:#fff
    style Insert fill:#50c878,stroke:#2d7a4a,color:#fff
    style Complete fill:#50c878,stroke:#2d7a4a,color:#fff
    style Log fill:#ffa500,stroke:#cc8400,color:#fff
```

Las filas se agrupan en lotes de 1,000 registros:

```typescript
const BATCH_SIZE = 1000;
let batch: Omit<Review, 'id'>[] = [];

for await (const row of stream) {
  // Validar y agregar a batch
  if (isValid(row)) {
    batch.push(transformRow(row));
  }
  
  // Insertar cuando el batch está lleno
  if (batch.length >= BATCH_SIZE) {
    await this.reviewRepository.createMany(batch);
    batch = [];
  }
}

// Insertar registros restantes
if (batch.length > 0) {
  await this.reviewRepository.createMany(batch);
}
```

### 4. Validación de Filas

Cada fila se valida antes de agregarse al batch:

```typescript
const rating = parseInt(row[0], 10);
const title = row[1];
const content = row[2];

if (!isNaN(rating) && typeof title === 'string' && typeof content === 'string') {
  batch.push({ rating, title, content });
} else {
  this.logger.warn(`Skipping invalid row: ${row}`);
}
```

### 5. Inserción en Base de Datos

Los lotes se insertan usando `createMany` de Prisma para eficiencia:

```typescript
await this.prisma.review.createMany({
  data: reviews,
});
```

## 📊 Modelo de Datos

### Entidad Review

```typescript
export class Review {
  id: number;        // ID auto-generado
  rating: number;    // Calificación (1-5)
  title: string;     // Título de la reseña
  content: string;   // Contenido de la reseña
}
```

### Esquema de Base de Datos

El servicio utiliza la base de datos `test_micro` con el siguiente esquema (definido en `libs/prisma-client/prisma/schema.prisma`):

```prisma
model Review {
  id      Int    @id @default(autoincrement())
  rating  Int
  title   String
  content String

  @@map("reviews")
}
```

## ⚙️ Configuración

### Variables de Entorno

Agrega al archivo `.env` en la raíz del proyecto:

```env
# Puerto del servicio
PORT_CSV_PROCESSOR=3003

# Base de Datos
DATABASE_URL=postgresql://postgres:root@localhost:5432/test_micro?schema=public

# OpenTelemetry
OTEL_SERVICE_NAME=csv-processor
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
```

### Configuración de Tamaño de Lote

El tamaño del lote se puede ajustar en `apps/csv-processor/src/application/use-cases/process-csv.use-case.ts`:

```typescript
const BATCH_SIZE = 1000;  // Ajusta según tus necesidades
```

**Consideraciones**:
- Lotes más grandes = menos operaciones de base de datos pero más uso de memoria
- Lotes más pequeños = más operaciones pero menos uso de memoria
- 1,000 es un buen balance para la mayoría de casos

## 💾 Base de Datos

### Migraciones

Para aplicar migraciones:

```bash
pnpm prisma:migrate:dev
```

Para regenerar el cliente Prisma:

```bash
pnpm prisma:generate
```

## 🚀 Ejecución

### Desarrollo

```bash
# Desde la raíz del proyecto
pnpm start:csv-processor

# O usando Nx directamente
nx serve csv-processor
```

### Producción

```bash
# Build
pnpm build:csv-processor

# Ejecutar build
node dist/apps/csv-processor/main.js
```

## 🧪 Testing

### Tests E2E

```bash
pnpm test:csv-processor:e2e
```

**Requisitos**:
- Base de datos configurada y migrada
- API Gateway corriendo (para tests de integración)
- Archivo CSV de prueba disponible

### Ejemplo de Uso

```bash
# Subir archivo CSV
curl -X POST http://localhost:3000/api/csv/process \
  -F "file=@mi-archivo.csv"
```

## 📊 Observabilidad

El servicio está instrumentado con OpenTelemetry:

- **Traces**: Todas las operaciones de procesamiento se rastrean
- **Metrics**: Métricas de rendimiento (tiempo de procesamiento, número de registros, etc.)
- **Logs**: Logs estructurados con Winston
  - `info`: Inicio y fin de procesamiento, lotes guardados
  - `warn`: Filas inválidas omitidas
  - `error`: Errores durante el procesamiento

**Ver en SigNoz**: http://localhost:8080

### Logs de Errores

Los errores también se registran en un archivo local:
- **Ubicación**: `csv-processor-error.log` (en la raíz del proyecto)
- **Formato**: JSON con detalles del error

## 🔍 Manejo de Errores

### Errores Recuperables

- **Filas inválidas**: Se registran y se omiten, el procesamiento continúa
- **Errores de validación**: Se registran en logs, no detienen el procesamiento

### Errores No Recuperables

- **Archivo no encontrado**: Se lanza error y se detiene el procesamiento
- **Errores de base de datos**: Se lanza error y se detiene el procesamiento

### Degradación Elegante

El servicio está diseñado para:
- Continuar procesando aunque algunas filas sean inválidas
- Registrar todos los errores para análisis posterior
- Retornar el número de registros procesados exitosamente

## 📚 Casos de Uso

### ProcessCsvUseCase

El caso de uso principal encapsula toda la lógica de procesamiento:

1. **Validación de archivo**: Verifica que el archivo exista
2. **Streaming**: Lee el archivo sin cargar todo en memoria
3. **Parsing**: Parsea cada fila del CSV
4. **Validación**: Valida cada fila
5. **Agrupación**: Agrupa filas válidas en lotes
6. **Persistencia**: Inserta lotes en la base de datos
7. **Logging**: Registra progreso y errores

### Repositorio

El repositorio abstrae el acceso a datos:

**Interfaz** (`domain/repositories/review.repository.interface.ts`):
```typescript
export interface IReviewRepository {
  createMany(reviews: Omit<Review, 'id'>[]): Promise<void>;
}
```

**Implementación** (`infrastructure/persistence/prisma/prisma-review.repository.ts`):
- Implementa la interfaz usando Prisma
- Utiliza `createMany` para inserción eficiente por lotes

## 🎯 Mejores Prácticas

### Para Archivos Grandes

1. **Usar streaming**: El servicio ya usa streaming, no carga todo en memoria
2. **Procesar por lotes**: Ya implementado con tamaño configurable
3. **Manejar errores**: Filas inválidas no detienen el procesamiento
4. **Monitorear**: Usar observabilidad para monitorear el progreso

### Optimizaciones

- **Tamaño de lote**: Ajusta `BATCH_SIZE` según el tamaño de tus registros
- **Validación**: La validación es rápida, pero puedes optimizarla si es necesario
- **Logging**: Los logs son importantes para debugging, pero pueden afectar el rendimiento

## 📚 Referencias

- [README Principal](../../README.md)
- [Documentación de NestJS Microservices](https://docs.nestjs.com/microservices/basics)
- [Documentación de fast-csv](https://c2fo.io/fast-csv/)
- [DeepWiki - CSV Processor Service](https://deepwiki.com/bleidertcs/nx-micro/10-csv-processor-service)

