# Guía de Creación de Tests

Esta guía explica cómo crear diferentes tipos de tests para el proyecto nx-microservices.

## Tabla de Contenidos

- [Tipos de Tests](#tipos-de-tests)
- [Tests Unitarios](#tests-unitarios)
- [Tests de Integración TCP](#tests-de-integración-tcp)
- [Tests HTTP E2E](#tests-http-e2e)
- [Mejores Prácticas](#mejores-prácticas)

## Tipos de Tests

El proyecto utiliza tres capas de testing:

1. **Unit Tests**: Pruebas aisladas de componentes individuales
2. **TCP E2E Tests**: Pruebas de comunicación directa con microservicios
3. **HTTP E2E Tests**: Pruebas del flujo completo a través del API Gateway

## Tests Unitarios

### Estructura de Archivos

Los tests unitarios se colocan junto al código que prueban con extensión `.spec.ts`:

```
apps/netflix/src/
├── application/
│   └── use-cases/
│       ├── create-netflix-show.use-case.ts
│       └── create-netflix-show.use-case.spec.ts  ← Test unitario
├── infrastructure/
│   ├── http/controllers/
│   │   ├── netflix.controller.ts
│   │   └── netflix.controller.spec.ts  ← Test unitario
│   └── database/
│       ├── prisma-netflix.repository.ts
│       └── prisma-netflix.repository.spec.ts  ← Test unitario
```

### Crear Test de Use Case

**Archivo**: `apps/netflix/src/application/use-cases/mi-use-case.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { MiUseCase } from './mi-use-case';
import { MiRepository } from '../../domain/repositories/mi.repository';
import { MI_REPOSITORY } from '../../config/constants';

describe('MiUseCase', () => {
  let useCase: MiUseCase;
  let repository: MiRepository;

  // Mock del repositorio
  const mockRepository = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MiUseCase,
        {
          provide: MI_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<MiUseCase>(MiUseCase);
    repository = module.get<MiRepository>(MI_REPOSITORY);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should execute successfully', async () => {
    const mockData = { id: '1', name: 'Test' };
    mockRepository.create.mockResolvedValue(mockData);

    const result = await useCase.execute(mockData);

    expect(repository.create).toHaveBeenCalledWith(mockData);
    expect(result).toEqual(mockData);
  });

  it('should throw error when validation fails', async () => {
    mockRepository.create.mockRejectedValue(new Error('Validation error'));

    await expect(useCase.execute({})).rejects.toThrow('Validation error');
  });
});
```

### Crear Test de Controller

**Archivo**: `apps/netflix/src/infrastructure/http/controllers/mi.controller.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { MiController } from './mi.controller';
import { MiUseCase } from '../../../application/use-cases/mi.use-case';
import { LOGGER_TOKEN } from '@nx-microservices/observability';

describe('MiController', () => {
  let controller: MiController;
  let useCase: MiUseCase;

  const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  const mockUseCase = {
    execute: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MiController],
      providers: [
        {
          provide: MiUseCase,
          useValue: mockUseCase,
        },
        {
          provide: LOGGER_TOKEN,
          useValue: mockLogger,
        },
      ],
    }).compile();

    controller = module.get<MiController>(MiController);
    useCase = module.get<MiUseCase>(MiUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call use case with correct params', async () => {
    const mockData = { id: '1' };
    mockUseCase.execute.mockResolvedValue(mockData);

    const result = await controller.handleMessage(mockData);

    expect(useCase.execute).toHaveBeenCalledWith(mockData);
    expect(mockLogger.info).toHaveBeenCalled();
    expect(result).toEqual(mockData);
  });
});
```

### Crear Test de Repository

**Archivo**: `apps/netflix/src/infrastructure/database/mi.repository.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { MiRepository } from './mi.repository';
import { PrismaService } from '@nx-microservices/prisma';
import { LOGGER_TOKEN } from '@nx-microservices/observability';

describe('MiRepository', () => {
  let repository: MiRepository;
  let prismaService: PrismaService;

  const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  const mockPrismaService = {
    miModelo: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MiRepository,
        {
          provide: LOGGER_TOKEN,
          useValue: mockLogger,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<MiRepository>(MiRepository);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create a record', async () => {
    const mockData = { id: '1', name: 'Test' };
    mockPrismaService.miModelo.create.mockResolvedValue(mockData);

    const result = await repository.create(mockData);

    expect(prismaService.miModelo.create).toHaveBeenCalledWith({
      data: mockData,
    });
    expect(result).toEqual(mockData);
  });

  it('should find all records', async () => {
    const mockData = [{ id: '1' }, { id: '2' }];
    mockPrismaService.miModelo.findMany.mockResolvedValue(mockData);

    const result = await repository.findAll({});

    expect(prismaService.miModelo.findMany).toHaveBeenCalled();
    expect(result).toHaveLength(2);
  });
});
```

## Tests de Integración TCP

### Estructura de Archivos

Los tests TCP e2e se ubican en proyectos separados:

```
apps/
├── netflix/                  ← Microservicio
└── netflix-e2e/             ← Tests E2E
    ├── jest.config.ts
    └── src/
        ├── netflix/
        │   └── netflix.spec.ts  ← Tests TCP
        └── support/
            ├── global-setup.ts
            ├── global-teardown.ts
            └── test-setup.ts
```

### Crear Test TCP E2E

**Archivo**: `apps/mi-servicio-e2e/src/mi-servicio/mi-servicio.spec.ts`

```typescript
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

describe('Mi Servicio E2E', () => {
  let client: ClientProxy;
  const testId = `e2e-test-${Date.now()}`;

  beforeAll(() => {
    client = ClientProxyFactory.create({
      transport: Transport.TCP,
      options: {
        host: '127.0.0.1',
        port: 3002, // Puerto del microservicio
      },
    });
  });

  afterAll(async () => {
    await client.close();
  });

  describe('CRUD Operations', () => {
    it('should create a record', async () => {
      const createDto = {
        id: testId,
        name: 'Test Record',
        description: 'E2E Test',
      };

      const response = await firstValueFrom(client.send({ cmd: 'create_record' }, createDto));

      expect(response).toBeDefined();
      expect(response.id).toBe(testId);
      expect(response.name).toBe('Test Record');
    });

    it('should get all records', async () => {
      const response = await firstValueFrom(client.send({ cmd: 'get_records' }, {}));

      expect(response).toBeDefined();
      expect(Array.isArray(response.data)).toBeTruthy();
      expect(typeof response.total).toBe('number');
    });

    it('should get one record', async () => {
      const response = await firstValueFrom(client.send({ cmd: 'get_record' }, testId));

      expect(response).toBeDefined();
      expect(response.id).toBe(testId);
    });

    it('should update a record', async () => {
      const updateDto = {
        name: 'Updated Name',
      };

      const response = await firstValueFrom(client.send({ cmd: 'update_record' }, { id: testId, dto: updateDto }));

      expect(response).toBeDefined();
      expect(response.name).toBe('Updated Name');
    });

    it('should delete a record', async () => {
      const response = await firstValueFrom(client.send({ cmd: 'delete_record' }, testId));

      expect(response).toBeDefined();
      expect(response.id).toBe(testId);
    });

    it('should handle errors correctly', async () => {
      try {
        await firstValueFrom(client.send({ cmd: 'get_record' }, testId));
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });
  });
});
```

## Tests HTTP E2E

### Estructura de Archivos

Los tests HTTP e2e se ubican en el proyecto e2e del gateway:

```
apps/
├── api-gateway/                ← API Gateway
└── api-gateway-e2e/           ← Tests E2E HTTP
    └── src/
        └── nx-microservices/
            └── mi-servicio-flow.spec.ts  ← Tests HTTP
```

### Crear Test HTTP E2E

**Archivo**: `apps/api-gateway-e2e/src/nx-microservices/mi-servicio-flow.spec.ts`

```typescript
import axios, { AxiosError } from 'axios';

describe('Mi Servicio HTTP E2E via API Gateway', () => {
  const gatewayUrl = `http://localhost:3000/api`;
  const basePath = `${gatewayUrl}/services/mi-servicio`;
  const testId = `e2e-http-${Date.now()}`;

  describe('CRUD Operations', () => {
    it('should create via POST', async () => {
      const createDto = {
        id: testId,
        name: 'HTTP Test',
        description: 'E2E HTTP Test',
      };

      const response = await axios.post(basePath, createDto);

      expect(response.status).toBe(201);
      expect(response.data).toBeDefined();
      expect(response.data.id).toBe(testId);
    });

    it('should get all via GET', async () => {
      const response = await axios.get(basePath);

      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data.data)).toBeTruthy();
    });

    it('should get with pagination via GET + query params', async () => {
      const response = await axios.get(basePath, {
        params: { skip: 0, take: 5 },
      });

      expect(response.status).toBe(200);
      expect(response.data.data.length).toBeLessThanOrEqual(5);
    });

    it('should get one via GET /:id', async () => {
      const response = await axios.get(`${basePath}/${testId}`);

      expect(response.status).toBe(200);
      expect(response.data.id).toBe(testId);
    });

    it('should search via GET /search', async () => {
      const response = await axios.get(`${basePath}/search`, {
        params: { query: 'HTTP Test' },
      });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.data)).toBeTruthy();
    });

    it('should filter via GET /filter', async () => {
      const response = await axios.get(`${basePath}/filter`, {
        params: { category: 'test' },
      });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.data)).toBeTruthy();
    });

    it('should update via PUT /:id', async () => {
      const updateDto = {
        name: 'Updated HTTP Test',
      };

      const response = await axios.put(`${basePath}/${testId}`, updateDto);

      expect(response.status).toBe(200);
      expect(response.data.name).toBe('Updated HTTP Test');
    });

    it('should delete via DELETE /:id', async () => {
      const response = await axios.delete(`${basePath}/${testId}`);

      expect(response.status).toBe(200);
      expect(response.data.id).toBe(testId);
    });

    it('should return error when resource not found', async () => {
      try {
        await axios.get(`${basePath}/${testId}`);
        fail('Should have thrown an error');
      } catch (error) {
        const axiosError = error as AxiosError;
        expect(axiosError.response?.status).toBeGreaterThanOrEqual(400);
      }
    });
  });
});
```

## Mejores Prácticas

### 1. Naming Conventions

- **Archivos de test**: Usar `.spec.ts` para tests unitarios
- **Describe blocks**: Describir la clase/función que se prueba
- **Test names**: Usar "should" para describir el comportamiento esperado

```typescript
describe('MiClase', () => {
  it('should do something specific', () => {
    // ...
  });
});
```

### 2. Arrange-Act-Assert (AAA)

Organizar cada test en tres secciones claras:

```typescript
it('should create a user', async () => {
  // Arrange: Preparar datos y mocks
  const userData = { name: 'John', email: 'john@example.com' };
  mockRepository.create.mockResolvedValue(userData);

  // Act: Ejecutar la acción
  const result = await service.createUser(userData);

  // Assert: Verificar resultados
  expect(result).toEqual(userData);
  expect(mockRepository.create).toHaveBeenCalledWith(userData);
});
```

### 3. Usar beforeEach y afterEach

```typescript
describe('MiTest', () => {
  beforeEach(() => {
    // Configuración antes de cada test
  });

  afterEach(() => {
    // Limpieza después de cada test
    jest.clearAllMocks();
  });
});
```

### 4. Mocking Efectivo

```typescript
// Mock de funciones
const mockFunction = jest.fn();

