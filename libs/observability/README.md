# Observability Library

Librería compartida que proporciona instrumentación de observabilidad para todos los microservicios usando OpenTelemetry. Centraliza la configuración de traces, metrics y logs, y proporciona un logger estructurado basado en Winston.

## 📋 Tabla de Contenidos

- [Descripción](#descripción)
- [Funcionalidades](#funcionalidades)
- [Uso](#uso)
- [Configuración](#configuración)
- [Componentes](#componentes)
- [Integración con SigNoz](#integración-con-signoz)

## 🎯 Descripción

La librería `@nx-microservices/observability` es una librería compartida que:

- Inicializa el SDK de OpenTelemetry para Node.js
- Configura exportadores de traces, metrics y logs
- Proporciona un logger estructurado basado en Winston
- Integra logs con OpenTelemetry para correlación
- Centraliza la configuración de observabilidad en un solo lugar

## ✨ Funcionalidades

### 1. Inicialización de OpenTelemetry

La función `initObservability()` configura el SDK de OpenTelemetry con:

- **Traces**: Exportación de traces distribuidos vía OTLP HTTP
- **Metrics**: Exportación de métricas vía OTLP HTTP con intervalo configurable
- **Auto-instrumentación**: Instrumentación automática de NestJS, Prisma, HTTP, etc.
- **Recursos**: Identificación de servicios con nombre único

### 2. Logger Estructurado

Proporciona un logger Winston configurado con:

- **Formato JSON**: Logs estructurados para fácil parsing
- **Niveles de log**: Configurables vía `LOG_LEVEL`
- **Correlación con traces**: Integración con OpenTelemetry
- **Manejo de errores**: Captura de excepciones no manejadas

### 3. Módulo NestJS

El `ObservabilityModule` proporciona:

- Inyección de dependencias del logger
- Configuración global para todos los servicios
- Token `LOGGER_TOKEN` para acceso al logger

## 🚀 Uso

### Inicialización en un Servicio

En el archivo `main.ts` de cada servicio:

```typescript
import { initObservability } from '@nx-microservices/observability';

async function bootstrap() {
  // Inicializar observabilidad ANTES de crear la aplicación NestJS
  initObservability('nombre-del-servicio');

  const app = await NestFactory.createMicroservice(AppModule, {
    // ... configuración
  });

  await app.listen();
}

bootstrap();
```

### Uso del Logger

En cualquier servicio o controlador:

```typescript
import { Inject } from '@nestjs/common';
import { LOGGER_TOKEN } from '@nx-microservices/observability';
import { Logger } from 'winston';

@Controller()
export class MyController {
  constructor(
    @Inject(LOGGER_TOKEN) private readonly logger: Logger
  ) {}

  @Get()
  getData() {
    this.logger.info('Processing request', { userId: '123' });
    
    try {
      // ... lógica
      this.logger.info('Request processed successfully');
    } catch (error) {
      this.logger.error('Error processing request', { error });
      throw error;
    }
  }
}
```

### Uso del Módulo NestJS

En el `app.module.ts`:

```typescript
import { ObservabilityModule } from '@nx-microservices/observability';

@Module({
  imports: [
    ObservabilityModule.forRoot('nombre-del-servicio'),
    // ... otros módulos
  ],
  // ...
})
export class AppModule {}
```

## ⚙️ Configuración

### Variables de Entorno

Agrega al archivo `.env`:

```env
# Nombre del servicio (usado para identificar traces/logs)
OTEL_SERVICE_NAME=mi-servicio

# Endpoints del OpenTelemetry Collector
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://localhost:4318/v1/traces
OTEL_EXPORTER_OTLP_METRICS_ENDPOINT=http://localhost:4318/v1/metrics

# Intervalo de exportación de métricas (en milisegundos)
OTEL_METRIC_EXPORT_INTERVAL=60000

# Nivel de logging
LOG_LEVEL=info  # debug, info, warn, error
```

### Configuración por Defecto

Si no se especifican variables de entorno, la librería usa:

- **Traces endpoint**: `http://localhost:4318/v1/traces`
- **Metrics endpoint**: `http://localhost:4318/v1/metrics`
- **Export interval**: `60000` ms (60 segundos)
- **Log level**: `info`

## 📦 Componentes

### initObservability()

Función principal que inicializa el SDK de OpenTelemetry.

**Ubicación**: `libs/observability/src/lib/observability.ts`

**Parámetros**:
- `serviceName: string` - Nombre único del servicio

**Funcionalidad**:
1. Configura exportadores de traces y metrics
2. Crea el SDK de OpenTelemetry con auto-instrumentación
3. Inicia el SDK
4. Configura manejo de señales para cierre elegante

**Auto-instrumentación incluida**:
- NestJS controllers y providers
- Prisma queries
- HTTP requests/responses
- Winston logs
- Y más (ver `@opentelemetry/auto-instrumentations-node`)

### createLogger()

Función que crea un logger Winston configurado.

**Ubicación**: `libs/observability/src/lib/logger.ts`

**Parámetros**:
- `serviceName: string` - Nombre del servicio

**Retorna**: Instancia de Winston Logger

**Características**:
- Formato JSON estructurado
- Transporte a consola (desarrollo)
- Transporte a OpenTelemetry (producción)
- Captura de excepciones no manejadas

### ObservabilityModule

Módulo NestJS que proporciona el logger como provider.

**Ubicación**: `libs/observability/src/lib/observability.module.ts`

**Método estático**:
- `forRoot(serviceName: string): DynamicModule`

**Proporciona**:
- `LOGGER_TOKEN` - Token para inyección del logger

## 🔗 Integración con SigNoz

La librería está diseñada para trabajar con SigNoz como backend de observabilidad.

### Flujo de Datos

```
Servicio → OpenTelemetry SDK → OpenTelemetry Collector → SigNoz
```

1. **Servicio**: Inicializa observabilidad con `initObservability()`
2. **OpenTelemetry SDK**: Recolecta traces, metrics y logs
3. **OpenTelemetry Collector**: Recibe datos vía OTLP y los exporta a SigNoz
4. **SigNoz**: Almacena y visualiza los datos

### Configuración del Collector

El OpenTelemetry Collector debe estar configurado para recibir datos en:
- **Traces**: `http://localhost:4318/v1/traces`
- **Metrics**: `http://localhost:4318/v1/metrics`
- **Logs**: Vía OpenTelemetry transport de Winston

Ver `otel-collector-config.yaml` en la raíz del proyecto.

### Visualización en SigNoz

Una vez configurado, puedes ver:

- **Traces**: Flujo completo de peticiones entre servicios
- **Metrics**: Métricas de rendimiento (latencia, throughput, etc.)
- **Logs**: Logs estructurados correlacionados con traces

Accede a SigNoz en: http://localhost:8080

## 📊 Traces

Los traces se generan automáticamente para:

- Peticiones HTTP (en API Gateway)
- Comandos TCP entre servicios
- Queries de Prisma
- Operaciones de NestJS

### Ejemplo de Trace

Un trace típico muestra:
```
API Gateway (HTTP Request)
  └─ api-auth (TCP Command: auth.login)
      └─ Prisma Query (findByEmail)
      └─ Prisma Query (saveRefreshToken)
```

## 📈 Metrics

Las métricas se exportan automáticamente para:

- Latencia de peticiones
- Número de peticiones
- Errores
- Y más (dependiendo de la instrumentación)

### Intervalo de Exportación

Por defecto, las métricas se exportan cada 60 segundos. Ajusta con `OTEL_METRIC_EXPORT_INTERVAL`.

## 📝 Logs

Los logs se estructuran en formato JSON y se correlacionan con traces.

### Formato de Log

```json
{
  "level": "info",
  "message": "Processing request",
  "service": "api-auth",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "userId": "123"
}
```

### Niveles de Log

- `debug`: Información detallada para debugging
- `info`: Información general
- `warn`: Advertencias
- `error`: Errores

## 🔧 Personalización

### Desactivar Instrumentación

Para desactivar instrumentaciones específicas:

```typescript
// En observability.ts
instrumentations: [
  getNodeAutoInstrumentations({
    '@opentelemetry/instrumentation-fs': { enabled: false },
    // Desactiva otras según sea necesario
  }),
],
```

### Agregar Recursos Personalizados

Para agregar atributos adicionales al recurso:

```typescript
resource: resourceFromDetectedResource(
  resourceFromAttributes({
    [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
    [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
    'custom.attribute': 'value',
  })
),
```

## 🚀 Ejecución

### Desarrollo

La librería se usa automáticamente cuando los servicios se inician. No requiere ejecución separada.

### Verificación

Para verificar que la observabilidad está funcionando:

1. Inicia un servicio
2. Deberías ver en la consola: `📡 Observabilidad iniciada para: nombre-del-servicio`
3. Realiza algunas peticiones
4. Verifica en SigNoz que aparezcan traces y logs

## 📚 Referencias

- [README Principal](../../README.md)
- [Documentación de OpenTelemetry](https://opentelemetry.io/docs/)
- [Documentación de Winston](https://github.com/winstonjs/winston)
- [Documentación de SigNoz](https://signoz.io/docs/)
- [DeepWiki - Observability & Monitoring](https://deepwiki.com/bleidertcs/nx-micro/11-observability-monitoring)
