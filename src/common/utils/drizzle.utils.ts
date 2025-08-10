import { AnyColumn, SQL, sql, SQLChunk } from 'drizzle-orm';

export function random() {
  return sql`RANDOM()`;
}

export function increment(column: AnyColumn, value: number) {
  return sql`${column} + ${value}`;
}

export function decrement(column: AnyColumn, value: number) {
  return sql`${column} - ${value}`;
}

export function concat(first: SQLChunk, second: SQLChunk) {
  return sql`${first} || ${second}`;
}

export async function firstRow<T>(
  promise: Promise<T[]>
): Promise<T | undefined> {
  return (await promise)[0];
}

export function jsonBuildObject(obj: Record<string, SQLChunk>) {
  const sqlChunks: SQL[] = [];

  Object.entries(obj).forEach(([key, value]) => {
    sqlChunks.push(sql`${key}::TEXT, TO_JSONB(${value})`);
  });

  return sql`JSONB_BUILD_OBJECT(${sql.join(sqlChunks, sql.raw(', '))})`;
}

export function jsonBuildNullableObject(
  obj: Record<string, SQLChunk>,
  nullKey: SQLChunk
) {
  const sqlChunks: SQL[] = [];

  Object.entries(obj).forEach(([key, value]) => {
    sqlChunks.push(sql`${key}::TEXT, TO_JSONB(${value})`);
  });

  return sql`CASE WHEN ${nullKey} IS NULL THEN NULL ELSE JSONB_BUILD_OBJECT(${sql.join(sqlChunks, sql.raw(', '))}) END`;
}

export function jsonAgg(sqlChunk: SQLChunk, nullKey: SQLChunk) {
  return sql`COALESCE(JSONB_AGG(${sqlChunk}) FILTER (WHERE ${nullKey} IS NOT NULL), '[]'::jsonb)`;
}

export function tsMatches(tsVector: SQLChunk, tsQuery: SQLChunk) {
  return sql`${tsVector} @@ TO_TSQUERY('english', ${tsQuery})`;
}

export function cardinality(array: SQLChunk) {
  return sql`CARDINALITY(${array})`;
}

export function coalesce(...props: SQLChunk[]) {
  return sql`COALESCE(${props[0]}, ${props[1]})`;
}
