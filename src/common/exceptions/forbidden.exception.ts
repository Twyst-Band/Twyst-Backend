import { HttpException } from '@nestjs/common';

export function throwForbiddenException(message?: string): never {
  throw new HttpException(
    {
      error: 'Forbidden',
      statusCode: 403,
      message
    },
    403
  );
}
