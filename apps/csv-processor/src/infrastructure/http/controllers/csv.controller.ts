import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { ProcessCsvUseCase } from '../../../app/use-cases/process-csv.use-case';

@Controller()
export class CsvController {
    constructor(private readonly processCsvUseCase: ProcessCsvUseCase) { }

    @MessagePattern({ cmd: 'process_csv' })
    async processCsv(data: { filePath: string }) {
        return this.processCsvUseCase.execute(data.filePath);
    }
}
