import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CommonService } from '@common/services/common.service';
import { JwtService } from '@nestjs/jwt';
import { eq } from 'drizzle-orm';
import { EncryptionUtils } from '@common/utils/encryption.utils';
import { firstRow } from '@common/utils/drizzle.utils';
import { users } from '@schema/users';
import { throwUnauthorizedException } from '@common/exceptions/unauthorized.exception';
import { RegisterDto } from '@modules/auth/dto/register.dto';
import { throwConflictException } from '@common/exceptions/conflict.exception';
import { MailingService } from 'src/mailing/mailing.service';
import { Request } from 'express';
import { RequestPasswordResetDto } from '@modules/auth/dto/request-password-reset.dto';
import { passwordResetTokens } from '@schema/password-reset-tokens';
import { throwNotFound } from '@common/exceptions/not-found.exception';
import { ResetPasswordDto } from '@modules/auth/dto/reset-password.dto';
import { throwBadRequestException } from '@common/exceptions/bad-request.exception';
import envConfig from '../../../env.config';
import { emailVerificationTokens } from '@schema/email-verification-tokens';
import { RequestEmailVerificationDto } from '@modules/auth/dto/request-email-verification.dto';

@Injectable()
export class AuthService extends CommonService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly mailingService: MailingService
  ) {
    super();
  }

  async validateUser(
    email: string,
    password: string
  ): Promise<{
    token: string;
  }> {
    const user = await firstRow(
      this.db
        .select({
          id: users.id,
          password: users.password
        })
        .from(users)
        .where(eq(users.email, email))
        .limit(1)
    );

    if (
      user &&
      (await EncryptionUtils.comparePasswords(password, user.password!))
    ) {
      return {
        token: this.jwtService.sign({
          userID: user.id
        })
      };
    }

    throwUnauthorizedException('Incorrect email or password');
  }

  async register(registerDto: RegisterDto) {
    try {
      await this.db.insert(users).values({
        email: registerDto.email,
        password: await EncryptionUtils.hashPassword(registerDto.password),
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        userName: registerDto.username
      });
      if (envConfig.VERIFY_EMAILS) {
        await this.requestEmailVerification({ email: registerDto.email });
      }
    } catch (e) {
      if (e.code === '23505') {
        throwConflictException('Email already in use');
      }
      throw new InternalServerErrorException();
    }
  }

  async requestPasswordReset(body: RequestPasswordResetDto, req?: Request) {
    const user = await firstRow(
      this.db
        .select({
          id: users.id,
          email: users.email,
          firstName: users.firstName
        })
        .from(users)
        .where(eq(users.email, body.email))
        .limit(1)
    );

    if (!user) {
      // Silently succeed to avoid user enumeration
      return { ok: true };
    }

    const [tokenRow] = await this.db
      .insert(passwordResetTokens)
      .values({ userID: user.id })
      .returning({ token: passwordResetTokens.token });

    const resetUrl = `${envConfig.FRONTEND_URL}/reset-password?token=${tokenRow.token}`;

    await this.mailingService.sendEmail(
      user.email,
      'Reset your Twyst password',
      'reset-password',
      {
        firstName: user.firstName,
        email: user.email,
        resetUrl,
        expirationTime: 15,
        currentYear: new Date().getFullYear(),
        requestTime: new Date().toISOString(),
        ipAddress: req?.ip,
        userAgent: req?.headers['user-agent']
      }
    );

    return { ok: true };
  }

  async resetPassword(body: ResetPasswordDto) {
    const tokenRow = await firstRow(
      this.db
        .select({
          token: passwordResetTokens.token,
          userID: passwordResetTokens.userID,
          expiresAt: passwordResetTokens.expiresAt
        })
        .from(passwordResetTokens)
        .where(eq(passwordResetTokens.token, body.token))
        .limit(1)
    );

    if (!tokenRow) {
      throwNotFound('Invalid or expired token');
    }

    const now = new Date();
    if (tokenRow.expiresAt && now > tokenRow.expiresAt) {
      // delete expired token
      await this.db
        .delete(passwordResetTokens)
        .where(eq(passwordResetTokens.token, body.token));
      throwBadRequestException('Token expired');
    }

    await this.db
      .update(users)
      .set({ password: await EncryptionUtils.hashPassword(body.newPassword) })
      .where(eq(users.id, tokenRow.userID));

    // invalidate all tokens for user
    await this.db
      .delete(passwordResetTokens)
      .where(eq(passwordResetTokens.userID, tokenRow.userID));

    return { ok: true };
  }

  async requestEmailVerification(
    body: RequestEmailVerificationDto,
    req?: Request
  ) {
    const user = await firstRow(
      this.db
        .select({
          id: users.id,
          email: users.email,
          firstName: users.firstName
        })
        .from(users)
        .where(eq(users.email, body.email))
        .limit(1)
    );
    if (!user) return { ok: true };

    const [tokenRow] = await this.db
      .insert(emailVerificationTokens)
      .values({ userID: user.id })
      .returning({ token: emailVerificationTokens.token });

    const verificationUrl = `${envConfig.FRONTEND_URL}/verify-email?token=${tokenRow.token}`;

    await this.mailingService.sendEmail(
      user.email,
      'Verify your Twyst email',
      'verify-email',
      {
        firstName: user.firstName,
        email: user.email,
        verificationUrl,
        expirationTime: 60 * 24,
        currentYear: new Date().getFullYear(),
        requestTime: new Date().toISOString(),
        ipAddress: req?.ip,
        userAgent: req?.headers['user-agent']
      }
    );

    return { ok: true };
  }
}
