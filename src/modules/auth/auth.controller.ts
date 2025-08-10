import {
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  UseGuards
} from '@nestjs/common';
import { LocalAuthGuard } from './guards/local.guard';
import { Public } from '@common/decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { Request } from 'express';
import { RegisterDto } from '@modules/auth/dto/register.dto';
import { AuthService } from '@modules/auth/auth.service';

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
}
