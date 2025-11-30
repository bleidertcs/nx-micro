export const SERVICES = {
  API_AUTH: 'api-auth',
  NETFLIX: 'netflix',
  CSV_SERVICE: 'CSV_SERVICE',
} as const;

export const TCP_CONFIG = {
  HOST: process.env.SERVICE_HOST || '127.0.0.1',
  PORTS: {
    API_AUTH: parseInt(process.env.PORT_APIAUTH || '3001'),
    NETFLIX: parseInt(process.env.PORT_NETFLIX || '3002'),
    CSV_PROCESSOR: parseInt(process.env.PORT_CSV_PROCESSOR || '3003'),
  },
  TIMEOUT: parseInt(process.env.TCP_TIMEOUT || '5000'),
} as const;
