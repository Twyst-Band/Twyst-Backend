import { throwNotFound } from '@common/exceptions/not-found.exception';

export async function firstRowOrThrow<T>(promise: Promise<T[]>): Promise<T> {
  const row = (await promise)[0];

  if (row === undefined) {
    throwNotFound('Entity not found');
  }

  return row;
}

export async function affectedRowOrThrow(promise: Promise<any>): Promise<void> {
  if ((await promise).rowCount === 0) {
    throwNotFound('Entity not found');
  }
}
