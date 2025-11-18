import 'reflect-metadata';
import { FILTERS_METADATA } from '../constants';
import { OperatorOptions, FilterMetadata } from '../interfaces';

/**
 * @Equal decorator - marks a property as filterable with equality operator
 * @param options - Optional configuration for alias and default value
 */
export function Equal(options: OperatorOptions = {}): PropertyDecorator {
  return (target: Object, propertyKey: string | symbol) => {
    const existing: FilterMetadata[] =
      Reflect.getMetadata(FILTERS_METADATA, target, propertyKey) || [];

    const filterMetadata: FilterMetadata = {
      operator: 'eq',
      alias: options.alias ?? String(propertyKey),
      default: options.default
    };

    existing.push(filterMetadata);

    Reflect.defineMetadata(FILTERS_METADATA, existing, target, propertyKey);
  };
}

