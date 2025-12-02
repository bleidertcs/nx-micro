import { INestApplication } from '@nestjs/common';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { json, urlencoded } from 'express';

/**
 * Configuration options for gateway middleware
 */
export interface GatewayMiddlewareOptions {
  /** Enable helmet security headers (default: true) */
  enableHelmet?: boolean;
  /** Enable compression (default: true) */
  enableCompression?: boolean;
  /** Enable HTTP request logging with morgan (default: true) */
  enableLogging?: boolean;
  /** Body parser size limit (default: '10mb') */
  bodyLimit?: string;
  /** CORS configuration */
  cors?: {
    origin?: boolean | string | string[];
    credentials?: boolean;
  };
}

/**
 * Configures common API Gateway middleware including security, compression, logging, and CORS
 * @param app - The NestJS application instance
 * @param options - Configuration options
 */
export function configureGatewayMiddleware(
  app: INestApplication,
  options: GatewayMiddlewareOptions = {}
): void {
  const {
    enableHelmet = true,
    enableCompression = true,
    enableLogging = true,
    bodyLimit = '10mb',
    cors = { origin: true, credentials: true },
  } = options;

  // Enable Helmet for security headers
  if (enableHelmet) {
    app.use(helmet());
  }

  // Enable Compression
  if (enableCompression) {
    app.use(compression());
  }

  // Enable HTTP Request Logging
  if (enableLogging) {
    app.use(morgan('combined'));
  }

  // Set Body Parser Limits
  app.use(json({ limit: bodyLimit }));
  app.use(urlencoded({ extended: true, limit: bodyLimit }));

  // Enable CORS
  if (cors) {
    app.enableCors(cors);
  }
}
