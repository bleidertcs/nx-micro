import { Injectable } from '@nestjs/common';
import { PrismaService } from '@nx-microservices/test_micro';
import { Review } from 'apps/csv-processor/src/domain/entities/review.entity';
import { IReviewRepository } from 'apps/csv-processor/src/domain/repositories/review.repository.interface';

@Injectable()
export class PrismaReviewRepository implements IReviewRepository {
    constructor(private readonly prisma: PrismaService) { }

    async createMany(reviews: Omit<Review, 'id'>[]): Promise<void> {
        await this.prisma.review.createMany({
            data: reviews,
        });
    }
}
