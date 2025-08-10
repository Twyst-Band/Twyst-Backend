import { Transform } from 'class-transformer';
import { IsArray, IsIn, IsInt, IsOptional, IsPositive, IsString, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

function toNumberArray(value: any): number[] | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (Array.isArray(value)) return value.map((v) => Number(v)).filter((n) => !Number.isNaN(n));
  if (typeof value === 'string') return value.split(',').map((v) => Number(v)).filter((n) => !Number.isNaN(n));
  return undefined;
}

export class SearchExercisesDto {
  @ApiPropertyOptional({ description: 'Full-text query on exercise name', example: 'bench' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 10, example: 3 })
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  @IsInt()
  @Min(1)
  @Max(10)
  minDifficulty?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 10, example: 8 })
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  @IsInt()
  @Min(1)
  @Max(10)
  maxDifficulty?: number;

  @ApiPropertyOptional({ description: 'Workout category filter', example: 2 })
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  @IsInt()
  categoryID?: number;

  @ApiPropertyOptional({ description: 'Comma-separated tag ids or repeated query params', example: '1,2,3' })
  @IsOptional()
  @Transform(({ value }) => toNumberArray(value))
  @IsArray()
  tagIDs?: number[];

  @ApiPropertyOptional({ description: 'Comma-separated equipment ids or repeated params', example: '5,6' })
  @IsOptional()
  @Transform(({ value }) => toNumberArray(value))
  @IsArray()
  equipmentIDs?: number[];

  @ApiPropertyOptional({ enum: ['any', 'all'], example: 'any' })
  @IsOptional()
  @IsIn(['any', 'all'])
  match: 'any' | 'all' = 'any';

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : 1))
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ example: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : 20))
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 20;

  @ApiPropertyOptional({ enum: ['name', 'difficulty'], example: 'name' })
  @IsOptional()
  @IsIn(['name', 'difficulty'])
  sortBy: 'name' | 'difficulty' = 'name';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], example: 'asc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortDir: 'asc' | 'desc' = 'asc';
}


