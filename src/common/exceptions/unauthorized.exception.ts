import { HttpException } from '@nestjs/common';

export function throwUnauthorizedException(message?: string): never {
  throw new HttpException(
    {
      error: 'Unauthorized',
      statusCode: 401,
      message
    },
    401
  );
}
