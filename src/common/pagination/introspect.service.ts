import 'reflect-metadata';
import {
  DECORATED_PROPERTIES_METADATA,
  FILTERS_METADATA,
  PAGINATION_METADATA,
  PROP_METADATA,
  SORTABLE_METADATA
} from './constants';
import {
  FilterMetadata,
  PaginationOptions,
  PropMetadata,
  SortableMetadata
} from './interfaces';

export interface PropertyMetadataInfo {
  propertyKey: string;
  column: any;
  sortable: boolean;
  sortableAlias?: string;
  filters: Array<{
    operator: string;
    alias: string;
    default?: any;
  }>;
}

export interface DtoMetadataInfo {
  paginationOptions: PaginationOptions;
  properties: PropertyMetadataInfo[];
  availableFilters: string[]; // All filter aliases
  sortableFields: string[]; // All sortable aliases (not property names)
}

export class IntrospectionService {
  /**
   * Get all metadata from a paginated DTO class
   * @param dtoClass - The DTO class to introspect
   * @returns Complete metadata information
   */
  introspect(dtoClass: any): DtoMetadataInfo {
    const instance = new dtoClass();
    const prototype = Object.getPrototypeOf(instance);

    // Get pagination options
    const paginationOptions: PaginationOptions =
      Reflect.getMetadata(PAGINATION_METADATA, prototype) || {};

    // Get decorated properties
    const decoratedProps: Set<string> =
      Reflect.getMetadata(DECORATED_PROPERTIES_METADATA, prototype) ||
      new Set();

    const properties: PropertyMetadataInfo[] = [];
    const availableFilters: string[] = [];
    const sortableFields: string[] = [];

    for (const propertyKey of decoratedProps) {
      // Get property metadata
      const propMetadata: PropMetadata | undefined = Reflect.getMetadata(
        PROP_METADATA,
        prototype,
        propertyKey
      );

      if (!propMetadata) continue;

      // Get filter metadata
      const filterMetadataArray: FilterMetadata[] =
        Reflect.getMetadata(FILTERS_METADATA, prototype, propertyKey) || [];

      // Get sortable metadata
      const sortableMetadata: SortableMetadata | undefined =
        Reflect.getMetadata(SORTABLE_METADATA, prototype, propertyKey);

      const isSortable = sortableMetadata?.enabled || false;
      const sortableAlias = sortableMetadata?.alias;

      const filters = filterMetadataArray.map((f) => {
        availableFilters.push(f.alias);
        return {
          operator: f.operator,
          alias: f.alias,
          default: f.default
        };
      });

      if (isSortable && sortableAlias) {
        sortableFields.push(sortableAlias);
      }

      properties.push({
        propertyKey,
        column: propMetadata.column,
        sortable: isSortable,
        sortableAlias,
        filters
      });
    }

    return {
      paginationOptions,
      properties,
      availableFilters,
      sortableFields
    };
  }

