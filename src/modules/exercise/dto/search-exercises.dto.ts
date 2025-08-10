import { Transform } from 'class-transformer';
import { IsArray, IsIn, IsInt, IsOptional, IsPositive, IsString, Max, Min } from 'class-validator';

function toNumberArray(value: any): number[] | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (Array.isArray(value)) return value.map((v) => Number(v)).filter((n) => !Number.isNaN(n));
  if (typeof value === 'string') return value.split(',').map((v) => Number(v)).filter((n) => !Number.isNaN(n));
  return undefined;
}

export class SearchExercisesDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  @IsInt()
  @Min(1)
  @Max(10)
  minDifficulty?: number;

  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  @IsInt()
  @Min(1)
  @Max(10)
  maxDifficulty?: number;

  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  @IsInt()
  categoryID?: number;

  @IsOptional()
  @Transform(({ value }) => toNumberArray(value))
  @IsArray()
  tagIDs?: number[];

  @IsOptional()
  @Transform(({ value }) => toNumberArray(value))
  @IsArray()
  equipmentIDs?: number[];

  @IsOptional()
  @IsIn(['any', 'all'])
  match: 'any' | 'all' = 'any';

  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : 1))
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : 20))
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 20;

  @IsOptional()
  @IsIn(['name', 'difficulty'])
  sortBy: 'name' | 'difficulty' = 'name';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortDir: 'asc' | 'desc' = 'asc';
}


