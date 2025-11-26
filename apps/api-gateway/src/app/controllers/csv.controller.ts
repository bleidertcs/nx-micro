import { Controller, Post, Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { LOGGER_TOKEN } from '@nx-microservices/observability';

@Controller('csv')
export class CsvController {
    constructor(
        @Inject('CSV_SERVICE') private readonly client: ClientProxy,
        @Inject(LOGGER_TOKEN) private readonly logger: Logger,
    ) { }

    @Post('process')
    async processCsv() {
        this.logger.log({ message: 'Received request to process CSV' });
        return this.client.send({ cmd: 'process_csv' }, {});
    }
}
