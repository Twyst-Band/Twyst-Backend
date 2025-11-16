import fs from 'fs';
import path from 'path';

const folder = path.resolve('./src/database/schema'); // your root folder
const outputFile = path.join(folder, 'index.ts');

function getAllFiles(dir: string, fileList: string[] = []) {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      getAllFiles(fullPath, fileList);
    } else if (file.endsWith('.ts') && file !== 'index.ts') {
      fileList.push(fullPath);
    }
  });
  return fileList;
}

function createBarrel() {
  const files = getAllFiles(folder);
  const exports = files
    .map((file) => {
      // Convert full path to relative path from folder
      const relPath =
        './' +
        path.relative(folder, file).replace(/\\/g, '/').replace(/\.ts$/, '');
      return `export * from '${relPath}';`;
    })
    .join('\n');

  fs.writeFileSync(outputFile, exports);
  console.log(`Barrel file generated at ${outputFile}`);
}

createBarrel();
