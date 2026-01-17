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
import { RequestEmailChangeDto } from '@modules/auth/dto/request-email-change.dto';
import { ChangeEmailDto } from '@modules/auth/dto/change-email.dto';

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

  async register(registerDto: RegisterDto, req?: Request) {
    try {
      const user = await firstRow(
        this.db
          .insert(users)
          .values({
            email: registerDto.email,
            password: await EncryptionUtils.hashPassword(registerDto.password),
            firstName: registerDto.firstName,
            lastName: registerDto.lastName,
            userName: registerDto.userName,
            emailVerified: !envConfig.VERIFY_EMAILS
          })
          .returning({
            id: users.id
          })
      );

      if (!envConfig.VERIFY_EMAILS) {
        return;
      }

      const token = await firstRow(
        this.db
          .insert(emailVerificationTokens)
          .values({
            email: registerDto.email,
            userID: user!.id
          })
          .returning({ token: emailVerificationTokens.token })
      );

      const verificationUrl = `${envConfig.FRONTEND_URL}/verify-email?token=${token}`;

      await this.mailingService.sendEmail(
        registerDto.email,
        'Verify your email',
        'verify-email',
        {
          userName: registerDto.userName,
          email: registerDto.email,
          verificationUrl,
          expirationTime: 60 * 24,
          currentYear: new Date().getFullYear(),
          requestTime: new Date().toISOString(),
          ipAddress: req?.ip,
          userAgent: req?.headers['user-agent']
        }
      );
    } catch (e) {
      console.log(e)
      if (e.cause.code === '23505') {
        const match = e.cause.detail.match(/\((.*?)\)=/)[1];

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

  async requestEmailVerification(userID: number, req?: Request) {
    const user = await this.query.users.findFirst({
      where: eq(users.id, userID)
    });

    if (!user) {
      throwNotFound('User not found');
    }

    const token = await firstRow(
      this.db
        .insert(emailVerificationTokens)
        .values({
          email: user.email,
          userID: user.id
        })
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

  async requestEmailChange(
    requestEmailChangeDto: RequestEmailChangeDto,
    req?: Request
  ) {
    if (envConfig.VERIFY_EMAILS) {
      const token = await firstRow(
        this.db
          .insert(emailVerificationTokens)
          .values({
            email: requestEmailChangeDto.email,
            userID: this.userID
          })
          .returning({ token: emailVerificationTokens.token })
      );

      const verificationUrl = `${envConfig.FRONTEND_URL}/verify-email?token=${token}`;

      const user = await this.query.users.findFirst({
        where: eq(users.id, this.userID)
      });

      await this.mailingService.sendEmail(
        requestEmailChangeDto.email,
        'Verify your email',
        'verify-email',
        {
          userName: user!.userName,
          email: requestEmailChangeDto.email,
          verificationUrl,
          expirationTime: 60 * 24,
          currentYear: new Date().getFullYear(),
          requestTime: new Date().toISOString(),
          ipAddress: req?.ip,
          userAgent: req?.headers['user-agent']
        }
      );
    } else {
      await this.db
        .update(users)
        .set({ email: requestEmailChangeDto.email })
        .where(eq(users.id, this.userID));
    }
  }

  async changeEmail(changeEmailDto: ChangeEmailDto) {
    const token = await this.query.emailVerificationTokens.findFirst({
      where: and(
        eq(emailVerificationTokens.token, changeEmailDto.token),
        gte(emailVerificationTokens.expiresAt, now())
      ),
      columns: { userID: true, email: true }
    });

    if (!token) {
      throwNotFound('Invalid or expired token');
    }

    await this.db
      .update(users)
      .set({ emailVerified: true, email: token.email })
      .where(eq(users.id, token.userID));
  }
}
