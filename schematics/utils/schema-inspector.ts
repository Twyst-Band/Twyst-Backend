import { createMany, createOne } from 'drizzle-orm';
import * as path from 'path';

// Register ts-node to handle TypeScript imports
require('ts-node').register({
  transpileOnly: true,
  compilerOptions: {
    module: 'commonjs',
    target: 'ES2022',
    esModuleInterop: true,
    allowSyntheticDefaultImports: true,
    skipLibCheck: true,
    experimentalDecorators: true
  }
});

// Register tsconfig-paths for path aliases
const tsConfigPaths = require('tsconfig-paths');
const projectRoot = path.resolve(__dirname, '../../');
const tsConfigPath = path.join(projectRoot, 'tsconfig.json');

tsConfigPaths.register({
  baseUrl: projectRoot,
  paths: {
    '@schema/*': ['src/database/schema/*'],
    '@common/*': ['src/common/*'],
    '@config/*': ['src/config/*'],
    '@modules/*': ['src/modules/*']
  }
});

export interface ColumnInfo {
  name: string;
  type: string;
  notNull: boolean;
  hasDefault: boolean;
  isPrimary: boolean;
  isUnique: boolean;
}

export interface RelationInfo {
  fieldName: string;
  type: 'one' | 'many';
  referencedTableName: string;
  isNullable?: boolean;
}

export interface TableMetadata {
  tableName: string;
  columns: ColumnInfo[];
  relations: RelationInfo[];
  generalSelect: Record<string, boolean>;
  deleteReplace: {
    statusField: string | null;
    replaceValues: Record<string, any> | null;
  };
  hasRelations: boolean;
}

export class SchemaInspector {
  private schemaPath: string;
  private schema: any;

  constructor(projectRoot: string) {
    this.schemaPath = path.join(projectRoot, 'src', 'database', 'schema');
  }

  /**
   * Load and introspect all tables from the schema
   */
  async introspectSchema(): Promise<Map<string, TableMetadata>> {
    const schemaIndexPath = path.join(this.schemaPath, 'index');
    
    // Dynamically import the schema
    this.schema = await import(schemaIndexPath);
    
    const tables = new Map<string, TableMetadata>();
    
    // Find all table exports (they follow the pattern of pgTable objects)
    for (const [exportName, exportValue] of Object.entries(this.schema)) {
      if (this.isTable(exportValue)) {
        const tableName = this.getTableName(exportValue);
        const metadata = await this.extractTableMetadata(tableName, exportName);
        
        if (metadata) {
          tables.set(tableName, metadata);
        }
      }
    }
    
    return tables;
  }

  /**
   * Extract metadata for a specific table
   */
  private async extractTableMetadata(
    tableName: string,
    exportName: string
  ): Promise<TableMetadata | null> {
    const table = this.schema[exportName];
    
    // Get general select
    const generalSelectName = `${exportName}GeneralSelect`;
    const generalSelect = this.schema[generalSelectName];
    
    if (!generalSelect) {
      console.warn(`Warning: ${generalSelectName} not found for table ${tableName}`);
      return null;
    }
    
    // Get delete replace config
    const deleteReplaceName = `${exportName}DeleteReplace`;
    const deleteReplace = this.schema[deleteReplaceName] || {
      statusField: null,
      replaceValues: null
    };
    
    // Extract columns
    const columns = this.extractColumns(table);
    
    // Extract relations
    const relationsName = `${exportName}Relations`;
    const relations = this.extractRelations(relationsName);
    
    return {
      tableName,
      columns,
      relations,
      generalSelect,
      deleteReplace,
      hasRelations: relations.length > 0
    };
  }

