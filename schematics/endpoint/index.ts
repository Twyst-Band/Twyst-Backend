import {
  Rule,
  SchematicContext,
  Tree,
  apply,
  applyTemplates,
  chain,
  mergeWith,
  move,
  url
} from '@angular-devkit/schematics';
import { strings } from '@angular-devkit/core';
import * as path from 'path';
import { EndpointOptions } from './schema';
import { SchemaInspector, TableMetadata } from '../utils/schema-inspector';
import { EndpointPrompts, EndpointConfig, EndpointType } from './prompts';
import { DtoGenerator } from '../generators/dto-generator';
import { ServiceGenerator } from '../generators/service-generator';
import { ControllerGenerator } from '../generators/controller-generator';
import { ModuleGenerator } from '../generators/module-generator';
import { getClassName, getModuleName, getFolderName, getFileName } from '../utils/string-utils';
import { ImportManager } from '../utils/import-manager';

export function endpoint(options: EndpointOptions): Rule {
  return async (tree: Tree, context: SchematicContext) => {
    context.logger.info('🚀 Starting endpoint generation...');

    try {
      // Get project root
      const projectRoot = process.cwd();

      // Initialize inspector and prompts
      const inspector = new SchemaInspector(projectRoot);
      const prompts = new EndpointPrompts(inspector);

      // Run interactive prompts
      context.logger.info('📋 Starting interactive prompts...');
      const config = await prompts.promptForEndpointConfig();

      // Generate files
      context.logger.info(`✨ Generating endpoint for table: ${config.tableName}`);
      await generateEndpoint(tree, context, config, options, inspector);

      context.logger.info('✅ Endpoint generation completed successfully!');
      return tree;
    } catch (error: any) {
      context.logger.error(`❌ Error generating endpoint: ${error.message}`);
      throw error;
    }
  };
}

async function generateEndpoint(
  tree: Tree,
  context: SchematicContext,
  config: EndpointConfig,
  options: EndpointOptions,
  inspector: SchemaInspector
): Promise<void> {
  const className = getClassName(config.tableName);
  const moduleName = getModuleName(config.tableName); // For route path (plural)
  const folderName = getFolderName(config.tableName); // For folder name (singular)
  const fileName = getFileName(config.tableName); // For file names (singular)
  const modulePath = options.path || 'src/modules';
  const fullPath = path.join(modulePath, folderName);

  // Check if module directory exists, create if not
  if (!tree.exists(fullPath)) {
    context.logger.info(`📁 Creating module directory: ${fullPath}`);
  }

  // Initialize generators
  const dtoGenerator = new DtoGenerator();
  const serviceGenerator = new ServiceGenerator(inspector);
  const controllerGenerator = new ControllerGenerator();
  const moduleGenerator = new ModuleGenerator();

  // Prepare endpoint info
  const endpointInfo = {
    type: config.endpointType,
    relations: config.relations,
    deleteType: config.deleteType,
    isPublic: config.isPublic
  };

  // Generate DTOs
  context.logger.info('📝 Generating DTOs...');
  await generateDtos(tree, config, dtoGenerator, fullPath);

  // Generate Service
  context.logger.info('⚙️  Generating service...');
  const servicePath = path.join(fullPath, `${fileName}.service.ts`);
  
  if (tree.exists(servicePath)) {
    // Merge with existing service
    context.logger.info(`Service exists. Adding new method...`);
    const existingContent = tree.read(servicePath)?.toString('utf-8') || '';
    const newServiceContent = serviceGenerator.generateService(config.tableMetadata, [endpointInfo]);
    const mergedContent = mergeServiceMethod(existingContent, newServiceContent, config.endpointType, config.endpointType);
    tree.overwrite(servicePath, mergedContent);
  } else {
    const serviceContent = serviceGenerator.generateService(config.tableMetadata, [endpointInfo]);
    tree.create(servicePath, serviceContent);
  }

  // Generate Controller
  context.logger.info('🎮 Generating controller...');
  const controllerPath = path.join(fullPath, `${fileName}.controller.ts`);
  
  if (tree.exists(controllerPath)) {
    // Merge with existing controller
    context.logger.info(`Controller exists. Adding new method...`);
    const existingContent = tree.read(controllerPath)?.toString('utf-8') || '';
    const newMethod = controllerGenerator.generateController(config.tableMetadata, [endpointInfo]);
    const mergedContent = mergeControllerMethod(existingContent, newMethod, config.endpointType);
    tree.overwrite(controllerPath, mergedContent);
  } else {
    const controllerContent = controllerGenerator.generateController(config.tableMetadata, [
      endpointInfo
    ]);
    tree.create(controllerPath, controllerContent);
  }

  // Generate Module
  context.logger.info('📦 Generating module...');
  const moduleContent = moduleGenerator.generateModule(config.tableMetadata, [endpointInfo], folderName, fileName);
  const moduleFilePath = path.join(fullPath, `${fileName}.module.ts`);
  
  if (tree.exists(moduleFilePath)) {
    context.logger.warn(`Module already exists at ${moduleFilePath}. Skipping...`);
  } else {
    tree.create(moduleFilePath, moduleContent);
  }

  // Update app.module.ts
  if (!options.skipImport) {
    context.logger.info('🔧 Updating app.module.ts...');
    updateAppModule(tree, context, config.tableMetadata, moduleGenerator, folderName, fileName);
  }
}

