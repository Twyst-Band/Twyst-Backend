import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateIf, IsObject } from 'class-validator';

export class CreateBodyProfileDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsBoolean()
  addedManually: boolean;

  @ValidateIf((o) => o.addedManually === false)
  @IsObject()
  detectionDump?: Record<string, any>;

  @IsNumber()
  leftLowerArm: number;
  @IsNumber()
  rightLowerArm: number;
  @IsNumber()
  leftUpperArm: number;
  @IsNumber()
  rightUpperArm: number;
  @IsNumber()
  leftLowerLeg: number;
  @IsNumber()
  rightLowerLeg: number;
  @IsNumber()
  leftUpperLeg: number;
  @IsNumber()
  rightUpperLeg: number;
  @IsNumber()
  leftTorso: number;
  @IsNumber()
  rightTorso: number;
  @IsNumber()
  hip: number;
  @IsNumber()
  shoulders: number;
}


