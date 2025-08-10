import { IsArray, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateExerciseDto {
  @ApiProperty({ description: 'Exercise name', example: 'Bench Press' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Exercise description', example: 'Chest compound movement' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Difficulty level from 1 to 10', minimum: 1, maximum: 10, example: 5 })
  @IsInt()
  @Min(1)
  difficulty: number;

  @ApiProperty({ description: 'Workout category id', example: 1 })
  @IsInt()
  categoryID: number;

  @ApiProperty({ enum: ['private', 'public'], example: 'private' })
  @IsIn(['private', 'public'])
  access: 'private' | 'public';

  @ApiProperty({ description: 'List of tag ids', example: [1, 2, 3] })
  @IsArray()
  @IsInt({ each: true })
  tagIDs: number[];

  @ApiProperty({ description: 'List of equipment ids', example: [4, 5] })
  @IsArray()
  @IsInt({ each: true })
  equipmentIDs: number[];

  // TODO: add MongoDB movement data reference here
}


