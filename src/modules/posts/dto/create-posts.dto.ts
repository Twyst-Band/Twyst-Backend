import { IsOptional, IsString, MaxLength, IsDate } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePostDto {
  @ApiProperty()
  @IsString()
  @MaxLength(1000)
  title: string;

  @ApiProperty()
  @IsString()
  @MaxLength(1000)
  content: string;

  @ApiProperty()
  @IsString()
  @MaxLength(1000)
  userID: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  createdAt?: Date;

  @ApiProperty()
  @IsDate()
  updatedAt: Date;

}
