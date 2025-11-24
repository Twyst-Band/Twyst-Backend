import { TableMetadata, SchemaInspector } from '../utils/schema-inspector';
import { SelectedRelation, EndpointType, DeleteType } from '../endpoint/prompts';
import { getClassName, toCamelCase, getVariableName, toPascalCase } from '../utils/string-utils';

export class ServiceGenerator {
  constructor(private readonly inspector: SchemaInspector) {}

  /**
   * Generate service class
   */
  generateService(
    tableMetadata: TableMetadata,
    endpoints: Array<{
      type: EndpointType;
      relations?: SelectedRelation[];
      deleteType?: DeleteType;
    }>
  ): string {
    const className = getClassName(tableMetadata.tableName);
    const serviceName = `${className}Service`;
    const schemaImport = toCamelCase(tableMetadata.tableName);

    // Collect all relations from all endpoints
    const allRelations = endpoints.flatMap((e) => e.relations || []);
    
    const imports = this.generateImports(tableMetadata, endpoints, allRelations);
    const methods: string[] = [];

    for (const endpoint of endpoints) {
      const method = this.generateMethod(tableMetadata, endpoint);
      if (method) {
        methods.push(method);
      }
    }

    const needsPaginationService = endpoints.some((e) => e.type === 'readMany');
    const constructor = needsPaginationService
      ? `  constructor(private readonly paginationService: PaginationService) {
    super();
  }`
      : `  constructor() {
    super();
  }`;

    return `${imports}

@Injectable()
export class ${serviceName} extends CommonService {
${constructor}

${methods.join('\n\n')}
}
`;
  }

  /**
   * Generate imports
   */
  private generateImports(
    tableMetadata: TableMetadata,
    endpoints: Array<{ type: EndpointType }>,
    allRelations: SelectedRelation[]
  ): string {
    const imports: string[] = [];
    const schemaImport = toCamelCase(tableMetadata.tableName);
    const tableName = tableMetadata.tableName;

    imports.push(`import { Injectable } from '@nestjs/common';`);
    imports.push(`import { CommonService } from '@common/services/common.service';`);
    imports.push(`import { ${schemaImport} } from '@schema/${tableName}';`);
    
    // Add imports for related tables
    const relatedTableImports = new Set<string>();
    for (const relation of allRelations) {
      const relatedSchema = toCamelCase(relation.referencedTableName);
      const relatedTableName = relation.referencedTableName;
      relatedTableImports.add(`import { ${relatedSchema} } from '@schema/${relatedTableName}';`);
    }
    imports.push(...Array.from(relatedTableImports));
    
    imports.push(`import { eq, inArray } from 'drizzle-orm';`);
    imports.push(`import { firstRow, jsonAgg, jsonBuildObject, jsonBuildNullableObject } from '@common/utils/drizzle.utils';`);

    // Check if we need pagination imports
    if (endpoints.some((e) => e.type === 'readMany')) {
      imports.push(`import {
  CursorPaginatedResponse,
  OffsetPaginatedResponse,
  PaginatedQueryResult,
  PaginationService
} from '@common/pagination';`);
    }

    // Add DTO imports - directly from files (singular form)
    const className = getClassName(tableName);
    const singularTableName = toCamelCase(className); // Use className which is already singular

    for (const endpoint of endpoints) {
      if (['create', 'createMany'].includes(endpoint.type)) {
        imports.push(`import { Create${className}Dto } from './dto/create-${singularTableName}.dto';`);
      }
      if (['update', 'updateMany'].includes(endpoint.type)) {
        imports.push(`import { Update${className}Dto } from './dto/update-${singularTableName}.dto';`);
      }
    }

    return imports.join('\n');
  }

