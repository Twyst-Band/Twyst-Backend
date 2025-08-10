import {
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  UseGuards,
  Get,
  Query
} from '@nestjs/common';
import { LocalAuthGuard } from './guards/local.guard';
import { Public } from '@common/decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { Request } from 'express';
import { RegisterDto } from '@modules/auth/dto/register.dto';
import { AuthService } from '@modules/auth/auth.service';
import { RequestPasswordResetDto } from '@modules/auth/dto/request-password-reset.dto';
import { ResetPasswordDto } from '@modules/auth/dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Public()
  @UseGuards(LocalAuthGuard)
  @HttpCode(200)
  async login(@Body() loginDto: LoginDto, @Req() req: Request & { user: any }) {
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
    @Body() body: RequestPasswordResetDto,
    @Req() req: Request
  ) {
    return this.authService.requestPasswordReset(body, req);
  }

  @Post('reset-password')
  @Public()
  async resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body);
  }

  @Get('verify-email')
  @Public()
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }
}
