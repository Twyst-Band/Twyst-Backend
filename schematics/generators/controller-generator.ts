import { TableMetadata } from '../utils/schema-inspector';
import { EndpointType } from '../endpoint/prompts';
import { getClassName, getModuleName, getFileName } from '../utils/string-utils';

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
    const fileName = getFileName(tableMetadata.tableName);
    imports.push(`import { ${className}Service } from './${fileName}.service';`);

    // Add DTO imports - directly from files (singular form)
    const singularName = className.toLowerCase(); // className is already singular (Post, not Posts)
    
    for (const endpoint of endpoints) {
      if (['create', 'createMany'].includes(endpoint.type)) {
        imports.push(`import { Create${className}Dto } from './dto/create-${singularName}.dto';`);
      }
      if (['update', 'updateMany'].includes(endpoint.type)) {
        imports.push(`import { Update${className}Dto } from './dto/update-${singularName}.dto';`);
      }
      if (endpoint.type === 'readMany') {
        imports.push(`import { Find${className}sDto } from './dto/find-${singularName}s.dto';`);
      }
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
    const dtoParamName = `create${className}Dto`;

    return `${publicDecorator}  @Post()
  async create(@Body() ${dtoParamName}: Create${className}Dto) {
    return this.service.create(${dtoParamName});
  }`;
  }

  /**
   * Generate Read method
   */
  private generateReadMethod(tableMetadata: TableMetadata, publicDecorator: string): string {
    return `${publicDecorator}  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(+id);
  }`;
  }

  /**
   * Generate ReadMany method
   */
  private generateReadManyMethod(tableMetadata: TableMetadata, publicDecorator: string): string {
    const className = getClassName(tableMetadata.tableName);

    return `${publicDecorator}  @Get()
  async findAll(@PaginatedQuery(Find${className}sDto) queryInstructions: PaginatedQueryResult) {
    return this.service.findAll(queryInstructions);
  }`;
  }

  /**
   * Generate Update method
   */
  private generateUpdateMethod(tableMetadata: TableMetadata, publicDecorator: string): string {
    const className = getClassName(tableMetadata.tableName);
    const dtoParamName = `update${className}Dto`;

    return `${publicDecorator}  @Patch(':id')
  async update(@Param('id') id: string, @Body() ${dtoParamName}: Update${className}Dto) {
    return this.service.update(+id, ${dtoParamName});
  }`;
  }

  /**
   * Generate Delete method
   */
  private generateDeleteMethod(tableMetadata: TableMetadata, publicDecorator: string): string {
    return `${publicDecorator}  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.service.delete(+id);
  }`;
  }

  /**
   * Generate CreateMany method
   */
  private generateCreateManyMethod(tableMetadata: TableMetadata, publicDecorator: string): string {
    const className = getClassName(tableMetadata.tableName);
    const dtoParamName = `create${className}Dtos`;

    return `${publicDecorator}  @Post('bulk')
  async createMany(@Body() ${dtoParamName}: Create${className}Dto[]) {
    return this.service.createMany(${dtoParamName});
  }`;
  }

  /**
   * Generate UpdateMany method
   */
  private generateUpdateManyMethod(tableMetadata: TableMetadata, publicDecorator: string): string {
    const className = getClassName(tableMetadata.tableName);
    const dtoParamName = `update${className}Dto`;

    return `${publicDecorator}  @Patch('bulk')
  async updateMany(@Body() body: { ids: number[]; ${dtoParamName}: Update${className}Dto }) {
    return this.service.updateMany(body.ids, body.${dtoParamName});
  }`;
  }

  /**
   * Generate DeleteMany method
   */
  private generateDeleteManyMethod(tableMetadata: TableMetadata, publicDecorator: string): string {
    return `${publicDecorator}  @Delete('bulk')
  async deleteMany(@Body() body: { ids: number[] }) {
    return this.service.deleteMany(body.ids);
  }`;
  }
}

