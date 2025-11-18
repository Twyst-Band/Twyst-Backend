// Metadata keys for reflection
export const PAGINATION_METADATA = 'pagination:options';
export const PROP_METADATA = 'pagination:prop';
export const FILTERS_METADATA = 'pagination:filters';
export const SORTABLE_METADATA = 'pagination:sortable';
export const DECORATED_PROPERTIES_METADATA = 'pagination:decorated-properties';

// Filter operator types
export type FilterOperator = 'eq' | 'gt' | 'lt' | 'gte' | 'lte' | 'like';

// Sort order types
export type SortOrder = 'ASC' | 'DESC' | 'asc' | 'desc';

// Pagination type
export type PaginationType = 'cursor' | 'offset';

