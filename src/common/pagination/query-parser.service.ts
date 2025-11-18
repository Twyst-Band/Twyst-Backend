import 'reflect-metadata';
import {
  DECORATED_PROPERTIES_METADATA,
  FILTERS_METADATA,
  PAGINATION_METADATA,
  PaginationType,
  PROP_METADATA,
  SORTABLE_METADATA
} from './constants';
import {
  FilterInstruction,
  FilterMetadata,
  PaginatedQueryResult,
  PaginationOptions,
  PropMetadata,
  SortableMetadata,
  SortInstruction
} from './interfaces';
import { throwBadRequestException } from '@common/exceptions/bad-request.exception';

export class QueryParserService {
  /**
   * Parse query parameters based on DTO metadata
   * @param dtoClass - The DTO class with pagination decorators
   * @param queryParams - Raw query parameters from the request
   */
  parse(dtoClass: any, queryParams: any): PaginatedQueryResult {
    const instance = new dtoClass();
    const prototype = Object.getPrototypeOf(instance);

    // Extract pagination options from class metadata
    const paginationOptions: PaginationOptions =
      Reflect.getMetadata(PAGINATION_METADATA, prototype) || {};

    // Determine pagination type based on configuration and query params
    const allowedType = paginationOptions.paginationType ?? 'both';
    let paginationType: PaginationType;

    if (allowedType === 'offset') {
      // Only offset allowed
      paginationType = 'offset';
      
      // Validate cursor is not being used
      if (queryParams.cursor) {
        throwBadRequestException(
          'Cursor-based pagination is not enabled for this endpoint. Use "page" parameter instead.'
        );
      }
    } else if (allowedType === 'cursor') {
      // Only cursor allowed
      paginationType = 'cursor';
      
      // Validate page is not being used
      if (queryParams.page) {
        throwBadRequestException(
          'Offset-based pagination is not enabled for this endpoint. Remove "page" parameter to use cursor pagination.'
        );
      }
    } else {
      // Both allowed - use 'page' parameter presence to determine type
      paginationType = queryParams.page ? 'offset' : 'cursor';
    }

    // Parse filters
    const filters = this.parseFilters(prototype, queryParams);

    // Parse sorting
    const sorting = this.parseSorting(
      prototype,
      queryParams,
      paginationOptions
    );

    // Parse limit
    const limit = this.parseLimit(queryParams, paginationOptions);

    // Parse pagination-specific parameters
    const result: PaginatedQueryResult = {
      filters,
      sorting,
      limit,
      paginationType,
      paginationOptions
    };

    if (paginationType === 'cursor') {
      result.cursor = queryParams.cursor;
    } else {
      const page = queryParams.page ? parseInt(queryParams.page, 10) : 1;
      result.page = page;
      result.offset = (page - 1) * limit;
    }

    return result;
  }

  /**
   * Parse filter parameters based on @Prop and filter decorators
   */
  private parseFilters(prototype: any, queryParams: any): FilterInstruction[] {
    const filters: FilterInstruction[] = [];

    // Get decorated properties from the class metadata
    const decoratedProps: Set<string> =
      Reflect.getMetadata(DECORATED_PROPERTIES_METADATA, prototype) ||
      new Set();

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

      for (const filterMetadata of filterMetadataArray) {
        const { operator, alias, default: defaultValue } = filterMetadata;

        // Check if query parameter exists (using alias)
        let value = queryParams[alias];

        // Use default value if not provided
        if (value === undefined && defaultValue !== undefined) {
          value = defaultValue;
        }

        // Only add filter if value exists
        if (value !== undefined && value !== null && value !== '') {
          filters.push({
            propertyKey,
            column: propMetadata.column,
            operator,
            value
          });
        }
      }
    }

