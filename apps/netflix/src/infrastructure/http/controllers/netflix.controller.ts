import { Controller, Inject } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateNetflixShowUseCase } from '../../../app/use-cases/create-netflix-show.use-case';
import { GetNetflixShowsUseCase } from '../../../app/use-cases/get-netflix-shows.use-case';
import { GetNetflixShowUseCase } from '../../../app/use-cases/get-netflix-show.use-case';
import { UpdateNetflixShowUseCase } from '../../../app/use-cases/update-netflix-show.use-case';
import { DeleteNetflixShowUseCase } from '../../../app/use-cases/delete-netflix-show.use-case';
import { CreateNetflixShowDto } from '../../../app/dtos/create-netflix-show.dto';
import { UpdateNetflixShowDto } from '../../../app/dtos/update-netflix-show.dto';
import { LOGGER_TOKEN } from '@nx-microservices/observability';
import { Logger } from 'winston';

@Controller()
export class NetflixController {
  constructor(
    private readonly createUseCase: CreateNetflixShowUseCase,
    private readonly getShowsUseCase: GetNetflixShowsUseCase,
    private readonly getShowUseCase: GetNetflixShowUseCase,
    private readonly updateUseCase: UpdateNetflixShowUseCase,
    private readonly deleteUseCase: DeleteNetflixShowUseCase,
    @Inject(LOGGER_TOKEN) private readonly logger: Logger
  ) {}

  @MessagePattern({ cmd: 'create_netflix_show' })
  create(@Payload() dto: CreateNetflixShowDto) {
    this.logger.info('Received create_netflix_show request');
    return this.createUseCase.execute(dto);
  }

  @MessagePattern({ cmd: 'get_netflix_shows' })
  findAll(@Payload() params: { skip?: number; take?: number }) {
    this.logger.info('Received get_netflix_shows request');
    return this.getShowsUseCase.execute(params);
  }

  @MessagePattern({ cmd: 'search_netflix_shows' })
  search(@Payload() title: string) {
    return this.getShowsUseCase.execute({ filter: { title } });
  }

  @MessagePattern({ cmd: 'filter_netflix_shows' })
  filter(
    @Payload() filter: { type?: string; year?: number; country?: string }
  ) {
    return this.getShowsUseCase.execute({
      filter: {
        type: filter.type,
        release_year: filter.year,
        country: filter.country,
      },
    });
  }

  @MessagePattern({ cmd: 'get_netflix_show' })
  findOne(@Payload() id: string) {
    this.logger.info(`Received get_netflix_show request for ID: ${id}`);
    return this.getShowUseCase.execute(id);
  }

  @MessagePattern({ cmd: 'update_netflix_show' })
  update(@Payload() payload: { id: string; dto: UpdateNetflixShowDto }) {
    return this.updateUseCase.execute(payload.id, payload.dto);
  }

  @MessagePattern({ cmd: 'delete_netflix_show' })
  delete(@Payload() id: string) {
    return this.deleteUseCase.execute(id);
  }
}
