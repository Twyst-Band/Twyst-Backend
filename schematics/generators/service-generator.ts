import { TableMetadata } from '../utils/schema-inspector';
import { SelectedRelation, EndpointType, DeleteType } from '../endpoint/prompts';
import { getClassName, toCamelCase, getVariableName } from '../utils/string-utils';

export class ServiceGenerator {
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

    const imports = this.generateImports(tableMetadata, endpoints);
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
    endpoints: Array<{ type: EndpointType }>
  ): string {
    const imports: string[] = [];
    const schemaImport = toCamelCase(tableMetadata.tableName);

    imports.push(`import { Injectable } from '@nestjs/common';`);
    imports.push(`import { CommonService } from '@common/services/common.service';`);
    imports.push(`import { ${schemaImport} } from '@schema/${tableMetadata.tableName}';`);
    imports.push(`import { eq } from 'drizzle-orm';`);

    // Check if we need pagination imports
    if (endpoints.some((e) => e.type === 'readMany')) {
      imports.push(`import {
  CursorPaginatedResponse,
  OffsetPaginatedResponse,
  PaginatedQueryResult,
  PaginationService
} from '@common/pagination';`);
    }

    // Check if we need transaction support
    if (endpoints.some((e) => ['create', 'createMany'].includes(e.type))) {
      // Transaction support might be needed
    }

    // Add DTO imports
    const className = getClassName(tableMetadata.tableName);
    const dtoImports: string[] = [];

    for (const endpoint of endpoints) {
      if (['create', 'createMany'].includes(endpoint.type)) {
        dtoImports.push(`Create${className}Dto`);
      }
      if (['update', 'updateMany'].includes(endpoint.type)) {
        dtoImports.push(`Update${className}Dto`);
      }
      if (endpoint.type === 'readMany') {
        dtoImports.push(`Find${className}sDto`);
      }
    }

    if (dtoImports.length > 0) {
      const uniqueDtos = [...new Set(dtoImports)];
      imports.push(`import { ${uniqueDtos.join(', ')} } from './dto';`);
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
        return this.generateReadManyMethod(tableMetadata);
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
    const pkColumn = tableMetadata.columns.find((col) => col.isPrimary);

    if (!pkColumn) {
      throw new Error(`No primary key found for ${tableMetadata.tableName}`);
    }

    const selectColumns = Object.keys(tableMetadata.generalSelect)
      .map((key) => `      ${key}: ${schemaImport}.${key}`)
      .join(',\n');

    if (relations.length === 0) {
      // Simple create without relations
      return `  async create(dto: Create${className}Dto) {
    const [result] = await this.db
      .insert(${schemaImport})
      .values(dto)
      .returning({
${selectColumns}
      });

    return result;
  }`;
    }

    // Create with relations (using transaction)
    return `  async create(dto: Create${className}Dto) {
    return await this.db.transaction(async (tx) => {
      // Insert main record
      const [${variableName}] = await tx
        .insert(${schemaImport})
        .values({
          ...dto,
          // Remove relation fields from main insert
          ${relations.map((r) => `${r.fieldName}: undefined`).join(',\n          ')}
        })
        .returning({
${selectColumns}
        });

      ${this.generateRelationInserts(relations, variableName, pkColumn.name)}

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
    parentIdField: string
  ): string {
    const inserts: string[] = [];

    for (const relation of relations) {
      const relatedSchemaImport = toCamelCase(relation.referencedTableName);

      if (relation.type === 'many') {
        if (relation.skipJunctionTable) {
          // Insert junction table records directly
          inserts.push(`      // Insert ${relation.fieldName}
      if (dto.${relation.fieldName} && dto.${relation.fieldName}.length > 0) {
        await tx.insert(${relatedSchemaImport}).values(
          dto.${relation.fieldName}.map((id) => ({
            ${parentIdField}: ${parentVariable}.${parentIdField},
            // Add other junction table fields
          }))
        );
      }`);
        } else {
          inserts.push(`      // Insert ${relation.fieldName}
      if (dto.${relation.fieldName} && dto.${relation.fieldName}.length > 0) {
        await tx.insert(${relatedSchemaImport}).values(
          dto.${relation.fieldName}.map((item) => ({
            ...item,
            // Link to parent
          }))
        );
      }`);
        }
      }
    }

    return inserts.join('\n\n');
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
    return await this.query.${schemaImport}.findFirst({
      where: eq(${schemaImport}.${pkColumn.name}, id),
      columns: {
${selectColumns}
      }
    });
  }`;
    }

    const withRelations = this.generateWithRelations(relations);

    return `  async findOne(id: number) {
    return await this.query.${schemaImport}.findFirst({
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
  private generateReadManyMethod(tableMetadata: TableMetadata): string {
    const className = getClassName(tableMetadata.tableName);
    const schemaImport = toCamelCase(tableMetadata.tableName);

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

  /**
   * Generate Update method
   */
  private generateUpdateMethod(tableMetadata: TableMetadata): string {
    const className = getClassName(tableMetadata.tableName);
    const schemaImport = toCamelCase(tableMetadata.tableName);
    const pkColumn = tableMetadata.columns.find((col) => col.isPrimary);

    if (!pkColumn) {
      throw new Error(`No primary key found for ${tableMetadata.tableName}`);
    }

    const selectColumns = Object.keys(tableMetadata.generalSelect)
      .map((key) => `        ${key}: ${schemaImport}.${key}`)
      .join(',\n');

    return `  async update(id: number, dto: Update${className}Dto) {
    const [result] = await this.db
      .update(${schemaImport})
      .set(dto)
      .where(eq(${schemaImport}.${pkColumn.name}, id))
      .returning({
${selectColumns}
      });

    return result;
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
        .map(([key, value]) => `        ${key}: ${JSON.stringify(value)}`)
        .join(',\n');

      return `  async delete(id: number) {
    await this.db
      .update(${schemaImport})
      .set({
${replaceValues}
      })
      .where(eq(${schemaImport}.${pkColumn.name}, id));

    return { success: true };
  }`;
    }

    return `  async delete(id: number) {
    await this.db
      .delete(${schemaImport})
      .where(eq(${schemaImport}.${pkColumn.name}, id));

    return { success: true };
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

    return `  async createMany(dtos: Create${className}Dto[]) {
    const results = await this.db
      .insert(${schemaImport})
      .values(dtos)
      .returning();

    return results;
  }`;
  }

  /**
   * Generate UpdateMany method
   */
  private generateUpdateManyMethod(tableMetadata: TableMetadata): string {
    const className = getClassName(tableMetadata.tableName);
    const schemaImport = toCamelCase(tableMetadata.tableName);
    const pkColumn = tableMetadata.columns.find((col) => col.isPrimary);

    if (!pkColumn) {
      throw new Error(`No primary key found for ${tableMetadata.tableName}`);
    }

    return `  async updateMany(ids: number[], dto: Update${className}Dto) {
    const results = await this.db
      .update(${schemaImport})
      .set(dto)
      .where(inArray(${schemaImport}.${pkColumn.name}, ids))
      .returning();

    return results;
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
        .map(([key, value]) => `        ${key}: ${JSON.stringify(value)}`)
        .join(',\n');

      return `  async deleteMany(ids: number[]) {
    await this.db
      .update(${schemaImport})
      .set({
${replaceValues}
      })
      .where(inArray(${schemaImport}.${pkColumn.name}, ids));

    return { success: true, count: ids.length };
  }`;
    }

    return `  async deleteMany(ids: number[]) {
    await this.db
      .delete(${schemaImport})
      .where(inArray(${schemaImport}.${pkColumn.name}, ids));

    return { success: true, count: ids.length };
  }`;
  }
}

