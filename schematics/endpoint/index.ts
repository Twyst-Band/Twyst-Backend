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
import { EndpointPrompts, EndpointConfig } from './prompts';
import { DtoGenerator } from '../generators/dto-generator';
import { ServiceGenerator } from '../generators/service-generator';
import { ControllerGenerator } from '../generators/controller-generator';
import { ModuleGenerator } from '../generators/module-generator';
import { getClassName, getModuleName } from '../utils/string-utils';

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
      await generateEndpoint(tree, context, config, options);

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
  options: EndpointOptions
): Promise<void> {
  const className = getClassName(config.tableName);
  const moduleName = getModuleName(config.tableName);
  const modulePath = options.path || 'src/modules';
  const fullPath = path.join(modulePath, moduleName);

  // Check if module directory exists, create if not
  if (!tree.exists(fullPath)) {
    context.logger.info(`📁 Creating module directory: ${fullPath}`);
  }

  // Initialize generators
  const dtoGenerator = new DtoGenerator();
  const serviceGenerator = new ServiceGenerator();
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
  const serviceContent = serviceGenerator.generateService(config.tableMetadata, [endpointInfo]);
  const servicePath = path.join(fullPath, `${config.tableName}.service.ts`);
  
  if (tree.exists(servicePath)) {
    // TODO: Merge with existing service
    context.logger.warn(`Service already exists at ${servicePath}. Skipping...`);
  } else {
    tree.create(servicePath, serviceContent);
  }

  // Generate Controller
  context.logger.info('🎮 Generating controller...');
  const controllerContent = controllerGenerator.generateController(config.tableMetadata, [
    endpointInfo
  ]);
  const controllerPath = path.join(fullPath, `${config.tableName}.controller.ts`);
  
  if (tree.exists(controllerPath)) {
    // TODO: Merge with existing controller
    context.logger.warn(`Controller already exists at ${controllerPath}. Skipping...`);
  } else {
    tree.create(controllerPath, controllerContent);
  }

  // Generate Module
  context.logger.info('📦 Generating module...');
  const moduleContent = moduleGenerator.generateModule(config.tableMetadata, [endpointInfo]);
  const moduleFilePath = path.join(fullPath, `${config.tableName}.module.ts`);
  
  if (tree.exists(moduleFilePath)) {
    context.logger.warn(`Module already exists at ${moduleFilePath}. Skipping...`);
  } else {
    tree.create(moduleFilePath, moduleContent);
  }

  // Generate DTO index
  const dtoIndexContent = moduleGenerator.generateDtoIndex(config.tableMetadata, [endpointInfo]);
  const dtoIndexPath = path.join(fullPath, 'dto', 'index.ts');
  
  if (!tree.exists(dtoIndexPath)) {
    tree.create(dtoIndexPath, dtoIndexContent);
  }

  // Update app.module.ts
  if (!options.skipImport) {
    context.logger.info('🔧 Updating app.module.ts...');
    updateAppModule(tree, context, config.tableMetadata, moduleGenerator);
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

  // Generate based on endpoint type
  switch (config.endpointType) {
    case 'create':
    case 'createMany':
      const createDto = dtoGenerator.generateCreateDto(config.tableMetadata, config.relations);
      const createDtoPath = path.join(dtoPath, `create-${config.tableName}.dto.ts`);
      if (!tree.exists(createDtoPath)) {
        tree.create(createDtoPath, createDto);
      }
      break;

    case 'update':
    case 'updateMany':
      const updateDto = dtoGenerator.generateUpdateDto(config.tableMetadata);
      const updateDtoPath = path.join(dtoPath, `update-${config.tableName}.dto.ts`);
      if (!tree.exists(updateDtoPath)) {
        tree.create(updateDtoPath, updateDto);
      }
      break;

    case 'read':
      const readDto = dtoGenerator.generateReadDto(config.tableMetadata);
      const readDtoPath = path.join(dtoPath, `find-${config.tableName}.dto.ts`);
      if (!tree.exists(readDtoPath)) {
        tree.create(readDtoPath, readDto);
      }
      break;

    case 'readMany':
      const readManyDto = dtoGenerator.generateReadManyDto(
        config.tableMetadata,
        config.paginationType
      );
      const readManyDtoPath = path.join(dtoPath, `find-${config.tableName}s.dto.ts`);
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
  moduleGenerator: ModuleGenerator
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

  const { importStatement, moduleName } = moduleGenerator.generateAppModuleUpdate(tableMetadata);

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

