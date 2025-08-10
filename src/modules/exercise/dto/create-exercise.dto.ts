import { IsArray, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateExerciseDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @Min(1)
  difficulty: number;

  @IsInt()
  categoryID: number;

  @IsIn(['private', 'public'])
  access: 'private' | 'public';

  @IsArray()
  @IsInt({ each: true })
  tagIDs: number[];

  @IsArray()
  @IsInt({ each: true })
  equipmentIDs: number[];

  // TODO: add MongoDB movement data reference here
}


