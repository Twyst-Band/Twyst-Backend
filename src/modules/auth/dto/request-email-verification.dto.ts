import { IsNumber } from 'class-validator';

export class RequestEmailVerificationDto {
  @IsNumber()
  userID: number;
}
