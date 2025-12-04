import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { NetflixShowRepository } from '../../domain/repositories/netflix-show.repository';
import { UpdateNetflixShowDto } from '../dtos/update-netflix-show.dto';
import { NetflixShow } from '../../domain/entities/netflix-show.entity';
import { NETFLIX_SHOW_REPOSITORY } from '../../config/constants';

@Injectable()
export class UpdateNetflixShowUseCase {
  constructor(
    @Inject(NETFLIX_SHOW_REPOSITORY)
    private readonly repository: NetflixShowRepository
  ) {}

  async execute(id: string, dto: UpdateNetflixShowDto): Promise<NetflixShow> {
    const existing = await this.repository.findOne(id);
    if (!existing) {
      throw new NotFoundException(`Netflix show with ID ${id} not found`);
    }

    const { date_added, ...rest } = dto;
    const updateData: Partial<NetflixShow> = { ...rest };

    if (date_added) {
      updateData.date_added = new Date(date_added);
    }

    return this.repository.update(id, updateData);
  }
}
