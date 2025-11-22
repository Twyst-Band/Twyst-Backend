/**
 * Convert a string to PascalCase
 */
export function toPascalCase(str: string): string {
  return str
    .replace(/[-_](.)/g, (_, char) => char.toUpperCase())
    .replace(/^(.)/, (char) => char.toUpperCase());
}

/**
 * Convert a string to camelCase
 */
export function toCamelCase(str: string): string {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

/**
 * Convert a string to kebab-case
 */
export function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

/**
 * Convert a string to snake_case
 */
export function toSnakeCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase();
}

/**
 * Pluralize a word (simple implementation)
 */
export function pluralize(word: string): string {
  if (word.endsWith('s')) return word;
  if (word.endsWith('y')) return word.slice(0, -1) + 'ies';
  return word + 's';
}

/**
 * Singularize a word (simple implementation)
 */
export function singularize(word: string): string {
  if (word.endsWith('ies')) return word.slice(0, -3) + 'y';
  if (word.endsWith('ses')) return word.slice(0, -2);
  if (word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1);
  return word;
}

/**
 * Get class name from table name
 */
export function getClassName(tableName: string): string {
  return toPascalCase(singularize(tableName));
}

/**
 * Get variable name from table name
 */
export function getVariableName(tableName: string): string {
  return toCamelCase(singularize(tableName));
}

/**
 * Get module name from table name
 */
export function getModuleName(tableName: string): string {
  return pluralize(toKebabCase(singularize(tableName)));
}