  /**
   * Extract column information from a table
   */
  private extractColumns(table: any): ColumnInfo[] {
    const columns: ColumnInfo[] = [];
    
    if (!table || typeof table !== 'object') {
      return columns;
    }
    
    // Access the columns from the Drizzle table object
    const columnsSymbol = Object.getOwnPropertySymbols(table).find(
      (sym) => sym.toString() === 'Symbol(drizzle:Columns)'
    );
    
    if (!columnsSymbol) {
      return columns;
    }
    
    const tableColumns = table[columnsSymbol];
    
    for (const [columnName, column] of Object.entries(tableColumns as any)) {
      columns.push({
        name: columnName,
        type: this.getColumnType(column),
        notNull: this.isColumnNotNull(column),
        hasDefault: this.hasColumnDefault(column),
        isPrimary: this.isColumnPrimary(column),
        isUnique: this.isColumnUnique(column)
      });
    }
    
    return columns;
  }

  /**
   * Extract relations for a table
   */
  private extractRelations(relationsName: string): RelationInfo[] {
    const relations: RelationInfo[] = [];
    
    const relationsExport = this.schema[relationsName];
    
    if (!relationsExport) {
      return relations;
    }
    
    try {
      // Call the relations config to get the structure
      const relationsConfig = relationsExport.config({
        one: createOne(relationsExport.table),
        many: createMany(relationsExport.table)
      });
      
      // Parse the relations from the config
      for (const [fieldName, relation] of Object.entries(relationsConfig)) {
        if (this.isOneRelation(relation)) {
          relations.push({
            fieldName,
            type: 'one',
            referencedTableName: (relation as any).referencedTableName,
            isNullable: (relation as any).isNullable || false
          });
        } else if (this.isManyRelation(relation)) {
          relations.push({
            fieldName,
            type: 'many',
            referencedTableName: (relation as any).referencedTableName
          });
        }
      }
    } catch (error) {
      console.warn(`Could not extract relations for ${relationsName}:`, error);
    }
    
    return relations;
  }

  /**
   * Helper methods
   */
  private isTable(obj: any): boolean {
    if (!obj || typeof obj !== 'object') return false;
    
    const drizzleTableSymbol = Object.getOwnPropertySymbols(obj).find(
      (sym) => sym.toString() === 'Symbol(drizzle:IsDrizzleTable)'
    );
    
    return drizzleTableSymbol ? obj[drizzleTableSymbol] === true : false;
  }

  private getTableName(table: any): string {
    const nameSymbol = Object.getOwnPropertySymbols(table).find(
      (sym) => sym.toString() === 'Symbol(drizzle:Name)'
    );
    
    return nameSymbol ? table[nameSymbol] : 'unknown';
  }

  private getColumnType(column: any): string {
    // Extract type from column object
    if (column?.column?.dataType) {
      return column.column.dataType;
    }
    
    // Fallback: try to determine from constructor
    const constructorName = column?.constructor?.name;
    if (constructorName) {
      return constructorName.replace(/^Pg/, '').toLowerCase();
    }
    
    return 'unknown';
  }

  private isColumnNotNull(column: any): boolean {
    return column?.notNull === true || column?.column?.notNull === true;
  }

  private hasColumnDefault(column: any): boolean {
    return column?.hasDefault === true || column?.column?.hasDefault === true;
  }

  private isColumnPrimary(column: any): boolean {
    return column?.primary === true || column?.column?.primary === true;
  }

  private isColumnUnique(column: any): boolean {
    return column?.unique === true || column?.column?.unique === true;
  }

  private isOneRelation(relation: any): boolean {
    return relation?.constructor?.name === 'One';
  }

  private isManyRelation(relation: any): boolean {
    return relation?.constructor?.name === 'Many';
  }

  /**
   * Get a specific table's metadata
   */
  async getTableMetadata(tableName: string): Promise<TableMetadata | null> {
    const allTables = await this.introspectSchema();
    return allTables.get(tableName) || null;
  }

  /**
   * List all available tables
   */
  async listTables(): Promise<string[]> {
    const allTables = await this.introspectSchema();
    return Array.from(allTables.keys());
  }
}

