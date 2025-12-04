import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiProperty({
    description: 'User name',
    example: 'John Doe',
    minLength: 1,
  })
  @IsString()
  @MinLength(1, { message: 'Name cannot be empty' })
  name: string;
}
