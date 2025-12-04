import { Injectable, Inject } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'fast-csv';
import { Logger } from 'winston';
import { LOGGER_TOKEN } from '@nx-microservices/observability';
import { IReviewRepository } from '../../domain/repositories/review.repository.interface';
import { Review } from '../../domain/entities/review.entity';

@Injectable()
export class ProcessCsvUseCase {
    constructor(
        @Inject('IReviewRepository') private readonly reviewRepository: IReviewRepository,
        @Inject(LOGGER_TOKEN) private readonly logger: Logger,
    ) { }

    async execute(filePath: string): Promise<{ message: string; count: number }> {
        const csvFilePath = filePath;
        this.logger.info(`Starting CSV processing from: ${csvFilePath}`);

        if (!fs.existsSync(csvFilePath)) {
            throw new Error(`CSV file not found at ${csvFilePath}`);
        }

        let totalProcessed = 0;
        let batch: Omit<Review, 'id'>[] = [];
        const BATCH_SIZE = 1000;

        const stream = fs.createReadStream(csvFilePath)
            .pipe(csv.parse({ headers: false }));

        try {
            for await (const row of stream) {
                // row structure: [rating, title, content]
                const rating = parseInt(row[0], 10);
                const title = row[1];
                const content = row[2];

                if (!isNaN(rating) && typeof title === 'string' && typeof content === 'string') {
                    batch.push({ rating, title, content });
                } else {
                    this.logger.warn(`Skipping invalid row: ${row}`);
                }

                if (batch.length >= BATCH_SIZE) {
                    await this.reviewRepository.createMany(batch);
                    totalProcessed += batch.length;
                    this.logger.info(`Saved batch. Total processed: ${totalProcessed}`);
                    batch = [];
                }
            }

            // Insert remaining records
            if (batch.length > 0) {
                await this.reviewRepository.createMany(batch);
                totalProcessed += batch.length;
            }

            this.logger.info(`CSV processing completed. Total records: ${totalProcessed}`);
            return { message: 'CSV processed successfully', count: totalProcessed };
        } catch (error) {
            this.logger.error('Error processing CSV', error);
            fs.appendFileSync('csv-processor-error.log', `Error processing CSV: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}\n`);
            throw error;
        }
    }
}
