import { AuthGuard } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  handleRequest(err: any, user: any, _info: any) {
    if (err && user !== false) {
      throw err;
    }

    return user;
  }
}
