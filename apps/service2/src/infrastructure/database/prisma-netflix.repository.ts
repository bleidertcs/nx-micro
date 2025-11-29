import { Injectable, Inject } from '@nestjs/common';
import { PrismaClient, NetflixShow as PrismaNetflixShow } from '@nx-microservices/prisma-netflix';
import { NetflixShow } from '../../domain/entities/netflix-show.entity';
import { NetflixShowRepository, NetflixShowFilter } from '../../domain/repositories/netflix-show.repository';
import { LOGGER_TOKEN } from '@nx-microservices/observability';
import { Logger } from 'winston';

@Injectable()
export class PrismaNetflixRepository implements NetflixShowRepository {
    private prisma: PrismaClient;

    constructor(
        @Inject(LOGGER_TOKEN) private readonly logger: Logger,
    ) {
        this.prisma = new PrismaClient();
    }

    async create(show: NetflixShow): Promise<NetflixShow> {
        this.logger.info(`Creating Netflix show: ${show.show_id}`);
        const created = await this.prisma.netflixShow.create({
            data: show,
        });
        return this.mapToEntity(created);
    }

    async findAll(params: { skip?: number; take?: number; filter?: NetflixShowFilter }): Promise<NetflixShow[]> {
        const { skip, take, filter } = params;
        this.logger.info('Finding all Netflix shows', { skip, take, filter });
        const where: any = {};

        if (filter?.type) where.type = filter.type;
        if (filter?.release_year) where.release_year = filter.release_year;
        if (filter?.country) where.country = { contains: filter.country, mode: 'insensitive' };
        if (filter?.title) where.title = { contains: filter.title, mode: 'insensitive' };

        const shows = await this.prisma.netflixShow.findMany({
            skip,
            take,
            where,
        });
        return shows.map(this.mapToEntity);
    }

    async findOne(id: string): Promise<NetflixShow | null> {
        this.logger.info(`Finding Netflix show by ID: ${id}`);
        const show = await this.prisma.netflixShow.findUnique({
            where: { show_id: id },
        });
        return show ? this.mapToEntity(show) : null;
    }

    async update(id: string, show: Partial<NetflixShow>): Promise<NetflixShow> {
        const updated = await this.prisma.netflixShow.update({
            where: { show_id: id },
            data: show,
        });
        return this.mapToEntity(updated);
    }

    async delete(id: string): Promise<NetflixShow> {
        const deleted = await this.prisma.netflixShow.delete({
            where: { show_id: id },
        });
        return this.mapToEntity(deleted);
    }

    async count(filter?: NetflixShowFilter): Promise<number> {
        const where: any = {};
        if (filter?.type) where.type = filter.type;
        if (filter?.release_year) where.release_year = filter.release_year;
        if (filter?.country) where.country = { contains: filter.country, mode: 'insensitive' };
        if (filter?.title) where.title = { contains: filter.title, mode: 'insensitive' };

        return this.prisma.netflixShow.count({ where });
    }

    private mapToEntity(prismaShow: PrismaNetflixShow): NetflixShow {
        return new NetflixShow(
            prismaShow.show_id,
            prismaShow.type,
            prismaShow.title,
            prismaShow.director,
            prismaShow.cast_members,
            prismaShow.country,
            prismaShow.date_added,
            prismaShow.release_year,
            prismaShow.rating,
            prismaShow.duration,
            prismaShow.listed_in,
            prismaShow.description,
        );
    }
}
