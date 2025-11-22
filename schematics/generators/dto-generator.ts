import { ColumnInfo, TableMetadata } from '../utils/schema-inspector';
import { SelectedRelation, EndpointType, PaginationType } from '../endpoint/prompts';
import {
  getValidatorDecorators,
  getValidatorImports,
  mapColumnToTsType
} from '../utils/type-mapper';
import { getClassName, toCamelCase } from '../utils/string-utils';

export class DtoGenerator {
  /**
   * Generate Create DTO
   */
  generateCreateDto(
    tableMetadata: TableMetadata,
    relations: SelectedRelation[]
  ): string {
    const className = getClassName(tableMetadata.tableName);
    const dtoName = `Create${className}Dto`;

    // Get columns to include (exclude auto-generated fields)
    const columns = tableMetadata.columns.filter(
      (col) => !col.isPrimary || !col.hasDefault
    );

    const imports = this.generateImports(columns, relations);
    const properties = this.generateCreateProperties(columns, relations, tableMetadata);

    return `${imports}

export class ${dtoName} {
${properties}
}
`;
  }

  /**
   * Generate Update DTO
   */
  generateUpdateDto(tableMetadata: TableMetadata): string {
    const className = getClassName(tableMetadata.tableName);
    const dtoName = `Update${className}Dto`;

    // Get columns to include (exclude auto-generated and primary key fields)
    const columns = tableMetadata.columns.filter(
      (col) => !col.isPrimary && !col.hasDefault
    );

    const imports = this.generateImports(columns, []);
    const properties = this.generateUpdateProperties(columns);

    return `${imports}

export class ${dtoName} {
${properties}
}
`;
  }

  /**
   * Generate Read (FindOne) DTO
   */
  generateReadDto(tableMetadata: TableMetadata): string {
    const className = getClassName(tableMetadata.tableName);
    const dtoName = `Find${className}Dto`;

    // Get primary key column
    const pkColumn = tableMetadata.columns.find((col) => col.isPrimary);
    
    if (!pkColumn) {
      throw new Error(`No primary key found for ${tableMetadata.tableName}`);
    }

    const tsType = mapColumnToTsType(pkColumn);
    const validators = getValidatorDecorators(pkColumn, false);
    const validatorImports = getValidatorImports([pkColumn]);

    return `import { ${validatorImports.join(', ')} } from 'class-validator';

export class ${dtoName} {
  ${validators.map((v) => `  ${v}`).join('\n')}
  ${pkColumn.name}: ${tsType};
}
`;
  }

  /**
   * Generate ReadMany (Paginated) DTO
   */
  generateReadManyDto(
    tableMetadata: TableMetadata,
    paginationType: PaginationType = 'both'
  ): string {
    const className = getClassName(tableMetadata.tableName);
    const dtoName = `Find${className}sDto`;
    const schemaImport = toCamelCase(tableMetadata.tableName);

    // Get primary key for cursor pagination
    const pkColumn = tableMetadata.columns.find((col) => col.isPrimary);
    
    if (!pkColumn) {
      throw new Error(`No primary key found for ${tableMetadata.tableName}`);
    }

    const properties = this.generatePaginationProperties(tableMetadata);
    const paginationConfig = this.generatePaginationConfig(
      tableMetadata,
      paginationType,
      pkColumn
    );

    return `import { ${schemaImport} } from '@schema/${tableMetadata.tableName}';
import {
  BasePaginatedDto,
  Filter,
  Like,
  Pagination,
  Prop,
  Sortable
} from '@common/pagination';

${paginationConfig}
export class ${dtoName} extends BasePaginatedDto {
${properties}
}
`;
  }

  /**
   * Generate imports for validators and related DTOs
   */
  private generateImports(columns: ColumnInfo[], relations: SelectedRelation[]): string {
    const validatorImports = getValidatorImports(columns);
    const imports: string[] = [];

    // Add class-validator imports
    if (validatorImports.length > 0) {
      imports.push(`import { ${validatorImports.join(', ')} } from 'class-validator';`);
    }

    // Add swagger imports
    imports.push(`import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';`);

    // Add Type import for nested objects
    if (relations.length > 0) {
      imports.push(`import { Type } from 'class-transformer';`);
    }

    // TODO: Add imports for nested relation DTOs if needed

    return imports.join('\n');
  }

