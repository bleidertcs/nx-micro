// libs/shared/observability/src/lib/observability.ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { resourceFromDetectedResource } from '@opentelemetry/resources/build/src/ResourceImpl';

// Configuración por defecto para entorno local
// Docker expone el puerto 4318 en localhost, así que esto funcionará directo.
const DEFAULT_TRACE_COLLECTOR_URL = process.env['OTEL_EXPORTER_OTLP_TRACES_ENDPOINT'] || 'http://localhost:4318/v1/traces';
const DEFAULT_METRICS_COLLECTOR_URL = process.env['OTEL_EXPORTER_OTLP_METRICS_ENDPOINT'] || 'http://localhost:4318/v1/metrics';

export function initObservability(serviceName: string) {
  // Permitir sobreescribir la URL por variable de entorno (útil para prod)
  const traceExporter = new OTLPTraceExporter({
    url:
      process.env['OTEL_EXPORTER_OTLP_TRACES_ENDPOINT'] ||
      process.env['OTEL_EXPORTER_OTLP_ENDPOINT'] ||
      DEFAULT_TRACE_COLLECTOR_URL,
  });

  const metricExporter = new OTLPMetricExporter({
    url:
      process.env['OTEL_EXPORTER_OTLP_METRICS_ENDPOINT'] ||
      process.env['OTEL_EXPORTER_OTLP_ENDPOINT'] ||
      DEFAULT_METRICS_COLLECTOR_URL,
  });

  const sdk = new NodeSDK({
    resource: resourceFromDetectedResource(
      resourceFromAttributes({
        [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
      })
    ),
    traceExporter,
    metricReader: new PeriodicExportingMetricReader({
      exporter: metricExporter,
      exportIntervalMillis: Number(process.env['OTEL_METRIC_EXPORT_INTERVAL'] || 60000),
    }),
    instrumentations: [
      getNodeAutoInstrumentations({
        // Desactiva fs para reducir ruido si quieres
        '@opentelemetry/instrumentation-fs': { enabled: false },
      }),
    ],
  });

  // Iniciar el SDK
  sdk.start();

  // Manejo de cierre
  process.on('SIGTERM', () => {
    sdk.shutdown()
      .then(() => console.log('Observability SDK terminated'))
      .catch((error) => console.log('Error terminating SDK', error));
  });

  console.log(`📡 Observabilidad iniciada para: ${serviceName}`);
}
