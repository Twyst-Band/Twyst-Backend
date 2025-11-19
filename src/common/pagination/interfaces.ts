import { FilterOperator, PaginationType, SortOrder } from './constants';

/**
 * Options for the @Pagination class decorator
 */
// Shared fields for all pagination modes
export interface BasePaginationOptions {
  limit?: number; // Default page size
  defaultSort?: SortDefinition[]; // Default sort columns and order
  allowCustomSort?: boolean; // If the user can override defaultSort
  allowCustomLimit?: boolean; // If the user can override limit
  allowMultipleSort?: boolean; // Allow multiple columns in sortBy
  maxLimit?: number; // Maximum allowed limit for queries
}

// Case 1: Offset-only pagination → cursorIdField is not allowed
export interface OffsetPaginationOptions extends BasePaginationOptions {
  paginationType: 'offset'; // Default: offset mode
}

// Case 2: Cursor or Both → cursorIdField is mandatory
export interface CursorPaginationOptions extends BasePaginationOptions {
  paginationType: 'cursor' | 'both';
  cursorIdField: any; // Required when cursor pagination is enabled
}

// Combined final type
export type PaginationOptions =
  | OffsetPaginationOptions
  | CursorPaginationOptions;

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

/**
 * Response for offset-based pagination
 */
export interface OffsetPaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
}

/**
 * Response for cursor-based pagination
 */
export interface CursorPaginatedResponse<T> {
  data: T[];
  nextCursor: string | null;
}
