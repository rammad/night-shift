import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
const root = path.resolve(import.meta.dirname, '..');
const out = path.resolve(root, 'dist');
if (path.dirname(out) !== root || path.basename(out) !== 'dist') throw Error('Unsafe build directory');
try { await fs.access(path.join(root,'vendor/little.mjs')); }
catch { throw Error('Missing Little SDK. Run npm ci and npm run setup:sdk first; see README.md section 1.'); }
console.log('Building only in ' + out);
await fs.rm(out, { recursive:true, force:true });
await fs.mkdir(out, { recursive:true });
// Explicit runtime allowlist: no git data, credentials, debug output, old assets or tools.
const files = [];
async function copy(relative) {
  const source = path.join(root, relative), stat = await fs.lstat(source);
  if (stat.isSymbolicLink()) throw Error('Build refuses symlinks: ' + relative);
  if (stat.isDirectory()) {
    for (const name of (await fs.readdir(source)).sort()) await copy(path.join(relative, name));
  } else {
    const dest = path.join(out, relative);
    await fs.mkdir(path.dirname(dest), {recursive:true});
    await fs.copyFile(source, dest);
    const data = await fs.readFile(dest);
    files.push({ path:relative.replaceAll('\\','/'), bytes:data.length, sha256:createHash('sha256').update(data).digest('hex') });
  }
}
for (const file of ['index.html','style.css','little-bridge.js','src','assets','vendor/little.mjs','little/manifest.json']) await copy(file);
const pkg = JSON.parse(await fs.readFile(path.join(root,'package.json'),'utf8'));
await fs.writeFile(path.join(out,'build-info.json'),JSON.stringify({name:pkg.name,version:pkg.version,files},null,2)+'\n');
console.log(`Built ${files.length} runtime files. Serve dist/ at an HTTPS origin.`);