// Mock con valor de retorno
mockFunction.mockReturnValue('value');

// Mock con promesa
mockFunction.mockResolvedValue('async value');

// Mock con error
mockFunction.mockRejectedValue(new Error('error'));

// Verificar llamadas
expect(mockFunction).toHaveBeenCalled();
expect(mockFunction).toHaveBeenCalledWith('arg1', 'arg2');
expect(mockFunction).toHaveBeenCalledTimes(2);
```

### 5. Test de Errores

Siempre probar casos de error:

```typescript
it('should throw NotFoundException when not found', async () => {
  mockRepository.findOne.mockResolvedValue(null);

  await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
});
```

### 6. Test Isolation

Cada test debe ser independiente:

```typescript
// ❌ Malo: Tests dependen del orden
it('should create user', () => {
  user = service.create({ name: 'John' });
});

it('should get user', () => {
  const found = service.findOne(user.id); // Depende del test anterior
});

// ✅ Bueno: Tests independientes
it('should create user', () => {
  const user = service.create({ name: 'John' });
  expect(user).toBeDefined();
});

it('should get user', () => {
  mockRepository.findOne.mockResolvedValue({ id: '1', name: 'John' });
  const found = service.findOne('1');
  expect(found).toBeDefined();
});
```

### 7. Cobertura de Tests

Apuntar a:

- **80%+ de cobertura** en código crítico
- **100% de cobertura** en la capa de dominio/use cases
- Todos los casos de error cubiertos

### 8. Datos de Test

Usar datos significativos y descriptivos:

```typescript
// ❌ Malo
const dto = { a: 'x', b: 1 };

// ✅ Bueno
const createUserDto = {
  email: 'test@example.com',
  name: 'John Doe',
  age: 30,
};
```

### 9. Test de Integración

Para tests de integración, usar IDs únicos basados en timestamp:

```typescript
const testId = `e2e-test-${Date.now()}`;
```

### 10. Configuración de Jest

El proyecto usa configuración centralizada en `jest.preset.js`:

```typescript
// apps/mi-app/jest.config.ts
export default {
  displayName: 'mi-app',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/mi-app',
};
```

---

📖 **Siguiente**: [Guía de Ejecución de Tests](./TESTING_EXECUTION.md)
