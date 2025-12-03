import { Controller, Post, Inject, Logger, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { LOGGER_TOKEN } from '@nx-microservices/observability';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'node:path';
import * as fs from 'node:fs';

@ApiTags('CSV')
@Controller('csv')
export class CsvController {
    constructor(
        @Inject('CSV_SERVICE') private readonly client: ClientProxy,
        @Inject(LOGGER_TOKEN) private readonly logger: Logger,
    ) {
        if (!fs.existsSync('./tmp/uploads')) {
            fs.mkdirSync('./tmp/uploads', { recursive: true });
        }
    }

    @Post('process')
    @ApiOperation({ summary: 'Upload and process CSV', description: 'Uploads a CSV file and triggers processing' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: './tmp/uploads',
            filename: (req, file, cb) => {
                const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
                return cb(null, `${randomName}${extname(file.originalname)}`);
            }
        })
    }))
    async processCsv(@UploadedFile() file: Express.Multer.File) {
        this.logger.log({ message: 'Received request to process CSV', filename: file.filename });
        // Send absolute path to ensure the processor can find it
        const absolutePath = fs.realpathSync(file.path);
        return this.client.send({ cmd: 'process_csv' }, { filePath: absolutePath });
    }
}
