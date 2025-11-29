import { ClientsModule, Transport } from '@nestjs/microservices';
import { TCP_CONFIG, SERVICES } from './constants';

export const microservicesConfig = ClientsModule.register([
  {
    name: SERVICES.API_AUTH,
    transport: Transport.TCP,
    options: {
      host: TCP_CONFIG.HOST,
      port: TCP_CONFIG.PORTS.API_AUTH,
    },
  },
  {
    name: SERVICES.NETFLIX,
    transport: Transport.TCP,
    options: {
      host: TCP_CONFIG.HOST,
      port: TCP_CONFIG.PORTS.NETFLIX,
    },
  },
  {
    name: SERVICES.CSV_SERVICE,
    transport: Transport.TCP,
    options: {
      host: TCP_CONFIG.HOST,
      port: TCP_CONFIG.PORTS.CSV_PROCESSOR,
    },
  },
]);
