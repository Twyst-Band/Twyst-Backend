import { PartialType } from '@nestjs/mapped-types';
import { ApiExtraModels } from '@nestjs/swagger';
import { CreateExerciseDto } from './create-exercise.dto';

@ApiExtraModels(CreateExerciseDto)
export class UpdateExerciseDto extends PartialType(CreateExerciseDto) {}


