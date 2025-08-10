import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateIf, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBodyProfileDto {
  @ApiProperty({ example: 'Week 1 Measurements' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'If true, the profile is added manually; otherwise provided by detection', example: true })
  @IsBoolean()
  addedManually: boolean;

  @ApiPropertyOptional({ description: 'Detection payload only for non-manual profiles', example: { source: 'device', version: '1.0.0' } })
  @ValidateIf((o) => o.addedManually === false)
  @IsObject()
  detectionDump?: Record<string, any>;

  @ApiProperty({ example: 22.4 })
  @IsNumber()
  leftLowerArm: number;
  @ApiProperty({ example: 22.7 })
  @IsNumber()
  rightLowerArm: number;
  @ApiProperty({ example: 31.5 })
  @IsNumber()
  leftUpperArm: number;
  @ApiProperty({ example: 31.8 })
  @IsNumber()
  rightUpperArm: number;
  @ApiProperty({ example: 41.2 })
  @IsNumber()
  leftLowerLeg: number;
  @ApiProperty({ example: 41.0 })
  @IsNumber()
  rightLowerLeg: number;
  @ApiProperty({ example: 52.1 })
  @IsNumber()
  leftUpperLeg: number;
  @ApiProperty({ example: 52.3 })
  @IsNumber()
  rightUpperLeg: number;
  @ApiProperty({ example: 26.3 })
  @IsNumber()
  leftTorso: number;
  @ApiProperty({ example: 26.1 })
  @IsNumber()
  rightTorso: number;
  @ApiProperty({ example: 92.5 })
  @IsNumber()
  hip: number;
  @ApiProperty({ example: 46.0 })
  @IsNumber()
  shoulders: number;
}


