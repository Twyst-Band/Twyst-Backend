import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import envConfig from '../../../../env.config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly cls: ClsService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: envConfig.JWT_SECRET
    });
  }

  async validate(payload: any) {
    this.cls.set('userID', payload.userID);

    return true;
  }
}
