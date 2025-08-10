import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length, Validate } from 'class-validator';
import { IsPasswordStrong } from '@common/constraints/password.constraint';

export class LoginDto {
  @ApiProperty({
    description: 'Email address of the user',
    example: 'user@example.com'
  })
  @IsEmail()
  email: string;

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
