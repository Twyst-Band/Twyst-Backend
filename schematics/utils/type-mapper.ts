import { ColumnInfo } from './schema-inspector';

/**
 * Map Drizzle column type to TypeScript type
 */
export function mapColumnToTsType(column: ColumnInfo): string {
  const type = column.type.toLowerCase();
  
  if (type.includes('int') || type.includes('serial') || type.includes('numeric') || type.includes('decimal')) {
    return 'number';
  }
  
  if (type.includes('text') || type.includes('varchar') || type.includes('char') || type.includes('uuid')) {
    return 'string';
  }
  
  if (type.includes('bool')) {
    return 'boolean';
  }
  
  if (type.includes('timestamp') || type.includes('date') || type.includes('time')) {
    return 'Date';
  }
  
  if (type.includes('json')) {
    return 'any';
  }
  
  return 'any';
}

/**
 * Get class-validator decorator for a column
 */
export function getValidatorDecorators(column: ColumnInfo, isOptional: boolean = false): string[] {
  const decorators: string[] = [];
  const type = column.type.toLowerCase();
  
  if (isOptional || !column.notNull || column.hasDefault) {
    decorators.push('@IsOptional()');
  }
  
  if (type.includes('int') || type.includes('serial') || type.includes('numeric') || type.includes('decimal')) {
    decorators.push('@IsNumber()');
  } else if (type.includes('text') || type.includes('varchar') || type.includes('char')) {
    decorators.push('@IsString()');
    decorators.push('@MaxLength(1000)');
  } else if (type.includes('uuid')) {
    decorators.push('@IsUUID()');
  } else if (type.includes('bool')) {
    decorators.push('@IsBoolean()');
  } else if (type.includes('timestamp') || type.includes('date')) {
    decorators.push('@IsDate()');
  }
  
  if (column.isUnique && !isOptional) {
    // Add unique constraint comment
  }
  
  return decorators;
}

/**
 * Get imports needed for validators
 */
export function getValidatorImports(columns: ColumnInfo[]): string[] {
  const imports = new Set<string>(['IsOptional']);
  
  for (const column of columns) {
    const type = column.type.toLowerCase();
    
    if (type.includes('int') || type.includes('serial') || type.includes('numeric')) {
      imports.add('IsNumber');
    } else if (type.includes('text') || type.includes('varchar') || type.includes('char')) {
      imports.add('IsString');
      imports.add('MaxLength');
    } else if (type.includes('uuid')) {
      imports.add('IsUUID');
    } else if (type.includes('bool')) {
      imports.add('IsBoolean');
    } else if (type.includes('timestamp') || type.includes('date')) {
      imports.add('IsDate');
    }
  }
  
  return Array.from(imports);
}

