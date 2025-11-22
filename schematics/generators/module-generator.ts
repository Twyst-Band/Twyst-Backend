import { TableMetadata } from '../utils/schema-inspector';
import { EndpointType } from '../endpoint/prompts';
import { getClassName } from '../utils/string-utils';

export class ModuleGenerator {
  /**
   * Generate module class
   */
  generateModule(
    tableMetadata: TableMetadata,
    endpoints: Array<{ type: EndpointType }>
  ): string {
    const className = getClassName(tableMetadata.tableName);
    const moduleName = `${className}Module`;
    const controllerName = `${className}Controller`;
    const serviceName = `${className}Service`;

    const needsPagination = endpoints.some((e) => e.type === 'readMany');

    const imports = [
      `import { Module } from '@nestjs/common';`,
      `import { ${controllerName} } from './${tableMetadata.tableName}.controller';`,
      `import { ${serviceName} } from './${tableMetadata.tableName}.service';`
    ];

    if (needsPagination) {
      imports.push(`import { PaginationModule } from '@common/pagination';`);
    }

    const moduleImports = needsPagination ? `  imports: [PaginationModule],\n` : '';

    return `${imports.join('\n')}

@Module({
${moduleImports}  controllers: [${controllerName}],
  providers: [${serviceName}]
})
export class ${moduleName} {}
`;
  }

  /**
   * Generate DTO index file
   */
  generateDtoIndex(
    tableMetadata: TableMetadata,
    endpoints: Array<{ type: EndpointType }>
  ): string {
    const className = getClassName(tableMetadata.tableName);
    const exports: string[] = [];

    for (const endpoint of endpoints) {
      if (['create', 'createMany'].includes(endpoint.type)) {
        if (!exports.includes(`Create${className}Dto`)) {
          exports.push(`Create${className}Dto`);
        }
      }
      if (['update', 'updateMany'].includes(endpoint.type)) {
        if (!exports.includes(`Update${className}Dto`)) {
          exports.push(`Update${className}Dto`);
        }
      }
      if (endpoint.type === 'read') {
        if (!exports.includes(`Find${className}Dto`)) {
          exports.push(`Find${className}Dto`);
        }
      }
      if (endpoint.type === 'readMany') {
        if (!exports.includes(`Find${className}sDto`)) {
          exports.push(`Find${className}sDto`);
        }
      }
    }

    return exports.map((exp) => `export * from './${this.getDtoFileName(exp)}';`).join('\n') + '\n';
  }

  /**
   * Get DTO file name from class name
   */
  private getDtoFileName(className: string): string {
    // Convert CreatePostDto to create-post.dto
    return className
      .replace(/Dto$/, '')
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .toLowerCase() + '.dto';
  }

  /**
   * Generate app.module.ts update instructions
   */
  generateAppModuleUpdate(tableMetadata: TableMetadata): {
    importStatement: string;
    moduleName: string;
    moduleImportPath: string;
  } {
    const className = getClassName(tableMetadata.tableName);
    const moduleName = `${className}Module`;
    const moduleImportPath = `@modules/${tableMetadata.tableName}/${tableMetadata.tableName}.module`;

    return {
      importStatement: `import { ${moduleName} } from '${moduleImportPath}';`,
      moduleName,
      moduleImportPath
    };
  }
}

