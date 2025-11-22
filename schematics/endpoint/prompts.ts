import inquirer from 'inquirer';
import { SchemaInspector, TableMetadata, RelationInfo } from '../utils/schema-inspector';

export type EndpointType =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'createMany'
  | 'readMany'
  | 'updateMany'
  | 'deleteMany';

export type DeleteType = 'normal' | 'replace';

export type PaginationType = 'cursor' | 'offset' | 'both';

export interface SelectedRelation {
  fieldName: string;
  type: 'one' | 'many';
  referencedTableName: string;
  skipJunctionTable?: boolean;
  nestedRelations?: SelectedRelation[];
}

export interface EndpointConfig {
  tableName: string;
  tableMetadata: TableMetadata;
  endpointType: EndpointType;
  relations: SelectedRelation[];
  deleteType?: DeleteType;
  paginationType?: PaginationType;
  isPublic?: boolean;
}

export class EndpointPrompts {
  constructor(private inspector: SchemaInspector) {}

  /**
   * Main prompt flow
   */
  async promptForEndpointConfig(): Promise<EndpointConfig> {
    // Step 1: Select table
    const tableName = await this.promptForTable();
    const tableMetadata = await this.inspector.getTableMetadata(tableName);
    
    if (!tableMetadata) {
      throw new Error(`Table metadata not found for ${tableName}`);
    }

    // Step 2: Select endpoint type
    const endpointType = await this.promptForEndpointType();

    // Step 3: Handle relations (for create and read operations)
    let relations: SelectedRelation[] = [];
    if (['create', 'createMany', 'read', 'readMany'].includes(endpointType)) {
      if (tableMetadata.hasRelations) {
        relations = await this.promptForRelations(tableMetadata, new Set());
      }
    }

    // Step 4: Delete type (for delete operations)
    let deleteType: DeleteType | undefined;
    if (['delete', 'deleteMany'].includes(endpointType)) {
      deleteType = await this.promptForDeleteType(tableMetadata);
    }

    // Step 5: Pagination type (for readMany)
    let paginationType: PaginationType | undefined;
    if (endpointType === 'readMany') {
      paginationType = await this.promptForPaginationType();
    }

    // Step 6: Public endpoint?
    const isPublic = await this.promptForPublicEndpoint();

    return {
      tableName,
      tableMetadata,
      endpointType,
      relations,
      deleteType,
      paginationType,
      isPublic
    };
  }

  /**
   * Prompt for table selection
   */
  private async promptForTable(): Promise<string> {
    const tables = await this.inspector.listTables();
    
    const { tableName } = await inquirer.prompt<{ tableName: string }>([
      {
        type: 'list',
        name: 'tableName',
        message: 'Which table would you like to use?',
        choices: tables.sort()
      }
    ]);

    return tableName;
  }

  /**
   * Prompt for endpoint type
   */
  private async promptForEndpointType(): Promise<EndpointType> {
    const { endpointType } = await inquirer.prompt<{ endpointType: EndpointType }>([
      {
        type: 'list',
        name: 'endpointType',
        message: 'What kind of endpoint do you want?',
        choices: [
          { name: 'Create (single record)', value: 'create' },
          { name: 'Read (single record)', value: 'read' },
          { name: 'Update (single record)', value: 'update' },
          { name: 'Delete (single record)', value: 'delete' },
          { name: 'Create Many (multiple records)', value: 'createMany' },
          { name: 'Read Many (with pagination)', value: 'readMany' },
          { name: 'Update Many (multiple records)', value: 'updateMany' },
          { name: 'Delete Many (multiple records)', value: 'deleteMany' }
        ]
      }
    ]);

    return endpointType;
  }

