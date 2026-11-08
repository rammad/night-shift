// Dependency-free standard ZIP (stored entries); fixed timestamps make rebuilds reproducible.
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..'), dist=path.join(root,'dist');
const pkg=JSON.parse(await fs.readFile(path.join(root,'package.json'),'utf8'));
const entries=[];
async function walk(dir, prefix='') {
 for(const name of (await fs.readdir(dir)).sort()) {
  const p=path.join(dir,name), stat=await fs.lstat(p), rel=prefix+name;
  if(stat.isSymbolicLink()) throw Error('Symlinks are not package assets');
  if(stat.isDirectory()) await walk(p,rel+'/'); else entries.push({name:rel,data:await fs.readFile(p)});
 }
}
await walk(dist);
function crc32(bytes) { let c=0xffffffff; for(const b of bytes){ c^=b; for(let i=0;i<8;i++) c=(c>>>1)^((c&1)?0xedb88320:0); } return (c^0xffffffff)>>>0; }
const blocks=[],central=[];let offset=0;
for(const entry of entries) {
 const name=Buffer.from(entry.name), size=entry.data.length, crc=crc32(entry.data);
 const h=Buffer.alloc(30);h.writeUInt32LE(0x04034b50,0);h.writeUInt16LE(20,4);h.writeUInt16LE(0x800,6);h.writeUInt16LE(33,12);h.writeUInt32LE(crc,14);h.writeUInt32LE(size,18);h.writeUInt32LE(size,22);h.writeUInt16LE(name.length,26);
 const c=Buffer.alloc(46);c.writeUInt32LE(0x02014b50,0);c.writeUInt16LE(20,4);c.writeUInt16LE(20,6);c.writeUInt16LE(0x800,8);c.writeUInt16LE(33,14);c.writeUInt32LE(crc,16);c.writeUInt32LE(size,20);c.writeUInt32LE(size,24);c.writeUInt16LE(name.length,28);c.writeUInt32LE(offset,42);
 blocks.push(h,name,entry.data);central.push(c,name);offset+=h.length+name.length+size;
}
const directory=Buffer.concat(central), end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50,0);end.writeUInt16LE(entries.length,8);end.writeUInt16LE(entries.length,10);end.writeUInt32LE(directory.length,12);end.writeUInt32LE(offset,16);
const zip=Buffer.concat([...blocks,directory,end]);
const folder=path.join(root,'release');await fs.mkdir(folder,{recursive:true});
const name=`night-shift-${pkg.version}.zip`;
await fs.writeFile(path.join(folder,name),zip);
await fs.writeFile(path.join(folder,name+'.sha256'),createHash('sha256').update(zip).digest('hex')+'  '+name+'\n');
console.log(`Packaged ${entries.length} files: release/${name} (${zip.length} bytes)`);