  /**
   * Generate properties for Create DTO
   */
  private generateCreateProperties(
    columns: ColumnInfo[],
    relations: SelectedRelation[],
    tableMetadata: TableMetadata
  ): string {
    const properties: string[] = [];

    // Add column properties
    for (const column of columns) {
      if (column.isPrimary && column.hasDefault) continue;
      
      const tsType = mapColumnToTsType(column);
      const isOptional = !column.notNull || column.hasDefault;
      const validators = getValidatorDecorators(column, isOptional);
      const apiDecorator = isOptional ? '@ApiPropertyOptional()' : '@ApiProperty()';

      properties.push(`  ${apiDecorator}`);
      validators.forEach((v) => properties.push(`  ${v}`));
      properties.push(`  ${column.name}${isOptional ? '?' : ''}: ${tsType};`);
      properties.push('');
    }

    // Add relation properties
    for (const relation of relations) {
      const relationType = this.getRelationDtoType(relation);
      const isOptional = relation.type === 'one' ? true : false;
      const apiDecorator = isOptional ? '@ApiPropertyOptional()' : '@ApiProperty()';

      properties.push(`  ${apiDecorator}({ type: () => ${relationType}, isArray: ${relation.type === 'many'} })`);
      
      if (isOptional) {
        properties.push(`  @IsOptional()`);
      }

      // For junction tables, simplify to array of IDs
      if (relation.skipJunctionTable) {
        properties.push(`  ${relation.fieldName}${isOptional ? '?' : ''}: number[];`);
      } else {
        const arrayModifier = relation.type === 'many' ? '[]' : '';
        properties.push(`  ${relation.fieldName}${isOptional ? '?' : ''}: ${relationType}${arrayModifier};`);
      }
      properties.push('');
    }

    return properties.join('\n');
  }

  /**
   * Generate properties for Update DTO
   */
  private generateUpdateProperties(columns: ColumnInfo[]): string {
    const properties: string[] = [];

    for (const column of columns) {
      const tsType = mapColumnToTsType(column);
      const validators = getValidatorDecorators(column, true);

      properties.push(`  @ApiPropertyOptional()`);
      validators.forEach((v) => properties.push(`  ${v}`));
      properties.push(`  ${column.name}?: ${tsType};`);
      properties.push('');
    }

    return properties.join('\n');
  }

  /**
   * Generate properties for Pagination DTO
   */
  private generatePaginationProperties(tableMetadata: TableMetadata): string {
    const properties: string[] = [];
    const schemaImport = toCamelCase(tableMetadata.tableName);

    for (const column of tableMetadata.columns) {
      const tsType = mapColumnToTsType(column);
      const filters = this.getFilterOperators(column);
      const sortable = '@Sortable()';

      properties.push(`  @Prop(${schemaImport}.${column.name})`);
      if (filters) {
        properties.push(`  ${filters}`);
      }
      properties.push(`  ${sortable}`);
      properties.push(`  ${column.name}?: ${tsType};`);
      properties.push('');
    }

    return properties.join('\n');
  }

  /**
   * Generate @Pagination decorator configuration
   */
  private generatePaginationConfig(
    tableMetadata: TableMetadata,
    paginationType: PaginationType,
    pkColumn: ColumnInfo
  ): string {
    const schemaImport = toCamelCase(tableMetadata.tableName);
    
    return `@Pagination({
  paginationType: '${paginationType}',
  limit: 10,
  defaultSort: [
    { field: ${schemaImport}.${pkColumn.name}, order: 'ASC' }
  ],
  allowCustomSort: true,
  allowCustomLimit: true,
  allowMultipleSort: false,
  maxLimit: 100,
  cursorIdField: ${schemaImport}.${pkColumn.name}
})`;
  }

  /**
   * Get filter operators for a column
   */
  private getFilterOperators(column: ColumnInfo): string | null {
    const type = column.type.toLowerCase();

    if (type.includes('text') || type.includes('varchar') || type.includes('char')) {
      return "@Filter('eq', 'like')";
    }

    if (type.includes('int') || type.includes('numeric') || type.includes('decimal')) {
      return "@Filter('eq', 'gt', 'lt', 'gte', 'lte')";
    }

    if (type.includes('bool')) {
      return "@Filter('eq')";
    }

    if (type.includes('timestamp') || type.includes('date')) {
      return "@Filter('eq', 'gt', 'lt')";
    }

    return "@Filter('eq')";
  }

  /**
   * Get relation DTO type
   */
  private getRelationDtoType(relation: SelectedRelation): string {
    if (relation.skipJunctionTable) {
      return 'Number';
    }
    
    const className = getClassName(relation.referencedTableName);
    return `Create${className}Dto`;
  }
}

