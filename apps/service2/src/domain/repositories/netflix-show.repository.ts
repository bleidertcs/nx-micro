import { NetflixShow } from '../entities/netflix-show.entity';

export interface NetflixShowFilter {
    type?: string;
    release_year?: number;
    country?: string;
    title?: string;
}

export interface NetflixShowRepository {
    create(show: NetflixShow): Promise<NetflixShow>;
    findAll(params: { skip?: number; take?: number; filter?: NetflixShowFilter }): Promise<NetflixShow[]>;
    findOne(id: string): Promise<NetflixShow | null>;
    update(id: string, show: Partial<NetflixShow>): Promise<NetflixShow>;
    delete(id: string): Promise<NetflixShow>;
    count(filter?: NetflixShowFilter): Promise<number>;
}
