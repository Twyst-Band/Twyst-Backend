import { FilterOperator, SortOrder, PaginationType } from './constants';

/**
 * Options for the @Pagination class decorator
 */
export interface PaginationOptions {
  limit?: number; // Default page size
  defaultSort?: SortDefinition[]; // Default sort columns and order
  allowCustomSort?: boolean; // If the user can override defaultSort
  allowCustomLimit?: boolean; // If the user can override limit
  allowMultipleSort?: boolean; // Allow multiple columns in sortBy
  maxLimit?: number; // Maximum allowed limit for queries
}

/**
 * Sort definition for defaultSort
 */
export interface SortDefinition {
  field: any; // Drizzle column or expression
  order: SortOrder;
}

/**
 * Options for filter operator decorators
 */
export interface OperatorOptions {
  alias?: string; // Query parameter alias
  default?: any; // Default value if not provided
}

/**
 * Metadata stored by @Prop decorator
 */
export interface PropMetadata {
  column: any; // Drizzle column or expression reference
}

/**
 * Metadata stored by filter decorators
 */
export interface FilterMetadata {
  operator: FilterOperator;
  alias: string;
  default?: any;
}

/**
 * Options for @Sortable decorator
 */
export interface SortableOptions {
  alias?: string; // Alias for the sortBy parameter
}

/**
 * Metadata stored by @Sortable decorator
 */
export interface SortableMetadata {
  enabled: boolean;
  alias: string; // Alias for the sortBy parameter (defaults to property name)
}

/**
 * Parsed filter instruction
 */
export interface FilterInstruction {
  propertyKey: string;
  column: any; // Drizzle column reference
  operator: FilterOperator;
  value: any;
}

/**
 * Parsed sort instruction
 */
export interface SortInstruction {
  propertyKey: string;
  column: any; // Drizzle column reference
  order: SortOrder;
}

/**
 * Result of parsing query parameters based on DTO metadata
 */
export interface PaginatedQueryResult {
  filters: FilterInstruction[];
  sorting: SortInstruction[];
  limit: number;
  offset?: number; // For offset-based pagination
  page?: number; // For offset-based pagination
  cursor?: string; // For cursor-based pagination
  paginationType: PaginationType;
  paginationOptions: PaginationOptions;
}

