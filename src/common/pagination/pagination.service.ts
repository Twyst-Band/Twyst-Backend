import { Injectable } from '@nestjs/common';
import { and, asc, desc } from 'drizzle-orm';
import {
  PaginatedQueryResult,
  OffsetPaginatedResponse,
  CursorPaginatedResponse,
  SortInstruction
} from './interfaces';
import { applyFilterOperator } from './filter-operators';
import { buildCursorWhereClause } from './cursor-where.builder';
import { encodeCursor, decodeCursor, extractCursorValues } from './cursor.utils';
import { throwBadRequestException } from '@common/exceptions/bad-request.exception';

@Injectable()
export class PaginationService {
  /**
   * Main execute method that delegates to offset or cursor pagination
   * @param baseQuery - Base Drizzle query builder
   * @param queryInstructions - Parsed query instructions from DTO
   * @returns Paginated response
   */
  async execute<T = any>(
    baseQuery: any,
    queryInstructions: PaginatedQueryResult
  ): Promise<OffsetPaginatedResponse<T> | CursorPaginatedResponse<T>> {
    const { paginationType, paginationOptions } = queryInstructions;

    // Validate pagination type is allowed
    const allowedType = paginationOptions.paginationType ?? 'both';
    
    if (allowedType === 'offset' && paginationType === 'cursor') {
      throwBadRequestException(
        'Cursor-based pagination is not enabled for this endpoint. Use "page" parameter instead.'
      );
    }
    
    if (allowedType === 'cursor' && paginationType === 'offset') {
      throwBadRequestException(
        'Offset-based pagination is not enabled for this endpoint. Remove "page" parameter to use cursor pagination.'
      );
    }

    if (paginationOptions.paginationType === 'cursor') {
      const cursorIdField = paginationOptions.cursorIdField;
      
      if (!cursorIdField) {
        throwBadRequestException(
          'Cursor pagination requires cursorIdField to be defined in @Pagination decorator'
        );
      }

      return this.executeCursor<T>(baseQuery, queryInstructions, cursorIdField);
    } else {
      return this.executeOffset<T>(baseQuery, queryInstructions);
    }
  }

  /**
   * Execute offset-based pagination
   * @param baseQuery - Base Drizzle query builder
   * @param queryInstructions - Parsed query instructions
   * @returns Offset paginated response
   */
  async executeOffset<T = any>(
    baseQuery: any,
    queryInstructions: PaginatedQueryResult
  ): Promise<OffsetPaginatedResponse<T>> {
    const { filters, sorting, limit, offset, page } = queryInstructions;

    // Clone the query to avoid mutation
    let query = baseQuery;

    // Apply filters
    if (filters.length > 0) {
      const filterConditions = filters.map((filter) =>
        applyFilterOperator(filter.column, filter.operator, filter.value)
      );
      query = query.where(and(...filterConditions));
    }

    // Apply sorting
    if (sorting.length > 0) {
      const orderByColumns = sorting.map((sort) => {
        return sort.order.toUpperCase() === 'DESC' 
          ? desc(sort.column) 
          : asc(sort.column);
      });
      query = query.orderBy(...orderByColumns);
    }

    // Apply pagination
    if (offset !== undefined) {
      query = query.offset(offset);
    }
    query = query.limit(limit);

    // Execute query
    const data = await query;

    return {
      data,
      page: page || 1,
      limit
    };
  }

  /**
   * Execute cursor-based pagination
   * @param baseQuery - Base Drizzle query builder
   * @param queryInstructions - Parsed query instructions
   * @param cursorIdField - ID field for cursor uniqueness
   * @returns Cursor paginated response
   */
  async executeCursor<T = any>(
    baseQuery: any,
    queryInstructions: PaginatedQueryResult,
    cursorIdField: any
  ): Promise<CursorPaginatedResponse<T>> {
    const { filters, sorting, limit, cursor } = queryInstructions;

    // Clone the query
    let query = baseQuery;

    // Apply filters
    if (filters.length > 0) {
      const filterConditions = filters.map((filter) =>
        applyFilterOperator(filter.column, filter.operator, filter.value)
      );
      query = query.where(and(...filterConditions));
    }

    // Ensure sorting includes ID field for uniqueness
    const sortingWithId = this.ensureIdInSorting(sorting, cursorIdField);

    // Apply cursor WHERE clause if cursor exists
    if (cursor) {
      const cursorValues = decodeCursor(cursor);
      const cursorWhere = buildCursorWhereClause(
        sortingWithId,
        cursorValues,
        cursorIdField
      );
      
      if (cursorWhere) {
        // If there are already WHERE conditions from filters, combine them
        query = query.where(cursorWhere);
      }
    }

    // Apply sorting
    const orderByColumns = sortingWithId.map((sort) => {
      return sort.order.toUpperCase() === 'DESC' 
        ? desc(sort.column) 
        : asc(sort.column);
    });
    query = query.orderBy(...orderByColumns);

    // Fetch limit + 1 to check if there are more pages
    query = query.limit(limit + 1);

    // Execute query
    const results = await query;

    // Check if there are more pages
    const hasMore = results.length > limit;

    // Take only the requested limit
    const data = hasMore ? results.slice(0, limit) : results;

    // Generate next cursor if there are more pages
    let nextCursor: string | null = null;
    if (hasMore && data.length > 0) {
      const lastRecord = data[data.length - 1];
      const cursorFieldNames = sortingWithId.map(
        (sort) => sort.propertyKey || this.getColumnName(sort.column)
      );
      const cursorValues = extractCursorValues(lastRecord, cursorFieldNames);
      nextCursor = encodeCursor(cursorValues);
    }

    return {
      data: data as T[],
      nextCursor
    };
  }

  /**
   * Ensure ID field is included in sorting for cursor uniqueness
   * @param sorting - Original sort instructions
   * @param cursorIdField - ID field to append
   * @returns Sort instructions with ID field
   */
  private ensureIdInSorting(
    sorting: SortInstruction[],
    cursorIdField: any
  ): SortInstruction[] {
    const idFieldName = this.getColumnName(cursorIdField);
    
    // Check if ID is already in sorting
    const hasId = sorting.some(
      (sort) => this.getColumnName(sort.column) === idFieldName
    );

    if (hasId) {
      return sorting;
    }

    // Append ID field with ASC order
    return [
      ...sorting,
      {
        propertyKey: idFieldName,
        column: cursorIdField,
        order: 'ASC'
      }
    ];
  }

  /**
   * Extract column name from Drizzle column object
   * @param column - Drizzle column reference
   * @returns Column name as string
   */
  private getColumnName(column: any): string {
    if (column && typeof column === 'object' && 'name' in column) {
      return column.name;
    }
    
    const str = String(column);
    const match = str.match(/\["(\w+)"]/);
    if (match) {
      return match[1];
    }
    
    throw new Error('Unable to extract column name from column reference');
  }
}

