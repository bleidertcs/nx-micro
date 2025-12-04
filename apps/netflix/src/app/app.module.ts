import { Module } from '@nestjs/common';
import { ObservabilityModule } from '@nx-microservices/observability';
import { PrismaNetflixModule } from '@nx-microservices/prisma-netflix';
import { NetflixController } from '../infrastructure/http/controllers/netflix.controller';
import { PrismaNetflixRepository } from '../infrastructure/database/prisma-netflix.repository';
import { CreateNetflixShowUseCase } from './use-cases/create-netflix-show.use-case';
import { GetNetflixShowsUseCase } from './use-cases/get-netflix-shows.use-case';
import { GetNetflixShowUseCase } from './use-cases/get-netflix-show.use-case';
import { UpdateNetflixShowUseCase } from './use-cases/update-netflix-show.use-case';
import { DeleteNetflixShowUseCase } from './use-cases/delete-netflix-show.use-case';
import { NETFLIX_SHOW_REPOSITORY } from '../config/constants';

@Module({
  imports: [ObservabilityModule.forRoot('netflix'), PrismaNetflixModule],
  controllers: [NetflixController],
  providers: [
    PrismaNetflixRepository,
    {
      provide: NETFLIX_SHOW_REPOSITORY,
      useClass: PrismaNetflixRepository,
    },
    CreateNetflixShowUseCase,
    GetNetflixShowsUseCase,
    GetNetflixShowUseCase,
    UpdateNetflixShowUseCase,
    DeleteNetflixShowUseCase,
  ],
})
export class AppModule { }
