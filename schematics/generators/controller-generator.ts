import { TableMetadata } from '../utils/schema-inspector';
import { EndpointType } from '../endpoint/prompts';
import { getClassName, getModuleName } from '../utils/string-utils';

export class ControllerGenerator {
  /**
   * Generate controller class
   */
  generateController(
    tableMetadata: TableMetadata,
    endpoints: Array<{
      type: EndpointType;
      isPublic?: boolean;
    }>
  ): string {
    const className = getClassName(tableMetadata.tableName);
    const controllerName = `${className}Controller`;
    const serviceName = `${className}Service`;
    const moduleName = getModuleName(tableMetadata.tableName);

    const imports = this.generateImports(tableMetadata, endpoints);
    const methods: string[] = [];

    for (const endpoint of endpoints) {
      const method = this.generateMethod(tableMetadata, endpoint);
      if (method) {
        methods.push(method);
      }
    }

    return `${imports}

@Controller('${moduleName}')
export class ${controllerName} {
  constructor(private readonly service: ${serviceName}) {}

${methods.join('\n\n')}
}
`;
  }

  /**
   * Generate imports
   */
  private generateImports(
    tableMetadata: TableMetadata,
    endpoints: Array<{ type: EndpointType; isPublic?: boolean }>
  ): string {
    const imports: string[] = [];
    const decorators = new Set<string>(['Controller']);
    const className = getClassName(tableMetadata.tableName);

    // Determine which HTTP method decorators are needed
    for (const endpoint of endpoints) {
      switch (endpoint.type) {
        case 'create':
        case 'createMany':
          decorators.add('Post');
          decorators.add('Body');
          break;
        case 'read':
          decorators.add('Get');
          decorators.add('Param');
          break;
        case 'readMany':
          decorators.add('Get');
          break;
        case 'update':
        case 'updateMany':
          decorators.add('Patch');
          decorators.add('Body');
          decorators.add('Param');
          break;
        case 'delete':
        case 'deleteMany':
          decorators.add('Delete');
          decorators.add('Param');
          break;
      }

      if (endpoint.isPublic) {
        // Add Public decorator import
      }
    }

    imports.push(`import { ${Array.from(decorators).join(', ')} } from '@nestjs/common';`);
    imports.push(`import { ${className}Service } from './${tableMetadata.tableName}.service';`);

    // Add DTO imports
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

    // Add pagination imports for readMany
    if (endpoints.some((e) => e.type === 'readMany')) {
      imports.push(`import { PaginatedQuery, PaginatedQueryResult } from '@common/pagination';`);
    }

    // Add Public decorator if any endpoint is public
    if (endpoints.some((e) => e.isPublic)) {
      imports.push(`import { Public } from '@common/decorators/public.decorator';`);
    }

    return imports.join('\n');
  }

  /**
   * Generate method based on endpoint type
   */
  private generateMethod(
    tableMetadata: TableMetadata,
    endpoint: { type: EndpointType; isPublic?: boolean }
  ): string {
    const publicDecorator = endpoint.isPublic ? '  @Public()\n' : '';

    switch (endpoint.type) {
      case 'create':
        return this.generateCreateMethod(tableMetadata, publicDecorator);
      case 'read':
        return this.generateReadMethod(tableMetadata, publicDecorator);
      case 'readMany':
        return this.generateReadManyMethod(tableMetadata, publicDecorator);
      case 'update':
        return this.generateUpdateMethod(tableMetadata, publicDecorator);
      case 'delete':
        return this.generateDeleteMethod(tableMetadata, publicDecorator);
      case 'createMany':
        return this.generateCreateManyMethod(tableMetadata, publicDecorator);
      case 'updateMany':
        return this.generateUpdateManyMethod(tableMetadata, publicDecorator);
      case 'deleteMany':
        return this.generateDeleteManyMethod(tableMetadata, publicDecorator);
      default:
        return '';
    }
  }

  /**
   * Generate Create method
   */
  private generateCreateMethod(tableMetadata: TableMetadata, publicDecorator: string): string {
    const className = getClassName(tableMetadata.tableName);

    return `${publicDecorator}  @Post()
  async create(@Body() dto: Create${className}Dto) {
    return await this.service.create(dto);
  }`;
  }

  /**
   * Generate Read method
   */
  private generateReadMethod(tableMetadata: TableMetadata, publicDecorator: string): string {
    return `${publicDecorator}  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.service.findOne(+id);
  }`;
  }

  /**
   * Generate ReadMany method
   */
  private generateReadManyMethod(tableMetadata: TableMetadata, publicDecorator: string): string {
    const className = getClassName(tableMetadata.tableName);

    return `${publicDecorator}  @Get()
  async findAll(@PaginatedQuery(Find${className}sDto) queryInstructions: PaginatedQueryResult) {
    return await this.service.findAll(queryInstructions);
  }`;
  }

  /**
   * Generate Update method
   */
  private generateUpdateMethod(tableMetadata: TableMetadata, publicDecorator: string): string {
    const className = getClassName(tableMetadata.tableName);

    return `${publicDecorator}  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: Update${className}Dto) {
    return await this.service.update(+id, dto);
  }`;
  }

  /**
   * Generate Delete method
   */
  private generateDeleteMethod(tableMetadata: TableMetadata, publicDecorator: string): string {
    return `${publicDecorator}  @Delete(':id')
  async delete(@Param('id') id: string) {
    return await this.service.delete(+id);
  }`;
  }

  /**
   * Generate CreateMany method
   */
  private generateCreateManyMethod(tableMetadata: TableMetadata, publicDecorator: string): string {
    const className = getClassName(tableMetadata.tableName);

    return `${publicDecorator}  @Post('bulk')
  async createMany(@Body() dtos: Create${className}Dto[]) {
    return await this.service.createMany(dtos);
  }`;
  }

  /**
   * Generate UpdateMany method
   */
  private generateUpdateManyMethod(tableMetadata: TableMetadata, publicDecorator: string): string {
    const className = getClassName(tableMetadata.tableName);

    return `${publicDecorator}  @Patch('bulk')
  async updateMany(@Body() body: { ids: number[]; dto: Update${className}Dto }) {
    return await this.service.updateMany(body.ids, body.dto);
  }`;
  }

  /**
   * Generate DeleteMany method
   */
  private generateDeleteManyMethod(tableMetadata: TableMetadata, publicDecorator: string): string {
    return `${publicDecorator}  @Delete('bulk')
  async deleteMany(@Body() body: { ids: number[] }) {
    return await this.service.deleteMany(body.ids);
  }`;
  }
}