  /**
   * Generate method based on endpoint type
   */
  private generateMethod(
    tableMetadata: TableMetadata,
    endpoint: { type: EndpointType; relations?: SelectedRelation[]; deleteType?: DeleteType }
  ): string {
    switch (endpoint.type) {
      case 'create':
        return this.generateCreateMethod(tableMetadata, endpoint.relations || []);
      case 'read':
        return this.generateReadMethod(tableMetadata, endpoint.relations || []);
      case 'readMany':
        return this.generateReadManyMethod(tableMetadata, endpoint.relations || []);
      case 'update':
        return this.generateUpdateMethod(tableMetadata);
      case 'delete':
        return this.generateDeleteMethod(tableMetadata, endpoint.deleteType || 'normal');
      case 'createMany':
        return this.generateCreateManyMethod(tableMetadata, endpoint.relations || []);
      case 'updateMany':
        return this.generateUpdateManyMethod(tableMetadata);
      case 'deleteMany':
        return this.generateDeleteManyMethod(tableMetadata, endpoint.deleteType || 'normal');
      default:
        return '';
    }
  }

  /**
   * Generate Create method
   */
  private generateCreateMethod(
    tableMetadata: TableMetadata,
    relations: SelectedRelation[]
  ): string {
    const className = getClassName(tableMetadata.tableName);
    const variableName = getVariableName(tableMetadata.tableName);
    const schemaImport = toCamelCase(tableMetadata.tableName);
    const dtoParamName = `create${className}Dto`;
    const pkColumn = tableMetadata.columns.find((col) => col.isPrimary);

    if (!pkColumn) {
      throw new Error(`No primary key found for ${tableMetadata.tableName}`);
    }

    const selectColumns = Object.keys(tableMetadata.generalSelect)
      .map((key) => `        ${key}: ${schemaImport}.${key}`)
      .join(',\n');

    if (relations.length === 0) {
      // Simple create without relations - still use transaction
      return `  async create(${dtoParamName}: Create${className}Dto) {
    return this.db.transaction(async (tx) => {
      const ${variableName} = await firstRow(
        tx
          .insert(${schemaImport})
          .values(${dtoParamName})
          .returning({
${selectColumns}
          })
      );

      return ${variableName};
    });
  }`;
    }

    // Create with relations (using transaction)
    // Properly exclude relation fields using destructuring
    const relationFields = relations.map((r) => r.fieldName).join(', ');
    const destructuring = relationFields ? `const { ${relationFields}, ...mainData } = ${dtoParamName};` : '';
    
    return `  async create(${dtoParamName}: Create${className}Dto) {
    return this.db.transaction(async (tx) => {
      ${destructuring ? destructuring + '\n      ' : ''}// Insert main record
      const ${variableName} = await firstRow(
        tx
          .insert(${schemaImport})
          .values(${destructuring ? 'mainData' : dtoParamName})
          .returning({
${selectColumns}
          })
      );

      ${this.generateRelationInserts(relations, variableName, pkColumn.name, dtoParamName, tableMetadata)}

      return ${variableName};
    });
  }`;
  }

  /**
   * Generate relation inserts for create method
   */
  private generateRelationInserts(
    relations: SelectedRelation[],
    parentVariable: string,
    parentIdField: string,
    dtoVariable: string,
    parentTableMetadata: TableMetadata
  ): string {
    const inserts: string[] = [];

    for (const relation of relations) {
      const relatedSchemaImport = toCamelCase(relation.referencedTableName);

      if (relation.type === 'many') {
        if (relation.skipJunctionTable) {
          // Insert junction table records directly
          // Load junction table metadata to find correct foreign key columns
          const junctionTableMetadata = this.inspector.getTableMetadataSync(relation.referencedTableName);
          
          if (!junctionTableMetadata) {
            throw new Error(`Could not load metadata for junction table: ${relation.referencedTableName}`);
          }

          // Find the foreign key column that references the parent table
          const parentFkColumn = this.findForeignKeyColumn(
            junctionTableMetadata,
            parentTableMetadata.tableName,
            parentIdField
          );

          // Find the foreign key column that references the related table
          // We need to look at nested relations to find the actual target table
          let targetTableName = '';
          let targetFkColumn = '';
          
          if (relation.nestedRelations && relation.nestedRelations.length > 0) {
            // Get the first nested relation as the target
            const nestedRelation = relation.nestedRelations[0];
            targetTableName = nestedRelation.referencedTableName;
            targetFkColumn = this.findForeignKeyColumnToTable(
              junctionTableMetadata,
              targetTableName
            );
          }

          inserts.push(`      // Insert ${relation.fieldName}
      if (${dtoVariable}.${relation.fieldName} && ${dtoVariable}.${relation.fieldName}.length > 0) {
        await tx.insert(${relatedSchemaImport}).values(
          ${dtoVariable}.${relation.fieldName}.map((${targetTableName ? 'relatedId' : 'id'}) => ({
            ${parentFkColumn}: ${parentVariable}.${parentIdField},${targetFkColumn ? `\n            ${targetFkColumn}: relatedId` : ''}
          }))
        );
      }`);
        } else {
          inserts.push(`      // Insert ${relation.fieldName}
      if (${dtoVariable}.${relation.fieldName} && ${dtoVariable}.${relation.fieldName}.length > 0) {
        await tx.insert(${relatedSchemaImport}).values(
          ${dtoVariable}.${relation.fieldName}.map((item) => ({
            ...item,
            ${parentIdField}: ${parentVariable}.${parentIdField}
          }))
        );
      }`);
        }
      }
    }

    return inserts.join('\n\n');
  }

