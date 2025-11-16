import {
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  UseGuards
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LocalAuthGuard } from './guards/local.guard';
import { Public } from '@common/decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { Request } from 'express';
import { RegisterDto } from '@modules/auth/dto/register.dto';
import { AuthService } from '@modules/auth/auth.service';
import { RequestPasswordResetDto } from '@modules/auth/dto/request-password-reset.dto';
import { ResetPasswordDto } from '@modules/auth/dto/reset-password.dto';
import { RequestEmailChangeDto } from '@modules/auth/dto/request-email-change.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Public()
  @UseGuards(LocalAuthGuard)
  @HttpCode(200)
  async login(
    @Body() _loginDto: LoginDto,
    @Req() req: Request & { user: any }
  ) {
    return req.user;
  }

  @Post('register')
  @Public()
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('request-password-reset')
  @Public()
  async requestPasswordReset(
    @Body() requestPasswordResetDto: RequestPasswordResetDto,
    @Req() req: Request
  ) {
    return this.authService.requestPasswordReset(requestPasswordResetDto, req);
  }

  @Post('reset-password')
  @Public()
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Post('request-email-change')
  async requestEmailChange(
    @Body() requestEmailChangeDto: RequestEmailChangeDto
  ) {
    return this.authService.requestEmailChange(requestEmailChangeDto);
  }
}
