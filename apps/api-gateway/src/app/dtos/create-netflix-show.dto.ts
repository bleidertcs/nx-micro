import { IsString, IsOptional, IsInt, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNetflixShowDto {
  @ApiProperty({ example: 's1' })
  @IsString()
  show_id!: string;

  @ApiPropertyOptional({ example: 'Movie' })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({ example: 'Dick Johnson Is Dead' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: 'Kirsten Johnson' })
  @IsString()
  @IsOptional()
  director?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  cast_members?: string;

  @ApiPropertyOptional({ example: 'United States' })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({ example: '2020-09-25' })
  @IsDateString()
  @IsOptional()
  date_added?: string;

  @ApiPropertyOptional({ example: 2020 })
  @IsInt()
  @IsOptional()
  release_year?: number;

  @ApiPropertyOptional({ example: 'PG-13' })
  @IsString()
  @IsOptional()
  rating?: string;

  @ApiPropertyOptional({ example: '90 min' })
  @IsString()
  @IsOptional()
  duration?: string;

  @ApiPropertyOptional({ example: 'Documentaries' })
  @IsString()
  @IsOptional()
  listed_in?: string;

  @ApiPropertyOptional({
    example:
      'As her father nears the end of his life, filmmaker Kirsten Johnson stages his death in inventive and comical ways to help them both face the inevitable.',
  })
  @IsString()
  @IsOptional()
  description?: string;
}
