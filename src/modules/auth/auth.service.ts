import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CommonService } from '@common/services/common.service';
import { JwtService } from '@nestjs/jwt';
import { and, eq, gte } from 'drizzle-orm';
import { EncryptionUtils } from '@common/utils/encryption.utils';
import { firstRow, now } from '@common/utils/drizzle.utils';
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
    const user = await this.query.users.findFirst({
      where: eq(users.email, email),
      columns: {
        id: true,
        password: true
      }
    });

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
        userName: registerDto.username,
        emailVerified: !envConfig.VERIFY_EMAILS
      });

      if (envConfig.VERIFY_EMAILS) {
        await this.requestEmailVerification({ email: registerDto.email });
      }
    } catch (e) {
      if (e.code === '23505') {
        const match = e.detail.match(/\((.*?)\)=/);

        throwConflictException(`${match} already in use`);
      }

      throw new InternalServerErrorException();
    }
  }

  async requestPasswordReset(
    requestPasswordResetDto: RequestPasswordResetDto,
    req?: Request
  ) {
    const user = await this.query.users.findFirst({
      where: eq(users.email, requestPasswordResetDto.email),
      columns: { id: true, email: true, userName: true }
    });

    if (!user) {
      throwNotFound('User with this email not found');
    }

    await this.db
      .delete(passwordResetTokens)
      .where(eq(passwordResetTokens.userID, user.id));

    const token = await firstRow(
      this.db
        .insert(passwordResetTokens)
        .values({ userID: user.id })
        .returning({ token: passwordResetTokens.token })
    );

    const resetUrl = `${envConfig.FRONTEND_URL}/reset-password?token=${token!.token}`;

    await this.mailingService.sendEmail(
      user.email,
      'Reset your password',
      'reset-password',
      {
        userName: user.userName,
        email: user.email,
        resetUrl,
        expirationTime: 15,
        currentYear: new Date().getFullYear(),
        requestTime: new Date().toISOString(),
        ipAddress: req?.ip,
        userAgent: req?.headers['user-agent']
      }
    );
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const token = await this.query.passwordResetTokens.findFirst({
      where: and(
        eq(passwordResetTokens.token, resetPasswordDto.token),
        gte(passwordResetTokens.expiresAt, now())
      ),
      columns: { userID: true, expiresAt: true }
    });

    if (!token) {
      throwNotFound('Invalid or expired token');
    }

    await this.db
      .update(users)
      .set({
        password: await EncryptionUtils.hashPassword(
          resetPasswordDto.newPassword
        )
      })
      .where(eq(users.id, token.userID));

    await this.db
      .delete(passwordResetTokens)
      .where(eq(passwordResetTokens.userID, token.userID));
  }

  async requestEmailVerification(
    body: RequestEmailVerificationDto,
    req?: Request
  ) {
    const user = await this.query.users.findFirst({
      where: eq(users.email, body.email),
      columns: { id: true, email: true, userName: true }
    });

    if (!user) {
      throwNotFound('User with this email not found');
    }

    const token = await firstRow(
      this.db
        .insert(emailVerificationTokens)
        .values({ userID: user.id })
        .returning({ token: emailVerificationTokens.token })
    );

    const verificationUrl = `${envConfig.FRONTEND_URL}/verify-email?token=${token}`;

    await this.mailingService.sendEmail(
      user.email,
      'Verify your email',
      'verify-email',
      {
        userName: user.userName,
        email: user.email,
        verificationUrl,
        expirationTime: 60 * 24,
        currentYear: new Date().getFullYear(),
        requestTime: new Date().toISOString(),
        ipAddress: req?.ip,
        userAgent: req?.headers['user-agent']
      }
    );
  }
}
