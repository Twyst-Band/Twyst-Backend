import { IsUUID } from 'class-validator';

export class ChangeEmailDto {
  @IsUUID()
  token: string;
}