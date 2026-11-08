import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const root=process.argv.includes('--dist') ? path.join(import.meta.dirname,'dist') : import.meta.dirname;
const port=Number(process.env.PORT||5173);
http.createServer(async(req,res)=>{
  try {
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const segments=pathname.split('/');
    if(segments.some(p=>p.startsWith('.')||p==='node_modules'))throw Error('private path');
    let file=path.resolve(root,'.'+pathname);
    if(!file.startsWith(root+path.sep)&&file!==root)throw Error('outside root');
    if(file===root)file=path.join(root,'index.html');
    const types={'.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.html':'text/html','.png':'image/png','.svg':'image/svg+xml','.ttf':'font/ttf'};
    res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');
    res.setHeader('Cache-Control','no-store');
    res.end(await readFile(file));
  }catch{res.statusCode=404;res.end('Not found');}
}).listen(port,'0.0.0.0',()=>console.log('Night Shift listening on all interfaces, port '+port));
