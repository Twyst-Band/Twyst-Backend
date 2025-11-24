import { TableMetadata } from '../utils/schema-inspector';
import { EndpointType } from '../endpoint/prompts';
import { getClassName } from '../utils/string-utils';

export class ModuleGenerator {
  /**
   * Generate module class
   */
  generateModule(
    tableMetadata: TableMetadata,
    endpoints: Array<{ type: EndpointType }>,
    folderName: string,
    fileName: string
  ): string {
    const className = getClassName(tableMetadata.tableName);
    const moduleName = `${className}Module`;
    const controllerName = `${className}Controller`;
    const serviceName = `${className}Service`;

    const needsPagination = endpoints.some((e) => e.type === 'readMany');

    const imports = [
      `import { Module } from '@nestjs/common';`,
      `import { ${controllerName} } from './${fileName}.controller';`,
      `import { ${serviceName} } from './${fileName}.service';`
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
   * Generate app.module.ts update instructions
   */
  generateAppModuleUpdate(tableMetadata: TableMetadata, folderName: string, fileName: string): {
    importStatement: string;
    moduleName: string;
    moduleImportPath: string;
  } {
    const className = getClassName(tableMetadata.tableName);
    const moduleName = `${className}Module`;
    const moduleImportPath = `@modules/${folderName}/${fileName}.module`;

    return {
      importStatement: `import { ${moduleName} } from '${moduleImportPath}';`,
      moduleName,
      moduleImportPath
    };
  }
}

