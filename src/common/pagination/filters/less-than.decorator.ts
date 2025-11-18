import 'reflect-metadata';
import { FILTERS_METADATA } from '../constants';
import { OperatorOptions, FilterMetadata } from '../interfaces';

/**
 * @LessThan decorator - marks a property as filterable with less than operator
 * @param options - Optional configuration for alias and default value
 */
export function LessThan(options: OperatorOptions = {}): PropertyDecorator {
  return (target: Object, propertyKey: string | symbol) => {
    const existing: FilterMetadata[] =
      Reflect.getMetadata(FILTERS_METADATA, target, propertyKey) || [];

    const filterMetadata: FilterMetadata = {
      operator: 'lt',
      alias: options.alias ?? `${String(propertyKey)}Lt`,
      default: options.default
    };

    existing.push(filterMetadata);

    Reflect.defineMetadata(FILTERS_METADATA, existing, target, propertyKey);
  };
}

