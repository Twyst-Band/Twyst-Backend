import 'reflect-metadata';
import { PROP_METADATA, DECORATED_PROPERTIES_METADATA } from './constants';
import { PropMetadata } from './interfaces';

/**
 * @param column - Drizzle column or SQL expression (e.g., users.createdAt, lower(users.firstName))
 */
export function Prop(column: any): PropertyDecorator {
  return (target: Object, propertyKey: string | symbol) => {
    const metadata: PropMetadata = {
      column
    };

    Reflect.defineMetadata(PROP_METADATA, metadata, target, propertyKey);

    // Track this property as decorated on the class
    const decoratedProps: Set<string> =
      Reflect.getMetadata(DECORATED_PROPERTIES_METADATA, target) || new Set();
    decoratedProps.add(String(propertyKey));
    Reflect.defineMetadata(DECORATED_PROPERTIES_METADATA, decoratedProps, target);
  };
}

