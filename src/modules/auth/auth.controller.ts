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
import { ApiBadRequestResponse, ApiBody, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { LocalAuthGuard } from './guards/local.guard';
import { Public } from '@common/decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { Request } from 'express';
import { RegisterDto } from '@modules/auth/dto/register.dto';
import { AuthService } from '@modules/auth/auth.service';
import { RequestPasswordResetDto } from '@modules/auth/dto/request-password-reset.dto';
import { ResetPasswordDto } from '@modules/auth/dto/reset-password.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Public()
  @UseGuards(LocalAuthGuard)
  @HttpCode(200)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({
    schema: {
      example: { email: 'user@example.com', password: 'StrongP@ssw0rd!' }
    }
  })
  @ApiOkResponse({
    description: 'Returns a JWT token on successful authentication',
    schema: { example: { token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' } }
  })
  @ApiBadRequestResponse({ description: 'Invalid credentials or payload' })
  async login(@Body() loginDto: LoginDto, @Req() req: Request & { user: any }) {
    return req.user;
  }

  @Post('register')
  @Public()
  @ApiOperation({ summary: 'Register a new account' })
  @ApiBody({
    schema: {
      example: {
        email: 'user@example.com',
        username: 'john_doe',
        firstName: 'John',
        lastName: 'Doe',
        password: 'StrongP@ssw0rd!'
      }
    }
  })
  @ApiCreatedResponse({ description: 'Account created. If email verification is enabled, an email will be sent.' })
  @ApiBadRequestResponse({ description: 'Validation error' })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('request-password-reset')
  @Public()
  @ApiOperation({ summary: 'Request a password reset email' })
  @ApiBody({ schema: { example: { email: 'user@example.com' } } })
  @ApiOkResponse({ description: 'Always returns ok even if email is not found to prevent enumeration', schema: { example: { ok: true } } })
  async requestPasswordReset(
    @Body() body: RequestPasswordResetDto,
    @Req() req: Request
  ) {
    return this.authService.requestPasswordReset(body, req);
  }

  @Post('reset-password')
  @Public()
  @ApiOperation({ summary: 'Reset password using a valid reset token' })
  @ApiBody({ schema: { example: { token: 'uuid-token', newPassword: 'StrongP@ssw0rd!' } } })
  @ApiOkResponse({ description: 'Password updated', schema: { example: { ok: true } } })
  @ApiBadRequestResponse({ description: 'Token invalid/expired or validation error' })
  async resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body);
  }

  @Get('verify-email')
  @Public()
  @ApiOperation({ summary: 'Verify email using token sent to email' })
  @ApiQuery({ name: 'token', example: 'uuid-token' })
  @ApiOkResponse({ description: 'Email verified', schema: { example: { ok: true } } })
  @ApiBadRequestResponse({ description: 'Token invalid/expired' })
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }
}
