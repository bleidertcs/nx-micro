# Guía de Ejecución de Tests

Esta guía explica paso a paso cómo ejecutar los diferentes tipos de tests en el proyecto nx-microservices.

## Tabla de Contenidos

- [Requisitos Previos](#requisitos-previos)
- [Tests Unitarios](#tests-unitarios)
- [Tests TCP E2E](#tests-tcp-e2e)
- [Tests HTTP E2E](#tests-http-e2e)
- [Comandos Disponibles](#comandos-disponibles)
- [Solución de Problemas](#solución-de-problemas)

## Requisitos Previos

### 1. Instalar Dependencias

```bash
pnpm install
```

### 2. Generar Clientes Prisma

```bash
pnpm prisma:generate:all
```

### 3. Configurar Base de Datos (si aplica)

```bash
# Para test_micro
pnpm prisma:test_micro:migrate

# Para Netflix
pnpm prisma:netflix:migrate
```

## Tests Unitarios

Los tests unitarios **NO requieren** servicios ejecutándose y son los más rápidos.

### Ejecutar Tests de un Proyecto Específico

#### Netflix Service

```bash
# Ejecutar todos los tests
nx test netflix

# Con cobertura
nx test netflix --codeCoverage

# Solo un archivo específico
nx test netflix --testFile=create-netflix-show.use-case.spec.ts

# En modo watch (re-ejecuta al cambiar archivos)
nx test netflix --watch
```

#### API Gateway

```bash
nx test api-gateway

# Con cobertura
nx test api-gateway --codeCoverage
```

#### Otros Servicios

```bash
# API Auth
nx test api-auth

# CSV Processor
nx test csv-processor
```

### Ejecutar Todos los Tests Unitarios

```bash
# Todos los proyectos
nx run-many --target=test --all

# Con cobertura
nx run-many --target=test --all --codeCoverage
```

### Interpretar Resultados

```bash
Test Suites: 7 passed, 7 total
Tests:       39 passed, 39 total
Snapshots:   0 total
Time:        9.234 s
```

- **Test Suites**: Archivos `.spec.ts` ejecutados
- **Tests**: Casos de prueba individuales (bloques `it()`)
- **Time**: Tiempo total de ejecución

### Cobertura de Código

Después de ejecutar con `--codeCoverage`, ver reporte en:

```bash
# Ubicación del reporte
coverage/apps/netflix/index.html
```

Abrir en navegador para ver cobertura detallada línea por línea.

## Tests TCP E2E

Los tests TCP e2e prueban la comunicación directa con microservicios vía TCP.

### Prerrequisitos

El microservicio debe estar ejecutándose en el puerto esperado.

### Paso 1: Iniciar el Microservicio

```bash
# Terminal 1: Iniciar Netflix service
nx serve netflix
```

Esperar hasta ver:

```
Netflix microservice is running on TCP port: 3002
```

### Paso 2: Ejecutar Tests E2E

```bash
# Terminal 2: Ejecutar tests
nx e2e netflix-e2e
```

### Ejemplo Completo: Netflix E2E

**Terminal 1:**

```bash
cd c:\Desarrollo\nx-micro
nx serve netflix
```

**Terminal 2:**

```bash
cd c:\Desarrollo\nx-micro
nx e2e netflix-e2e
```

### Resultados Esperados

```bash
Test Suites: 1 passed, 1 total
Tests:       12 passed, 12 total
Time:        2.232 s
```

Los 12 tests cubren:

- CREATE: Crear show
- READ: Obtener todos, obtener uno, búsqueda, filtros
- UPDATE: Actualizar show
- DELETE: Eliminar show
- ERROR: Manejo de errores

### Ejecutar en Docker

Si los servicios están en Docker:

```bash
# Iniciar servicios
docker-compose up netflix

# Ejecutar tests (apuntando al puerto mapeado)
PORT=3002 nx e2e netflix-e2e
```

## Tests HTTP E2E

Los tests HTTP e2e prueban el flujo completo a través del API Gateway.

### Prerrequisitos

Tanto el API Gateway como el microservicio deben estar ejecutándose.

### Paso 1: Iniciar Microservicio

```bash
# Terminal 1: Iniciar Netflix service
nx serve netflix
```

Esperar mensaje:

```
Netflix microservice is running on TCP port: 3002
```

### Paso 2: Iniciar API Gateway

```bash
# Terminal 2: Iniciar API Gateway
nx serve api-gateway
```

Esperar mensaje:

```
🚀 API Gateway is running on: http://localhost:3000/api
📝 Swagger is running on: http://localhost:3000/api/docs
```

### Paso 3: Ejecutar Tests HTTP E2E

```bash
# Terminal 3: Ejecutar tests
nx e2e api-gateway-e2e
```

### Ejecutar Solo Tests de Netflix

```bash
# Desde la raíz del proyecto
cd apps/api-gateway-e2e
npx jest src/nx-microservices/netflix-flow.spec.ts
```

### Resultados Esperados

```bash
Test Suites: 1 passed, 1 total
Tests:       13 passed, 13 total
Time:        3.456 s
```

Los 13 tests cubren:

- POST /services/netflix/netflix
- GET /services/netflix/netflix (con/sin paginación)
- GET /services/netflix/netflix/:id
- GET /services/netflix/netflix/search?title=
- GET /services/netflix/netflix/filter?type=&year=&country=
- PUT /services/netflix/netflix/:id
- DELETE /services/netflix/netflix/:id
- Error handling (404/500)

### Verificar Endpoints Manualmente

Mientras los servicios están corriendo, puedes probar endpoints:

```bash
# Crear un show
curl -X POST http://localhost:3000/api/services/netflix/netflix \
  -H "Content-Type: application/json" \
  -d '{
    "show_id": "test123",
    "type": "Movie",
    "title": "Test Movie",
    "director": "Test Director",
    "cast_members": "Actor 1",
    "country": "USA",
    "release_year": 2023,
    "rating": "PG-13",
    "duration": "120 min",
    "listed_in": "Action",
    "description": "Test"
  }'

# Obtener todos los shows
curl http://localhost:3000/api/services/netflix/netflix

# Buscar shows
curl "http://localhost:3000/api/services/netflix/netflix/search?title=Test"

# Filtrar shows
curl "http://localhost:3000/api/services/netflix/netflix/filter?type=Movie&year=2023"
```

## Comandos Disponibles

### Tests Unitarios

```bash
# Un proyecto
nx test <proyecto>                          # Ejecutar tests
nx test <proyecto> --watch                  # Modo watch
nx test <proyecto> --codeCoverage          # Con cobertura

# Todos los proyectos
nx run-many --target=test --all            # Todos los tests
nx run-many --target=test --all --codeCoverage  # Con cobertura
```

### Tests E2E

```bash
# TCP E2E
nx e2e netflix-e2e
nx e2e api-auth-e2e
nx e2e csv-processor-e2e

# HTTP E2E
nx e2e api-gateway-e2e

# Todos los E2E
nx run-many --target=e2e --all
```

### Scripts de package.json

Usar los scripts definidos en `package.json`:

```bash
# Tests específicos
pnpm test:csv-processor:e2e
pnpm test:api-auth:e2e
pnpm test:netflix:e2e
pnpm test:api-gateway:e2e

# Todos los E2E
pnpm test:all:e2e

# Todos los tests unitarios
pnpm test:all

# Con cobertura
pnpm test:all:cov
```

## Solución de Problemas

### Error: Puerto en Uso

**Problema:**

```
Error: listen EADDRINUSE: address already in use :::3002
```

**Solución:**

```bash
# Windows: Encontrar y matar proceso
netstat -ano | findstr :3002
taskkill /PID <PID> /F

# Linux/Mac: Encontrar y matar proceso
lsof -i :3002
kill -9 <PID>
```

### Error: Cannot find module

**Problema:**

```
Cannot find module '@nx-microservices/shared-lib'
```

**Solución:**

```bash
# Reinstalar dependencias
pnpm install

# Limpiar caché de NX
nx reset

# Rebuildar
nx build shared-lib
```

### Error: Prisma Client Not Generated

**Problema:**

```
Cannot find module '@prisma/client-netflix'
```

**Solución:**

```bash
# Generar todos los clientes Prisma
pnpm prisma:generate:all

# O específicamente
pnpm prisma:netflix:generate
```

### Tests E2E Timeout

**Problema:**

```
Timeout - Async callback was not invoked within the 5000ms timeout
```

**Solución:**

1. Verificar que el servicio está corriendo:

```bash
# Debería responder
curl http://localhost:3002
curl http://localhost:3000/api
```

2. Aumentar timeout en `jest.config.ts`:

```typescript
export default {
  // ...
  testTimeout: 10000, // Aumentar a 10 segundos
};
```

### Error: Port 3000 Already in Use

**Problema:**
API Gateway no inicia porque el puerto 3000 está ocupado.

**Solución:**

```bash
# Cambiar puerto temporalmente
PORT=3001 nx serve api-gateway

# Actualizar tests para usar nuevo puerto
# En test-setup.ts:
axios.defaults.baseURL = `http://localhost:3001`;
```

### Tests Fallan Después de Cambios

**Problema:**
Tests que pasaban ahora fallan.

**Solución:**

1. Limpiar caché:

```bash
nx reset
pnpm install
```

2. Regenerar Prisma:

```bash
pnpm prisma:generate:all
```

3. Verificar migraciones:

```bash
pnpm prisma:netflix:migrate
pnpm prisma:test_micro:migrate
```

### Mock No Funciona

**Problema:**

```typescript
expect(mockFunction).toHaveBeenCalled(); // Falla
```

**Solución:**

1. Verificar que el mock está correctamente inyectado:

```typescript
const mockService = {
  method: jest.fn(), // ✅ Correcto
};

// ❌ Incorrecto
const mockService = {
  method: () => {}, // No es un mock de Jest
};
```

2. Limpiar mocks entre tests:

```typescript
afterEach(() => {
  jest.clearAllMocks(); // Importante!
});
```

### Database Lock Error

**Problema:**

```
Error: database is locked
```

**Solución:**

```bash
# Resetear base de datos de test
pnpm prisma:netflix:reset

# Volver a migrar
pnpm prisma:netflix:migrate
```

## Workflow Recomendado

### Desarrollo Local

1. **Antes de hacer commits:**

```bash
# Ejecutar tests unitarios relevantes
nx test netflix

# Ejecutar linter
nx lint netflix

# Ejecutar formatter
pnpm format:write
```

2. **Antes de crear PR:**

```bash
# Ejecutar todos los tests unitarios
pnpm test:all

# Ejecutar todos los linters
pnpm lint:all

# Verificar formato
pnpm format:check
```

3. **Antes de merge a main:**

```bash
# Ejecutar suite completa
pnpm test:all
pnpm test:all:e2e
pnpm lint:all
```

### CI/CD Pipeline

El pipeline ejecuta:

1. **Lint**: `pnpm lint:all`
2. **Format Check**: `pnpm format:check`
3. **Unit Tests**: `pnpm test:all`
4. **Build**: `pnpm build:all`
5. **E2E Tests**: `pnpm test:all:e2e` (en entorno controlado)

## Recursos Adicionales

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [NX Testing](https://nx.dev/recipes/jest)
- [Guía de Creación de Tests](./TESTING_GUIDE.md)
- [Mejores Prácticas](./BEST_PRACTICES.md)

---

📖 **Volver a**: [README Principal](../README.md) | [Guía de Tests](./TESTING_GUIDE.md)