  /**
   * Print a human-readable summary of DTO metadata
   * @param dtoClass - The DTO class to introspect
   */
  printSummary(dtoClass: any): void {
    const metadata = this.introspect(dtoClass);

    console.log('\n=== DTO Metadata Summary ===\n');

    // Pagination options
    console.log('📄 Pagination Options:');
    console.log(`  Default Limit: ${metadata.paginationOptions.limit || 10}`);
    console.log(`  Max Limit: ${metadata.paginationOptions.maxLimit || 100}`);
    console.log(
      `  Allow Custom Sort: ${metadata.paginationOptions.allowCustomSort ?? true}`
    );
    console.log(
      `  Allow Custom Limit: ${metadata.paginationOptions.allowCustomLimit ?? true}`
    );
    console.log(
      `  Allow Multiple Sort: ${metadata.paginationOptions.allowMultipleSort ?? true}`
    );
    
    if (metadata.paginationOptions.defaultSort && metadata.paginationOptions.defaultSort.length > 0) {
      console.log('  Default Sort:');
      for (const sort of metadata.paginationOptions.defaultSort) {
        console.log(`    - ${sort.order}`);
      }
    }

    // Properties
    console.log('\n🔍 Filterable/Sortable Properties:');
    for (const prop of metadata.properties) {
      console.log(`\n  ${prop.propertyKey}:`);
      if (prop.sortable && prop.sortableAlias) {
        const aliasNote = prop.sortableAlias !== prop.propertyKey 
          ? ` (alias: ${prop.sortableAlias})`
          : '';
        console.log(`    Sortable: ✓${aliasNote}`);
      } else {
        console.log(`    Sortable: ✗`);
      }
      if (prop.filters.length > 0) {
        console.log('    Filters:');
        for (const filter of prop.filters) {
          const defaultStr = filter.default
            ? ` (default: ${filter.default})`
            : '';
          console.log(
            `      - ${filter.operator} → ?${filter.alias}=${defaultStr}`
          );
        }
      }
    }

    // Summary
    console.log('\n📊 Quick Reference:');
    console.log(`  Available filter params: ${metadata.availableFilters.join(', ')}`);
    console.log(`  Sortable fields: ${metadata.sortableFields.join(', ')}`);

    // Example queries
    console.log('\n🔗 Example Queries:');
    
    // Basic pagination
    console.log('\n  Pagination:');
    console.log('    Offset-based: ?page=1&limit=20');
    console.log('    Cursor-based: ?cursor=xyz&limit=20');
    
    // Sorting examples
    if (metadata.sortableFields.length > 0) {
      console.log('\n  Sorting:');
      const firstSortable = metadata.sortableFields[0];
      console.log(`    Single field: ?sortBy=${firstSortable}&sortOrder=ASC`);
      console.log(`    Default order: ?sortBy=${firstSortable} (defaults to ASC)`);
      
      if (metadata.paginationOptions.allowMultipleSort && metadata.sortableFields.length > 1) {
        const secondSortable = metadata.sortableFields[1];
        console.log(`    Multiple fields: ?sortBy=${firstSortable},${secondSortable}&sortOrder=ASC,DESC`);
      }
    }
    
    // Filter examples
    if (metadata.properties.length > 0) {
      console.log('\n  Filtering:');
      
      // Show one example per property with filters
      let examplesShown = 0;
      for (const prop of metadata.properties) {
        if (prop.filters.length > 0 && examplesShown < 3) {
          const filter = prop.filters[0];
          const exampleValue = this.getExampleValue(filter.operator);
          console.log(`    ${prop.propertyKey} (${filter.operator}): ?${filter.alias}=${exampleValue}`);
          examplesShown++;
        }
      }
    }
    
    // Combined example
    console.log('\n  Combined (All features):');
    const filterExamples: string[] = [];
    const sortExamples: string[] = [];
    
    // Add up to 2 filter examples
    let filterCount = 0;
    for (const prop of metadata.properties) {
      if (prop.filters.length > 0 && filterCount < 2) {
        const filter = prop.filters[0];
        const exampleValue = this.getExampleValue(filter.operator);
        filterExamples.push(`${filter.alias}=${exampleValue}`);
        filterCount++;
      }
    }
    
    // Add sort example
    if (metadata.sortableFields.length > 0) {
      if (metadata.paginationOptions.allowMultipleSort && metadata.sortableFields.length > 1) {
        sortExamples.push(`sortBy=${metadata.sortableFields[0]},${metadata.sortableFields[1]}`);
        sortExamples.push('sortOrder=ASC,DESC');
      } else {
        sortExamples.push(`sortBy=${metadata.sortableFields[0]}`);
        sortExamples.push('sortOrder=DESC');
      }
    }
    
    const allParams = [
      'page=1',
      'limit=20',
      ...filterExamples,
      ...sortExamples
    ];
    
    console.log(`    ?${allParams.join('&')}`);
    
    console.log('\n============================\n');
  }

  /**
   * Get an example value for a filter operator
   */
  private getExampleValue(operator: string): string {
    switch (operator) {
      case 'eq':
        return 'value';
      case 'like':
        return 'search';
      case 'gt':
      case 'gte':
        return '10';
      case 'lt':
      case 'lte':
        return '100';
      default:
        return 'value';
    }
  }
}

