import { PartialType } from '@nestjs/mapped-types';
import { ApiExtraModels } from '@nestjs/swagger';
import { CreateBodyProfileDto } from './create-body-profile.dto';
import { IsObject, ValidateIf } from 'class-validator';

@ApiExtraModels(CreateBodyProfileDto)
export class UpdateBodyProfileDto extends PartialType(CreateBodyProfileDto) {
  @ValidateIf((o) => o.addedManually === false)
  @IsObject()
  detectionDump?: Record<string, any>;
}


