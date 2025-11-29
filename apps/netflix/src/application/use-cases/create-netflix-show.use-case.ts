import { Injectable, Inject } from '@nestjs/common';
import { NetflixShowRepository } from '../../domain/repositories/netflix-show.repository';
import { CreateNetflixShowDto } from '../dtos/create-netflix-show.dto';
import { NetflixShow } from '../../domain/entities/netflix-show.entity';
import { NETFLIX_SHOW_REPOSITORY } from '../../config/constants';

@Injectable()
export class CreateNetflixShowUseCase {
  constructor(
    @Inject(NETFLIX_SHOW_REPOSITORY)
    private readonly repository: NetflixShowRepository
  ) {}

  async execute(dto: CreateNetflixShowDto): Promise<NetflixShow> {
    const entity = new NetflixShow(
      dto.show_id,
      dto.type,
      dto.title,
      dto.director,
      dto.cast_members,
      dto.country,
      dto.date_added ? new Date(dto.date_added) : null,
      dto.release_year,
      dto.rating,
      dto.duration,
      dto.listed_in,
      dto.description
    );
    return this.repository.create(entity);
  }
}