async function generateDtos(
  tree: Tree,
  config: EndpointConfig,
  dtoGenerator: DtoGenerator,
  modulePath: string
): Promise<void> {
  const dtoPath = path.join(modulePath, 'dto');

  // Ensure dto directory exists
  if (!tree.exists(dtoPath)) {
    // Directory will be created when we create files
  }

  const className = getClassName(config.tableName);
  const singularName = className.toLowerCase(); // className is already singular

  // Generate based on endpoint type
  switch (config.endpointType) {
    case 'create':
    case 'createMany':
      const createDto = dtoGenerator.generateCreateDto(config.tableMetadata, config.relations);
      const createDtoPath = path.join(dtoPath, `create-${singularName}.dto.ts`);
      if (!tree.exists(createDtoPath)) {
        tree.create(createDtoPath, createDto);
      }
      break;

    case 'update':
    case 'updateMany':
      const updateDto = dtoGenerator.generateUpdateDto(config.tableMetadata);
      const updateDtoPath = path.join(dtoPath, `update-${singularName}.dto.ts`);
      if (!tree.exists(updateDtoPath)) {
        tree.create(updateDtoPath, updateDto);
      }
      break;

    case 'read':
      const readDto = dtoGenerator.generateReadDto(config.tableMetadata);
      const readDtoPath = path.join(dtoPath, `find-${singularName}.dto.ts`);
      if (!tree.exists(readDtoPath)) {
        tree.create(readDtoPath, readDto);
      }
      break;

    case 'readMany':
      const readManyDto = dtoGenerator.generateReadManyDto(
        config.tableMetadata,
        config.paginationType
      );
      const readManyDtoPath = path.join(dtoPath, `find-${singularName}s.dto.ts`);
      if (!tree.exists(readManyDtoPath)) {
        tree.create(readManyDtoPath, readManyDto);
      }
      break;
  }
}

function updateAppModule(
  tree: Tree,
  context: SchematicContext,
  tableMetadata: TableMetadata,
  moduleGenerator: ModuleGenerator,
  folderName: string,
  fileName: string
): void {
  const appModulePath = 'src/app.module.ts';

  if (!tree.exists(appModulePath)) {
    context.logger.warn('app.module.ts not found. Skipping import...');
    return;
  }

  const content = tree.read(appModulePath)?.toString('utf-8');
  if (!content) {
    context.logger.warn('Could not read app.module.ts. Skipping import...');
    return;
  }

  const { importStatement, moduleName } = moduleGenerator.generateAppModuleUpdate(tableMetadata, folderName, fileName);

  // Check if module is already imported
  if (content.includes(moduleName)) {
    context.logger.info(`${moduleName} is already imported in app.module.ts`);
    return;
  }

  // Find the last import statement
  const importLines = content.split('\n').filter((line) => line.trim().startsWith('import'));
  const lastImportIndex = content.lastIndexOf(importLines[importLines.length - 1]) + importLines[importLines.length - 1].length;

  // Insert new import
  const beforeImport = content.substring(0, lastImportIndex);
  const afterImport = content.substring(lastImportIndex);
  let newContent = beforeImport + '\n' + importStatement + afterImport;

  // Find the imports array in @Module decorator
  const importsMatch = newContent.match(/imports:\s*\[([\s\S]*?)\]/);
  if (importsMatch) {
    const importsArray = importsMatch[1];
    const lastImportInArray = importsArray.trim().split(',').pop()?.trim() || '';
    
    // Add new module to imports array
    const newImportsArray = importsArray.trim()
      ? `${importsArray.trim()},\n    ${moduleName}`
      : `\n    ${moduleName}\n  `;
    
    newContent = newContent.replace(
      /imports:\s*\[([\s\S]*?)\]/,
      `imports: [${newImportsArray}]`
    );
  }

  tree.overwrite(appModulePath, newContent);
  context.logger.info(`✅ Added ${moduleName} to app.module.ts`);
}

