import { IsString, IsUUID, MinLength, Validate } from 'class-validator';
import { IsPasswordStrong } from '@common/constraints/password.constraint';

export class ResetPasswordDto {
  @IsUUID()
  token: string;

  @IsString()
  @MinLength(8)
  @Validate(IsPasswordStrong)
  newPassword: string;
}
