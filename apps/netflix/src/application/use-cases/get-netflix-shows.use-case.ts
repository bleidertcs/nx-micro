import { Injectable, Inject } from '@nestjs/common';
import {
  NetflixShowRepository,
  NetflixShowFilter,
} from '../../domain/repositories/netflix-show.repository';
import { NetflixShow } from '../../domain/entities/netflix-show.entity';
import { NETFLIX_SHOW_REPOSITORY } from '../../config/constants';

@Injectable()
export class GetNetflixShowsUseCase {
  constructor(
    @Inject(NETFLIX_SHOW_REPOSITORY)
    private readonly repository: NetflixShowRepository
  ) {}

  async execute(params: {
    skip?: number;
    take?: number;
    filter?: NetflixShowFilter;
  }): Promise<{ data: NetflixShow[]; total: number }> {
    const [data, total] = await Promise.all([
      this.repository.findAll(params),
      this.repository.count(params.filter),
    ]);
    return { data, total };
  }
}
