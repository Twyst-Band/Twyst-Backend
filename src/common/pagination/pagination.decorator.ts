import 'reflect-metadata';
import { PAGINATION_METADATA } from './constants';
import { PaginationOptions } from './interfaces';

/**
 * @Pagination class decorator - defines default pagination and sorting behavior for a DTO
 * @param options - Pagination configuration options
 */
export function Pagination(options: PaginationOptions = {}): ClassDecorator {
  return (target: Function) => {
    // Validate options
    if (options.limit && options.maxLimit && options.limit > options.maxLimit) {
      throw new Error(
        `@Pagination: limit (${options.limit}) cannot be greater than maxLimit (${options.maxLimit})`
      );
    }

    if (options.maxLimit && options.maxLimit <= 0) {
      throw new Error(
        `@Pagination: maxLimit must be greater than 0, got ${options.maxLimit}`
      );
    }

    if (options.limit && options.limit <= 0) {
      throw new Error(
        `@Pagination: limit must be greater than 0, got ${options.limit}`
      );
    }

    // Validate defaultSort is an array if provided
    if (options.defaultSort && !Array.isArray(options.defaultSort)) {
      throw new Error(
        `@Pagination: defaultSort must be an array of { field, order }, got ${typeof options.defaultSort}`
      );
    }

    // Set defaults
    const finalOptions: PaginationOptions = {
      limit: options.limit ?? 10,
      defaultSort: options.defaultSort ?? [],
      allowCustomSort: options.allowCustomSort ?? true,
      allowCustomLimit: options.allowCustomLimit ?? true,
      allowMultipleSort: options.allowMultipleSort ?? true,
      maxLimit: options.maxLimit ?? 100
    };

    Reflect.defineMetadata(PAGINATION_METADATA, finalOptions, target.prototype);
  };
}

