import {
  IsOptional,
  IsString,
  Length,
  MaxLength,
  Validate
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUsernameValid } from '@common/constraints/username.constraint';

export class UpdateAccountDto {
  @ApiPropertyOptional({ example: 'John' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  lastName?: string;

  @ApiProperty({
    description:
      'Unique username for the user, must follow specific constraints',
    example: 'john_doe',
    minLength: 3,
    maxLength: 40
  })
  @IsString()
  @Length(3, 40)
  @Validate(IsUsernameValid)
  @IsOptional()
  userName?: string;
}
