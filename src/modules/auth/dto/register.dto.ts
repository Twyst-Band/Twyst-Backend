import { IsEmail, IsString, Length, Validate } from 'class-validator';
import { IsPasswordStrong } from '@common/constraints/password.constraint';
import { IsUsernameValid } from '@common/constraints/username.constraint';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: 'Email address of the user',
    example: 'user@example.com'
  })
  @IsEmail()
  email: string;

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
  username: string;

  @ApiProperty({
    description: 'First name of the user',
    example: 'John',
    minLength: 1,
    maxLength: 40
  })
  @IsString()
  @Length(1, 40)
  firstName: string;

  @ApiProperty({
    description: 'Last name of the user',
    example: 'Doe',
    minLength: 1,
    maxLength: 40
  })
  @IsString()
  @Length(1, 40)
  lastName: string;

  @ApiProperty({
    description:
      'Password for the user account. Must meet strong password requirements.',
    example: 'StrongP@ssw0rd!',
    minLength: 8,
    maxLength: 40
  })
  @IsString()
  @Length(8, 40)
  @Validate(IsPasswordStrong)
  password: string;
}
