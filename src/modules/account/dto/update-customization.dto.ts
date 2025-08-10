import { IsString } from 'class-validator';

export class UpdateCustomizationDto {
  @IsString() bodyShape: string;
  @IsString() bodyTone: string;
  @IsString() eyeColor: string;
  @IsString() expression: string;
  @IsString() hairColor: string;
  @IsString() hairstyle: string;
  @IsString() glassesStyle: string;
  @IsString() glassesColor: string;
  @IsString() facialHairColor: string;
  @IsString() facialHair: string;
  @IsString() headwearColor: string;
  @IsString() headwear: string;
  @IsString() clothingColor: string;
  @IsString() backgroundColor: string;
}


