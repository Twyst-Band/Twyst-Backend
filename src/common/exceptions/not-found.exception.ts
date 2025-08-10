import { NotFoundException } from '@nestjs/common';

export function throwNotFound(message?: string): never {
  throw new NotFoundException({
    error: 'Not Found',
    status: 404,
    message
  });
}