  /**
   * Find foreign key column that references a specific table
   */
  private findForeignKeyColumn(
    junctionTableMetadata: TableMetadata,
    targetTableName: string,
    targetColumnName: string
  ): string {
    // Look for a column that likely references the target table
    // Common patterns: tableNameID, table_nameID, tableID
    const possibleNames = [
      `${targetTableName}ID`,
      `${targetTableName}_id`,
      `${toCamelCase(targetTableName)}ID`,
      targetColumnName
    ];

    for (const possibleName of possibleNames) {
      if (junctionTableMetadata.columns.some(col => col.name === possibleName)) {
        return possibleName;
      }
    }

    // If not found, look for any column that ends with ID
    const idColumn = junctionTableMetadata.columns.find(
      col => col.name.toLowerCase().includes(targetTableName.toLowerCase()) && col.name.toLowerCase().includes('id')
    );

    if (idColumn) {
      return idColumn.name;
    }

    throw new Error(`Could not find foreign key column in ${junctionTableMetadata.tableName} that references ${targetTableName}`);
  }

  /**
   * Find foreign key column that references a specific table (simplified)
   */
  private findForeignKeyColumnToTable(
    junctionTableMetadata: TableMetadata,
    targetTableName: string
  ): string {
    // Look for a column that likely references the target table
    const possibleNames = [
      `${targetTableName}ID`,
      `${targetTableName}_id`,
      `${toCamelCase(targetTableName)}ID`,
      `${getVariableName(targetTableName)}ID`
    ];

    for (const possibleName of possibleNames) {
      if (junctionTableMetadata.columns.some(col => col.name === possibleName)) {
        return possibleName;
      }
    }

    // If not found, look for any column that contains the table name
    const idColumn = junctionTableMetadata.columns.find(
      col => col.name.toLowerCase().includes(targetTableName.toLowerCase()) && col.name.toLowerCase().includes('id')
    );

    if (idColumn) {
      return idColumn.name;
    }

    throw new Error(`Could not find foreign key column in ${junctionTableMetadata.tableName} that references ${targetTableName}`);
  }

  /**
   * Generate Read method
   */
  private generateReadMethod(
    tableMetadata: TableMetadata,
    relations: SelectedRelation[]
  ): string {
    const className = getClassName(tableMetadata.tableName);
    const schemaImport = toCamelCase(tableMetadata.tableName);
    const pkColumn = tableMetadata.columns.find((col) => col.isPrimary);

    if (!pkColumn) {
      throw new Error(`No primary key found for ${tableMetadata.tableName}`);
    }

    const selectColumns = Object.keys(tableMetadata.generalSelect)
      .map((key) => `        ${key}: true`)
      .join(',\n');

    if (relations.length === 0) {
      return `  async findOne(id: number) {
    return this.query.${schemaImport}.findFirst({
      where: eq(${schemaImport}.${pkColumn.name}, id),
      columns: {
${selectColumns}
      }
    });
  }`;
    }

    const withRelations = this.generateWithRelations(relations);

    return `  async findOne(id: number) {
    return this.query.${schemaImport}.findFirst({
      where: eq(${schemaImport}.${pkColumn.name}, id),
      columns: {
${selectColumns}
      },
      with: {
${withRelations}
      }
    });
  }`;
  }

