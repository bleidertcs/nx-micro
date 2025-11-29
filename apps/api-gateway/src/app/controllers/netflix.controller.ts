import { Controller, Get, Post, Body, Put, Param, Delete, Query, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { CreateNetflixShowDto } from '../dtos/create-netflix-show.dto';
import { UpdateNetflixShowDto } from '../dtos/update-netflix-show.dto';
import { SERVICES } from '../../config/constants';

@ApiTags('Netflix')
@Controller('services/service2/netflix')
export class NetflixController {
    constructor(
        @Inject(SERVICES.SERVICE2) private readonly client: ClientProxy,
    ) { }

    @Post()
    @ApiOperation({ summary: 'Create a new Netflix show' })
    create(@Body() dto: CreateNetflixShowDto) {
        return this.client.send({ cmd: 'create_netflix_show' }, dto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all Netflix shows with pagination' })
    @ApiQuery({ name: 'skip', required: false, type: Number })
    @ApiQuery({ name: 'take', required: false, type: Number })
    findAll(
        @Query('skip') skip?: number,
        @Query('take') take?: number,
    ) {
        return this.client.send({ cmd: 'get_netflix_shows' }, {
            skip: skip ? Number(skip) : undefined,
            take: take ? Number(take) : undefined
        });
    }

    @Get('search')
    @ApiOperation({ summary: 'Search Netflix shows by title' })
    @ApiQuery({ name: 'title', required: true, type: String })
    search(@Query('title') title: string) {
        return this.client.send({ cmd: 'search_netflix_shows' }, title);
    }

    @Get('filter')
    @ApiOperation({ summary: 'Filter Netflix shows' })
    @ApiQuery({ name: 'type', required: false, type: String })
    @ApiQuery({ name: 'year', required: false, type: Number })
    @ApiQuery({ name: 'country', required: false, type: String })
    filter(
        @Query('type') type?: string,
        @Query('year') year?: number,
        @Query('country') country?: string,
    ) {
        return this.client.send({ cmd: 'filter_netflix_shows' }, {
            type,
            year: year ? Number(year) : undefined,
            country
        });
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a Netflix show by ID' })
    findOne(@Param('id') id: string) {
        return this.client.send({ cmd: 'get_netflix_show' }, id);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update a Netflix show' })
    update(@Param('id') id: string, @Body() dto: UpdateNetflixShowDto) {
        return this.client.send({ cmd: 'update_netflix_show' }, { id, dto });
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a Netflix show' })
    delete(@Param('id') id: string) {
        return this.client.send({ cmd: 'delete_netflix_show' }, id);
    }
}
