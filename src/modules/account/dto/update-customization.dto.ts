import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCustomizationDto {
  @ApiProperty({ example: 'athletic' })
  @IsString() bodyShape: string;
  @ApiProperty({ example: 'tan' })
  @IsString() bodyTone: string;
  @ApiProperty({ example: '#4a8ef0' })
  @IsString() eyeColor: string;
  @ApiProperty({ example: 'smile' })
  @IsString() expression: string;
  @ApiProperty({ example: 'black' })
  @IsString() hairColor: string;
  @ApiProperty({ example: 'short' })
  @IsString() hairstyle: string;
  @ApiProperty({ example: 'round' })
  @IsString() glassesStyle: string;
  @ApiProperty({ example: '#000000' })
  @IsString() glassesColor: string;
  @ApiProperty({ example: '#8b4513' })
  @IsString() facialHairColor: string;
  @ApiProperty({ example: 'mustache' })
  @IsString() facialHair: string;
  @ApiProperty({ example: '#ffcc00' })
  @IsString() headwearColor: string;
  @ApiProperty({ example: 'cap' })
  @IsString() headwear: string;
  @ApiProperty({ example: '#dddddd' })
  @IsString() clothingColor: string;
  @ApiProperty({ example: '#ffffff' })
  @IsString() backgroundColor: string;
}


