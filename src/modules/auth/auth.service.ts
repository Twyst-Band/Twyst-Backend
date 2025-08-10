import {
  Injectable,
  InternalServerErrorException
} from '@nestjs/common';
import { CommonService } from '@common/services/common.service';
import { JwtService } from '@nestjs/jwt';
import { eq } from 'drizzle-orm';
import { BcryptUtils } from '@common/utils/bcrypt.utils';
import { firstRow } from '@common/utils/drizzle.utils';
import { users } from '@schema/users';
import { throwUnauthorizedException } from '@common/exceptions/unauthorized.exception';
import { RegisterDto } from '@modules/auth/dto/register.dto';
import { throwConflictException } from '@common/exceptions/conflict.exception';

@Injectable()
export class AuthService extends CommonService {
  constructor(private readonly jwtService: JwtService) {
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
          password: users.password,
          role: users.role
        })
        .from(users)
        .where(eq(users.email, email))
        .limit(1)
    );

    if (
      user &&
      (await BcryptUtils.comparePasswords(password, user.password!))
    ) {
      return {
        token: this.jwtService.sign({
          userID: user.id,
          role: user.role
        })
      };
    }

    throwUnauthorizedException('Incorrect email or password');
  }
  async register(registerDto: RegisterDto) {
    try {
      await this.db.insert(users).values({
        email: registerDto.email,
        password: await BcryptUtils.hashPassword(registerDto.password),
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        userName: registerDto.username,
        role: 'user'
      });
    } catch (e) {
      if (e.code === '23505') {
        throwConflictException('Email already in use');
      }
      throw new InternalServerErrorException();
    }
  }
}
