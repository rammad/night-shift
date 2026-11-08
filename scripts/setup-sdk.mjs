import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const source=path.join(root,'node_modules/@kabletv/little-sdk/dist/little.mjs');
try {
 await fs.access(source);
 await fs.mkdir(path.join(root,'vendor'),{recursive:true});
 await fs.copyFile(source,path.join(root,'vendor/little.mjs'));
 console.log('Provisioned ignored vendor/little.mjs from installed SDK.');
} catch { throw Error('Install the private SDK first: authenticate GitHub Packages with read:packages, then npm ci. See README.md.'); }
