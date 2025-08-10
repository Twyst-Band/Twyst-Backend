import { PartialType } from '@nestjs/mapped-types';
import { CreateBodyProfileDto } from './create-body-profile.dto';
import { IsObject, ValidateIf } from 'class-validator';

export class UpdateBodyProfileDto extends PartialType(CreateBodyProfileDto) {
  @ValidateIf((o) => o.addedManually === false)
  @IsObject()
  detectionDump?: Record<string, any>;
}


