import { ConflictException } from '@nestjs/common';

export function throwConflictException(message?: any): never {
  throw new ConflictException({
    error: 'Conflict',
    status: 409,
    message
  });
}
