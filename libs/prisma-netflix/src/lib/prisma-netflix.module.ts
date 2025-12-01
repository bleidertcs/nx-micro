import { Module } from '@nestjs/common';
import { PrismaNetflixService } from './prisma-netflix.service';

@Module({
  controllers: [],
  providers: [PrismaNetflixService],
  exports: [PrismaNetflixService],
})
export class PrismaNetflixModule {}