  /**
   * Generate with relations clause
   */
  private generateWithRelations(relations: SelectedRelation[], indent: string = '        '): string {
    return relations
      .map((relation) => {
        if (relation.nestedRelations && relation.nestedRelations.length > 0) {
          const nested = this.generateWithRelations(relation.nestedRelations, indent + '    ');
          return `${indent}${relation.fieldName}: {\n${indent}  with: {\n${nested}\n${indent}  }\n${indent}}`;
        }
        return `${indent}${relation.fieldName}: true`;
      })
      .join(',\n');
  }

  /**
   * Generate ReadMany method
   */
  private generateReadManyMethod(
    tableMetadata: TableMetadata,
    relations: SelectedRelation[]
  ): string {
    const className = getClassName(tableMetadata.tableName);
    const schemaImport = toCamelCase(tableMetadata.tableName);
    
    // Separate one and many relations
    const oneRelations = relations.filter((r) => r.type === 'one');
    const manyRelations = relations.filter((r) => r.type === 'many');

    if (relations.length === 0) {
      // Simple query without relations
      const selectColumns = Object.keys(tableMetadata.generalSelect)
        .map((key) => `        ${key}: ${schemaImport}.${key}`)
        .join(',\n');

      return `  async findAll(
    queryInstructions: PaginatedQueryResult
  ): Promise<OffsetPaginatedResponse<any> | CursorPaginatedResponse<any>> {
    const baseQuery = this.db
      .select({
${selectColumns}
      })
      .from(${schemaImport});

    return this.paginationService.execute(baseQuery, queryInstructions);
  }`;
    }

    // Generate CTEs for many relations
    const ctes = this.generateCTEsForManyRelations(manyRelations, schemaImport, tableMetadata);
    
    // Generate select with joins for one relations
    const selectWithRelations = this.generateSelectWithRelations(
      tableMetadata,
      schemaImport,
      oneRelations,
      manyRelations
    );
    
    // Generate left joins for one relations
    const leftJoins = this.generateLeftJoins(oneRelations, schemaImport);
    
    // Generate left joins for CTE many relations
    const cteJoins = this.generateCTEJoins(manyRelations, schemaImport, tableMetadata);

    // Generate with clause if there are CTEs
    const withClause = manyRelations.length > 0
      ? `\n      .with(${manyRelations.map((r) => `${r.fieldName}Cte`).join(', ')})`
      : '';

    return `  async findAll(
    queryInstructions: PaginatedQueryResult
  ): Promise<OffsetPaginatedResponse<any> | CursorPaginatedResponse<any>> {
    ${ctes}const baseQuery = this.db${withClause}
      .select({
${selectWithRelations}
      })
      .from(${schemaImport})${leftJoins}${cteJoins};

    return this.paginationService.execute(baseQuery, queryInstructions);
  }`;
  }
  
  /**
   * Generate CTEs for many relations
   */
  private generateCTEsForManyRelations(
    manyRelations: SelectedRelation[],
    schemaImport: string,
    tableMetadata: TableMetadata
  ): string {
    if (manyRelations.length === 0) return '';
    
    const pkColumn = tableMetadata.columns.find((col) => col.isPrimary);
    if (!pkColumn) return '';
    
    const ctes: string[] = [];
    
    for (const relation of manyRelations) {
      // Use referencedTableName from the relation object
      const relatedTableName = relation.referencedTableName;
      const relatedSchema = toCamelCase(relatedTableName);
      const cteName = `${relation.fieldName}Cte`;
      
      ctes.push(`const ${cteName} = this.db.$with('${cteName}').as(
      this.db
        .select({
          ${schemaImport}${toPascalCase(pkColumn.name)}: ${relatedSchema}.${this.getRelationForeignKey(relation, tableMetadata)},
          data: jsonAgg(
            jsonBuildObject({
              // Add all columns from related table
              id: ${relatedSchema}.id
            }),
            ${relatedSchema}.id
          )
        })
        .from(${relatedSchema})
        .groupBy(${relatedSchema}.${this.getRelationForeignKey(relation, tableMetadata)})
    );
    `);
    }
    
    return ctes.join('\n    ') + '\n    ';
  }
  
