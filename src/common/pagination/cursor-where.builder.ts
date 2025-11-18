import { and, or, eq, gt, lt, SQL } from 'drizzle-orm';
import { SortInstruction } from './interfaces';

/**
 * Build a WHERE clause for cursor-based pagination
 * Generates nested OR conditions for multi-field sorting
 * 
 * Example for sorting by firstName ASC, lastName ASC, id ASC:
 * WHERE (firstName > 'John')
 *    OR (firstName = 'John' AND lastName > 'Doe')
 *    OR (firstName = 'John' AND lastName = 'Doe' AND id > 123)
 * 
 * @param sortInstructions - Array of sort instructions with columns and order
 * @param cursorValues - Decoded cursor values from the last record
 * @param cursorIdField - The ID field column for uniqueness
 * @returns Drizzle SQL WHERE condition
 */
export function buildCursorWhereClause(
  sortInstructions: SortInstruction[],
  cursorValues: Record<string, any>,
  cursorIdField: any
): SQL | undefined {
  if (!sortInstructions.length) {
    return undefined;
  }

  // Ensure ID field is in cursor values
  const idFieldName = getColumnName(cursorIdField);
  if (!(idFieldName in cursorValues)) {
    throw new Error(`Cursor missing required ID field: ${idFieldName}`);
  }

  const conditions: SQL[] = [];

  // Build nested OR conditions for each level of sorting
  for (let i = 0; i < sortInstructions.length; i++) {
    const currentSort = sortInstructions[i];
    const currentFieldName = currentSort.propertyKey || getColumnName(currentSort.column);
    const currentValue = cursorValues[currentFieldName];

    if (currentValue === undefined) {
      throw new Error(`Cursor missing value for field: ${currentFieldName}`);
    }

    // Build equality conditions for all previous fields
    const equalityConditions: SQL[] = [];
    for (let j = 0; j < i; j++) {
      const prevSort = sortInstructions[j];
      const prevFieldName = prevSort.propertyKey || getColumnName(prevSort.column);
      const prevValue = cursorValues[prevFieldName];
      equalityConditions.push(eq(prevSort.column, prevValue));
    }

    // Add comparison for current field based on sort order
    const comparison = getComparisonOperator(
      currentSort.column,
      currentValue,
      currentSort.order
    );

    // Combine: all previous fields equal AND current field comparison
    if (equalityConditions.length > 0) {
      conditions.push(and(...equalityConditions, comparison)!);
    } else {
      conditions.push(comparison);
    }
  }

  // Add final condition with all fields equal except ID
  const finalEqualityConditions: SQL[] = [];
  for (const sortInstruction of sortInstructions) {
    const fieldName = sortInstruction.propertyKey || getColumnName(sortInstruction.column);
    const value = cursorValues[fieldName];
    finalEqualityConditions.push(eq(sortInstruction.column, value));
  }

  // Determine ID comparison based on last sort order (or default to ASC)
  const lastSortOrder = sortInstructions[sortInstructions.length - 1]?.order || 'ASC';
  const idComparison = getComparisonOperator(
    cursorIdField,
    cursorValues[idFieldName],
    lastSortOrder
  );

  conditions.push(and(...finalEqualityConditions, idComparison)!);

  // Combine all conditions with OR
  return or(...conditions);
}

/**
 * Get comparison operator based on sort order
 * @param column - Drizzle column
 * @param value - Value to compare against
 * @param order - Sort order (ASC or DESC)
 * @returns Drizzle SQL comparison
 */
function getComparisonOperator(column: any, value: any, order: string): SQL {
  const upperOrder = order.toUpperCase();
  
  if (upperOrder === 'ASC') {
    return gt(column, value);
  } else {
    return lt(column, value);
  }
}

/**
 * Extract column name from Drizzle column object
 * This is a helper to get the property name from the column
 * @param column - Drizzle column reference
 * @returns Column name as string
 */
function getColumnName(column: any): string {
  // Drizzle columns typically have a 'name' property
  if (column && typeof column === 'object' && 'name' in column) {
    return column.name;
  }
  
  // Fallback: try to extract from stringified column
  const str = String(column);
  const match = str.match(/\["(\w+)"]/);
  if (match) {
    return match[1];
  }
  
  throw new Error('Unable to extract column name from column reference');
}