  /**
   * Prompt for relations (recursive)
   */
  private async promptForRelations(
    tableMetadata: TableMetadata,
    visitedTables: Set<string>
  ): Promise<SelectedRelation[]> {
    const selectedRelations: SelectedRelation[] = [];
    
    // Prevent circular references
    if (visitedTables.has(tableMetadata.tableName)) {
      return selectedRelations;
    }
    
    visitedTables.add(tableMetadata.tableName);

    for (const relation of tableMetadata.relations) {
      const { includeRelation } = await inquirer.prompt<{ includeRelation: boolean }>([
        {
          type: 'confirm',
          name: 'includeRelation',
          message: `Include relation "${relation.fieldName}" (${relation.type} -> ${relation.referencedTableName})?`,
          default: false
        }
      ]);

      if (includeRelation) {
        const selectedRelation: SelectedRelation = {
          fieldName: relation.fieldName,
          type: relation.type,
          referencedTableName: relation.referencedTableName
        };

        // Check if this is a junction table (many-to-many pattern)
        const isJunctionTable = await this.isJunctionTable(relation.referencedTableName);
        
        if (isJunctionTable) {
          const { skipJunction } = await inquirer.prompt<{ skipJunction: boolean }>([
            {
              type: 'confirm',
              name: 'skipJunction',
              message: `${relation.referencedTableName} appears to be a junction table. Skip it and include related entities directly?`,
              default: true
            }
          ]);

          selectedRelation.skipJunctionTable = skipJunction;
        }

        // Recursively ask for nested relations
        const relatedTableMetadata = await this.inspector.getTableMetadata(
          relation.referencedTableName
        );
        
        if (relatedTableMetadata && relatedTableMetadata.hasRelations) {
          const { includeNestedRelations } = await inquirer.prompt<{ includeNestedRelations: boolean }>([
            {
              type: 'confirm',
              name: 'includeNestedRelations',
              message: `Include nested relations for ${relation.referencedTableName}?`,
              default: false
            }
          ]);

          if (includeNestedRelations) {
            selectedRelation.nestedRelations = await this.promptForRelations(
              relatedTableMetadata,
              new Set(visitedTables)
            );
          }
        }

        selectedRelations.push(selectedRelation);
      }
    }

    return selectedRelations;
  }

  /**
   * Check if a table is a junction table
   */
  private async isJunctionTable(tableName: string): Promise<boolean> {
    const metadata = await this.inspector.getTableMetadata(tableName);
    
    if (!metadata) return false;

    // Junction tables typically:
    // 1. Have 2 or more foreign key columns
    // 2. Have no other significant columns except IDs
    // 3. Have names like "x_to_y" or "x_y"
    
    const foreignKeyColumns = metadata.columns.filter(
      (col) => col.name.toLowerCase().includes('id') && !col.isPrimary
    );
    
    const hasJunctionPattern = tableName.includes('_to_') || tableName.includes('_');
    const hasMinimalColumns = metadata.columns.length <= 3;
    const hasMultipleForeignKeys = foreignKeyColumns.length >= 2;
    
    return hasJunctionPattern && hasMinimalColumns && hasMultipleForeignKeys;
  }

  /**
   * Prompt for delete type
   */
  private async promptForDeleteType(tableMetadata: TableMetadata): Promise<DeleteType> {
    const canUseReplaceDelete = tableMetadata.deleteReplace.statusField !== null;
    
    if (!canUseReplaceDelete) {
      return 'normal';
    }

    const { deleteType } = await inquirer.prompt<{ deleteType: DeleteType }>([
      {
        type: 'list',
        name: 'deleteType',
        message: 'What kind of delete operation?',
        choices: [
          { name: 'Normal delete (remove from database)', value: 'normal' },
          { name: 'Replace delete (replace with default values)', value: 'replace' }
        ]
      }
    ]);

    return deleteType;
  }

  /**
   * Prompt for pagination type
   */
  private async promptForPaginationType(): Promise<PaginationType> {
    const { paginationType } = await inquirer.prompt<{ paginationType: PaginationType }>([
      {
        type: 'list',
        name: 'paginationType',
        message: 'What kind of pagination?',
        choices: [
          { name: 'Both (cursor and offset)', value: 'both' },
          { name: 'Cursor-based only', value: 'cursor' },
          { name: 'Offset-based only', value: 'offset' }
        ],
        default: 'both'
      }
    ]);

    return paginationType;
  }

  /**
   * Prompt for public endpoint
   */
  private async promptForPublicEndpoint(): Promise<boolean> {
    const { isPublic } = await inquirer.prompt<{ isPublic: boolean }>([
      {
        type: 'confirm',
        name: 'isPublic',
        message: 'Should this endpoint be public (skip authentication)?',
        default: false
      }
    ]);

    return isPublic;
  }
}