  /**
   * Generate select with relations
   */
  private generateSelectWithRelations(
    tableMetadata: TableMetadata,
    schemaImport: string,
    oneRelations: SelectedRelation[],
    manyRelations: SelectedRelation[]
  ): string {
    const baseColumns = Object.keys(tableMetadata.generalSelect)
      .map((key) => `        ${key}: ${schemaImport}.${key}`)
      .join(',\n');
    
    const oneRelationColumns = oneRelations.map((relation) => {
      // Use referencedTableName from the relation object
      const relatedTableName = relation.referencedTableName;
      const relatedSchema = toCamelCase(relatedTableName);
      return `        ${relation.fieldName}: jsonBuildNullableObject({
          // Add all columns from related table
          id: ${relatedSchema}.id
        }, ${relatedSchema}.id)`;
    }).join(',\n');
    
    const manyRelationColumns = manyRelations.map((relation) => {
      const cteName = `${relation.fieldName}Cte`;
      return `        ${relation.fieldName}: ${cteName}.data`;
    }).join(',\n');
    
    const parts = [baseColumns];
    if (oneRelationColumns) parts.push(oneRelationColumns);
    if (manyRelationColumns) parts.push(manyRelationColumns);
    
    return parts.join(',\n');
  }
  
  /**
   * Generate left joins for one relations
   */
  private generateLeftJoins(oneRelations: SelectedRelation[], schemaImport: string): string {
    if (oneRelations.length === 0) return '';
    
    return '\n' + oneRelations.map((relation) => {
      // Use referencedTableName from the relation object
      const relatedTableName = relation.referencedTableName;
      const relatedSchema = toCamelCase(relatedTableName);
      // Assuming foreign key is relationFieldName + 'ID'
      const foreignKey = `${relation.fieldName}ID`;
      return `      .leftJoin(${relatedSchema}, eq(${schemaImport}.${foreignKey}, ${relatedSchema}.id))`;
    }).join('\n');
  }
  
  /**
   * Generate left joins for CTE many relations
   */
  private generateCTEJoins(
    manyRelations: SelectedRelation[],
    schemaImport: string,
    tableMetadata: TableMetadata
  ): string {
    if (manyRelations.length === 0) return '';
    
    const pkColumn = tableMetadata.columns.find((col) => col.isPrimary);
    if (!pkColumn) return '';
    
    return '\n' + manyRelations.map((relation) => {
      const cteName = `${relation.fieldName}Cte`;
      return `      .leftJoin(${cteName}, eq(${schemaImport}.${pkColumn.name}, ${cteName}.${schemaImport}${toPascalCase(pkColumn.name)}))`;
    }).join('\n');
  }
  
  /**
   * Get the foreign key field for a relation
   */
  private getRelationForeignKey(relation: SelectedRelation, tableMetadata: TableMetadata): string {
    // This is a simple heuristic - you may need to improve this based on your schema
    const pkColumn = tableMetadata.columns.find((col) => col.isPrimary);
    if (!pkColumn) return 'id';
    
    // For many relations, the foreign key is usually the singular form of the parent table + ID
    return `${toCamelCase(tableMetadata.tableName)}${toPascalCase(pkColumn.name)}`;
  }

  /**
   * Generate Update method
   */
  private generateUpdateMethod(tableMetadata: TableMetadata): string {
    const className = getClassName(tableMetadata.tableName);
    const schemaImport = toCamelCase(tableMetadata.tableName);
    const dtoParamName = `update${className}Dto`;
    const pkColumn = tableMetadata.columns.find((col) => col.isPrimary);

    if (!pkColumn) {
      throw new Error(`No primary key found for ${tableMetadata.tableName}`);
    }

    const selectColumns = Object.keys(tableMetadata.generalSelect)
      .map((key) => `          ${key}: ${schemaImport}.${key}`)
      .join(',\n');

    return `  async update(id: number, ${dtoParamName}: Update${className}Dto) {
    return this.db.transaction(async (tx) => {
      const result = await firstRow(
        tx
          .update(${schemaImport})
          .set(${dtoParamName})
          .where(eq(${schemaImport}.${pkColumn.name}, id))
          .returning({
${selectColumns}
          })
      );

      return result;
    });
  }`;
  }

