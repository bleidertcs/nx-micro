import { Module } from '@nestjs/common';
import { ObservabilityModule } from '@nx-microservices/observability';
import { PrismaClientModule } from '@nx-microservices/prisma-client';
import { NetflixController } from '../infrastructure/http/controllers/netflix.controller';
import { PrismaNetflixRepository } from '../infrastructure/database/prisma-netflix.repository';
import { CreateNetflixShowUseCase } from '../application/use-cases/create-netflix-show.use-case';
import { GetNetflixShowsUseCase } from '../application/use-cases/get-netflix-shows.use-case';
import { GetNetflixShowUseCase } from '../application/use-cases/get-netflix-show.use-case';
import { UpdateNetflixShowUseCase } from '../application/use-cases/update-netflix-show.use-case';
import { DeleteNetflixShowUseCase } from '../application/use-cases/delete-netflix-show.use-case';


@Module({
  imports: [
    ObservabilityModule.forRoot('service2'),
    PrismaClientModule,
  ],
  controllers: [NetflixController],
  providers: [
    PrismaNetflixRepository,
    {
      provide: 'NetflixShowRepository',
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