    return filters;
  }

  /**
   * Parse sorting parameters based on @Sortable decorators
   */
  private parseSorting(
    prototype: any,
    queryParams: any,
    paginationOptions: PaginationOptions
  ): SortInstruction[] {
    const sorting: SortInstruction[] = [];

    // Check if custom sort is allowed
    const allowCustomSort = paginationOptions.allowCustomSort ?? true;
    const allowMultipleSort = paginationOptions.allowMultipleSort ?? true;

    // If custom sort is not allowed or not provided, use default sort
    if (!allowCustomSort || !queryParams.sortBy) {
      return this.getDefaultSorting(paginationOptions);
    }

    // Parse sortBy and sortOrder (comma-separated values)
    let sortByArray: string[] = [];
    if (typeof queryParams.sortBy === 'string') {
      sortByArray = queryParams.sortBy.split(',').map(s => s.trim()).filter(s => s);
    } else if (Array.isArray(queryParams.sortBy)) {
      // Fallback for array format (but prefer comma-separated)
      sortByArray = queryParams.sortBy;
    }

    let sortOrderArray: string[] = [];
    if (queryParams.sortOrder) {
      if (typeof queryParams.sortOrder === 'string') {
        sortOrderArray = queryParams.sortOrder.split(',').map(s => s.trim()).filter(s => s);
      } else if (Array.isArray(queryParams.sortOrder)) {
        sortOrderArray = queryParams.sortOrder;
      }
    }

    // Validate multiple sort is allowed
    if (!allowMultipleSort && sortByArray.length > 1) {
      throwBadRequestException(
        `Multiple sort fields are not allowed. Received ${sortByArray.length} fields: ${sortByArray.join(', ')}. Only single field sorting is permitted.`
      );
    }

    // Get decorated properties
    const decoratedProps: Set<string> =
      Reflect.getMetadata(DECORATED_PROPERTIES_METADATA, prototype) ||
      new Set();

    // Build a map of sortable aliases to property keys
    const sortableAliasMap = new Map<string, string>();
    const availableSortableAliases: string[] = [];
    
    for (const propertyKey of decoratedProps) {
      const sortableMetadata: SortableMetadata | undefined =
        Reflect.getMetadata(SORTABLE_METADATA, prototype, propertyKey);
      
      if (sortableMetadata?.enabled) {
        sortableAliasMap.set(sortableMetadata.alias, propertyKey);
        availableSortableAliases.push(sortableMetadata.alias);
      }
    }

    // Validate and build sorting instructions
    for (let i = 0; i < sortByArray.length; i++) {
      const sortByAlias = sortByArray[i];
      const order = (sortOrderArray[i] || 'ASC').toUpperCase();

      // Find the property key from the alias
      const propertyKey = sortableAliasMap.get(sortByAlias);

      if (!propertyKey) {
        throwBadRequestException(
          `'${sortByAlias}' is not a valid sortable field. Available sortable fields: ${availableSortableAliases.join(', ')}`
        );
      }

      // Get property column
      const propMetadata: PropMetadata | undefined = Reflect.getMetadata(
        PROP_METADATA,
        prototype,
        propertyKey
      );

      if (!propMetadata) {
        throwBadRequestException(
          `Property '${propertyKey}' does not have @Prop decorator`
        );
      }

      // Validate sort order
      if (order !== 'ASC' && order !== 'DESC') {
        throwBadRequestException(
          `Invalid sort order '${order}' for field '${sortByAlias}'. Must be 'ASC' or 'DESC'`
        );
      }

      sorting.push({
        propertyKey,
        column: propMetadata.column,
        order: order as 'ASC' | 'DESC'
      });
    }

    return sorting.length > 0
      ? sorting
      : this.getDefaultSorting(paginationOptions);
  }

  /**
   * Get default sorting from pagination options
   */
  private getDefaultSorting(
    paginationOptions: PaginationOptions
  ): SortInstruction[] {
    const defaultSort = paginationOptions.defaultSort || [];

    return defaultSort.map((sortDef) => ({
      propertyKey: '', // Not available from field reference
      column: sortDef.field,
      order: sortDef.order.toUpperCase() as 'ASC' | 'DESC'
    }));
  }

  /**
   * Parse limit parameter with validation
   */
  private parseLimit(
    queryParams: any,
    paginationOptions: PaginationOptions
  ): number {
    const allowCustomLimit = paginationOptions.allowCustomLimit ?? true;
    const defaultLimit = paginationOptions.limit ?? 10;
    const maxLimit = paginationOptions.maxLimit ?? 100;

    // If custom limit is not allowed, use default
    if (!allowCustomLimit || !queryParams.limit) {
      return defaultLimit;
    }

    const requestedLimit = parseInt(queryParams.limit, 10);

    // Validate limit
    if (isNaN(requestedLimit) || requestedLimit <= 0) {
      throwBadRequestException(
        `Invalid limit value: '${queryParams.limit}'. Limit must be a positive integer`
      );
    }

    // Enforce max limit
    if (requestedLimit > maxLimit) {
      throwBadRequestException(
        `Limit value ${requestedLimit} exceeds maximum allowed limit of ${maxLimit}`
      );
    }

    return requestedLimit;
  }
}
