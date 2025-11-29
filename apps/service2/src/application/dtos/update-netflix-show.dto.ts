import { PartialType } from '@nestjs/swagger';
import { CreateNetflixShowDto } from './create-netflix-show.dto';

export class UpdateNetflixShowDto extends PartialType(CreateNetflixShowDto) { }
