import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { NetflixShowRepository } from '../../domain/repositories/netflix-show.repository';
import { NetflixShow } from '../../domain/entities/netflix-show.entity';

@Injectable()
export class DeleteNetflixShowUseCase {
    constructor(
        @Inject('NetflixShowRepository')
        private readonly repository: NetflixShowRepository,
    ) { }

    async execute(id: string): Promise<NetflixShow> {
        const existing = await this.repository.findOne(id);
        if (!existing) {
            throw new NotFoundException(`Netflix show with ID ${id} not found`);
        }
        return this.repository.delete(id);
    }
}
