import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const root=import.meta.dirname;
http.createServer(async(req,res)=>{try{const p=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!p.startsWith(root+path.sep)&&p!==root)throw Error();const file=p===root?path.join(root,'index.html'):p;res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(await readFile(file));}catch{res.statusCode=404;res.end('Not found');}}).listen(5173,'127.0.0.1',()=>console.log('http://localhost:5173'));