function mergeServiceMethod(
  existingContent: string,
  newServiceContent: string,
  endpointType: EndpointType,
  newEndpointType: EndpointType
): string {
  // Extract the new method from the generated service
  const methodMatch = newServiceContent.match(/async\s+\w+\([^)]*\)[^{]*{[\s\S]*?^\s\s}/m);
  
  if (!methodMatch) {
    return existingContent;
  }

  const newMethod = methodMatch[0];
  
  // Merge imports using ts-morph (automatically handles duplicates and unused imports)
  let updatedContent = ImportManager.mergeImports(existingContent, newServiceContent);
  
  // Check if we need to update constructor for PaginationService
  if (newEndpointType === 'readMany' && !updatedContent.includes('PaginationService')) {
    // Check if constructor needs PaginationService
    const constructorMatch = updatedContent.match(/constructor\([^)]*\)/);
    if (constructorMatch && !constructorMatch[0].includes('PaginationService')) {
      // Update constructor to include PaginationService
      const newConstructor = constructorMatch[0].replace(
        /constructor\(([^)]*)\)/,
        'constructor(private readonly paginationService: PaginationService$1)'
      );
      updatedContent = updatedContent.replace(constructorMatch[0], newConstructor);
    } else if (!constructorMatch) {
      // No constructor, add one
      const classMatch = updatedContent.match(/export\s+class\s+\w+\s+extends\s+CommonService\s*{/);
      if (classMatch) {
        const classEndIndex = updatedContent.indexOf('{', updatedContent.indexOf(classMatch[0])) + 1;
        const beforeClassBody = updatedContent.substring(0, classEndIndex);
        const afterClassBody = updatedContent.substring(classEndIndex);
        updatedContent = beforeClassBody + '\n  constructor(private readonly paginationService: PaginationService) {\n    super();\n  }\n' + afterClassBody;
      }
    }
  }
  
  // Find the last method in the existing service (before the closing brace)
  const lastBraceIndex = updatedContent.lastIndexOf('}');
  const beforeLastBrace = updatedContent.substring(0, lastBraceIndex);
  const afterLastBrace = updatedContent.substring(lastBraceIndex);

  // Insert the new method before the closing brace
  return `${beforeLastBrace}\n\n  ${newMethod}\n${afterLastBrace}`;
}

function mergeControllerMethod(
  existingContent: string,
  newControllerContent: string,
  endpointType: EndpointType
): string {
  // Extract the new method from the generated controller
  const methodMatch = newControllerContent.match(/(@Public\(\))?\s*@(Get|Post|Patch|Delete)[\s\S]*?async\s+\w+\([^)]*\)[^{]*{[\s\S]*?^\s\s}/m);
  
  if (!methodMatch) {
    return existingContent;
  }

  const newMethod = methodMatch[0];
  
  // Merge imports using ts-morph (automatically handles duplicates and unused imports)
  let updatedContent = ImportManager.mergeImports(existingContent, newControllerContent);
  
  // Find the last method in the existing controller (before the closing brace)
  const lastBraceIndex = updatedContent.lastIndexOf('}');
  const beforeLastBrace = updatedContent.substring(0, lastBraceIndex);
  const afterLastBrace = updatedContent.substring(lastBraceIndex);

  // Insert the new method before the closing brace
  return `${beforeLastBrace}\n\n  ${newMethod}\n${afterLastBrace}`;
}
