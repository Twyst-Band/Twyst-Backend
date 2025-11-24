import { Project, SourceFile, SyntaxKind } from 'ts-morph';

/**
 * Utility class for managing imports using ts-morph
 */
export class ImportManager {
  /**
   * Merge imports from new content into existing content
   * Automatically handles duplicates and organizes imports
   */
  static mergeImports(existingContent: string, newContent: string): string {
    const project = new Project({
      useInMemoryFileSystem: true,
      compilerOptions: {
        target: 99, // ESNext
        module: 1, // CommonJS
      }
    });

    // Create source files
    const existingFile = project.createSourceFile('existing.ts', existingContent);
    const newFile = project.createSourceFile('new.ts', newContent);

    // Get all import declarations from new file
    const newImports = newFile.getImportDeclarations();

    for (const newImport of newImports) {
      const moduleSpecifier = newImport.getModuleSpecifierValue();
      const existingImport = existingFile.getImportDeclaration(
        (imp) => imp.getModuleSpecifierValue() === moduleSpecifier
      );

      if (existingImport) {
        // Module already imported, merge named imports
        this.mergeNamedImports(existingImport, newImport, existingFile);
      } else {
        // Module not imported yet, add the entire import
        const importText = newImport.getText();
        existingFile.addImportDeclaration({
          moduleSpecifier,
          namedImports: newImport.getNamedImports().map((ni) => ({
            name: ni.getName(),
            alias: ni.getAliasNode()?.getText()
          })),
          defaultImport: newImport.getDefaultImport()?.getText(),
          namespaceImport: newImport.getNamespaceImport()?.getText()
        });
      }
    }

    // Organize imports (removes duplicates, sorts, etc.)
    existingFile.organizeImports();

    return existingFile.getFullText();
  }

  /**
   * Merge named imports from newImport into existingImport
   */
  private static mergeNamedImports(
    existingImport: any,
    newImport: any,
    existingFile: SourceFile
  ): void {
    const existingNamedImports = existingImport.getNamedImports();
    const newNamedImports = newImport.getNamedImports();

    const existingNames = new Set(
      existingNamedImports.map((ni: any) => ni.getName())
    );

    for (const newNamedImport of newNamedImports) {
      const name = newNamedImport.getName();
      if (!existingNames.has(name)) {
        // Add the named import
        existingImport.addNamedImport(name);
      }
    }
  }

  /**
   * Add imports to a file, automatically merging with existing ones
   */
  static addImports(
    fileContent: string,
    importsToAdd: Array<{
      moduleSpecifier: string;
      namedImports?: string[];
      defaultImport?: string;
      namespaceImport?: string;
    }>
  ): string {
    const project = new Project({
      useInMemoryFileSystem: true,
      compilerOptions: {
        target: 99,
        module: 1,
      }
    });

    const file = project.createSourceFile('file.ts', fileContent);

    for (const importToAdd of importsToAdd) {
      const existingImport = file.getImportDeclaration(
        (imp) => imp.getModuleSpecifierValue() === importToAdd.moduleSpecifier
      );

      if (existingImport) {
        // Merge with existing import
        if (importToAdd.namedImports) {
          const existingNames = new Set(
            existingImport.getNamedImports().map((ni) => ni.getName())
          );

          for (const namedImport of importToAdd.namedImports) {
            if (!existingNames.has(namedImport)) {
              existingImport.addNamedImport(namedImport);
            }
          }
        }
      } else {
        // Add new import
        file.addImportDeclaration({
          moduleSpecifier: importToAdd.moduleSpecifier,
          namedImports: importToAdd.namedImports,
          defaultImport: importToAdd.defaultImport,
          namespaceImport: importToAdd.namespaceImport
        });
      }
    }

    // Organize imports
    file.organizeImports();

    return file.getFullText();
  }

  /**
   * Remove unused imports from a file
   */
  static removeUnusedImports(fileContent: string): string {
    const project = new Project({
      useInMemoryFileSystem: true,
      compilerOptions: {
        target: 99,
        module: 1,
      }
    });

    const file = project.createSourceFile('file.ts', fileContent);
    
    // Organize imports (this removes unused imports)
    file.organizeImports();

    return file.getFullText();
  }

  /**
   * Extract import information from content
   */
  static extractImports(content: string): Array<{
    moduleSpecifier: string;
    namedImports: string[];
    defaultImport?: string;
    namespaceImport?: string;
  }> {
    const project = new Project({
      useInMemoryFileSystem: true,
      compilerOptions: {
        target: 99,
        module: 1,
      }
    });

    const file = project.createSourceFile('file.ts', content);
    const imports = file.getImportDeclarations();

    return imports.map((imp) => ({
      moduleSpecifier: imp.getModuleSpecifierValue(),
      namedImports: imp.getNamedImports().map((ni) => ni.getName()),
      defaultImport: imp.getDefaultImport()?.getText(),
      namespaceImport: imp.getNamespaceImport()?.getText()
    }));
  }
}