  /**
   * Generate Delete method
   */
  private generateDeleteMethod(
    tableMetadata: TableMetadata,
    deleteType: DeleteType
  ): string {
    const schemaImport = toCamelCase(tableMetadata.tableName);
    const pkColumn = tableMetadata.columns.find((col) => col.isPrimary);

    if (!pkColumn) {
      throw new Error(`No primary key found for ${tableMetadata.tableName}`);
    }

    if (deleteType === 'replace' && tableMetadata.deleteReplace.replaceValues) {
      const replaceValues = Object.entries(tableMetadata.deleteReplace.replaceValues)
        .map(([key, value]) => `          ${key}: ${JSON.stringify(value)}`)
        .join(',\n');

      return `  async delete(id: number) {
    return this.db.transaction(async (tx) => {
      await tx
        .update(${schemaImport})
        .set({
${replaceValues}
        })
        .where(eq(${schemaImport}.${pkColumn.name}, id));

      return { success: true };
    });
  }`;
    }

    return `  async delete(id: number) {
    return this.db.transaction(async (tx) => {
      await tx
        .delete(${schemaImport})
        .where(eq(${schemaImport}.${pkColumn.name}, id));

      return { success: true };
    });
  }`;
  }

  /**
   * Generate CreateMany method
   */
  private generateCreateManyMethod(
    tableMetadata: TableMetadata,
    relations: SelectedRelation[]
  ): string {
    const className = getClassName(tableMetadata.tableName);
    const schemaImport = toCamelCase(tableMetadata.tableName);
    const dtoParamName = `create${className}Dtos`;

    return `  async createMany(${dtoParamName}: Create${className}Dto[]) {
    return this.db.transaction(async (tx) => {
      const results = await tx
        .insert(${schemaImport})
        .values(${dtoParamName})
        .returning();

      return results;
    });
  }`;
  }

  /**
   * Generate UpdateMany method
   */
  private generateUpdateManyMethod(tableMetadata: TableMetadata): string {
    const className = getClassName(tableMetadata.tableName);
    const schemaImport = toCamelCase(tableMetadata.tableName);
    const dtoParamName = `update${className}Dto`;
    const pkColumn = tableMetadata.columns.find((col) => col.isPrimary);

    if (!pkColumn) {
      throw new Error(`No primary key found for ${tableMetadata.tableName}`);
    }

    return `  async updateMany(ids: number[], ${dtoParamName}: Update${className}Dto) {
    return this.db.transaction(async (tx) => {
      const results = await tx
        .update(${schemaImport})
        .set(${dtoParamName})
        .where(inArray(${schemaImport}.${pkColumn.name}, ids))
        .returning();

      return results;
    });
  }`;
  }

  /**
   * Generate DeleteMany method
   */
  private generateDeleteManyMethod(
    tableMetadata: TableMetadata,
    deleteType: DeleteType
  ): string {
    const schemaImport = toCamelCase(tableMetadata.tableName);
    const pkColumn = tableMetadata.columns.find((col) => col.isPrimary);

    if (!pkColumn) {
      throw new Error(`No primary key found for ${tableMetadata.tableName}`);
    }

    if (deleteType === 'replace' && tableMetadata.deleteReplace.replaceValues) {
      const replaceValues = Object.entries(tableMetadata.deleteReplace.replaceValues)
        .map(([key, value]) => `          ${key}: ${JSON.stringify(value)}`)
        .join(',\n');

      return `  async deleteMany(ids: number[]) {
    return this.db.transaction(async (tx) => {
      await tx
        .update(${schemaImport})
        .set({
${replaceValues}
        })
        .where(inArray(${schemaImport}.${pkColumn.name}, ids));

      return { success: true, count: ids.length };
    });
  }`;
    }

    return `  async deleteMany(ids: number[]) {
    return this.db.transaction(async (tx) => {
      await tx
        .delete(${schemaImport})
        .where(inArray(${schemaImport}.${pkColumn.name}, ids));

      return { success: true, count: ids.length };
    });
  }`;
  }
}

