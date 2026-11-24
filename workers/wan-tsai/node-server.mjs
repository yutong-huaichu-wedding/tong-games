import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import app from './worker.js';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const port=Number(process.env.PORT||3000);
if(!Number.isInteger(port)||port<1||port>65535)throw Error('PORT 必須為 1～65535 的整數');
const env={CORS_ORIGINS:process.env.CORS_ORIGINS||''};
http.createServer(async(req,res)=>{try{
 const url=new URL(req.url||'/', 'http://'+(req.headers.host||'localhost:'+port));
 if(!['GET','HEAD','OPTIONS'].includes(req.method||'GET')){res.writeHead(405,{'Content-Type':'text/plain; charset=utf-8'});res.end('Method not allowed');return}
 if(url.pathname.endsWith('/config.js')){const text=await readFile(path.join(root,'config.js'));res.writeHead(200,{'Content-Type':'text/javascript; charset=utf-8','Cache-Control':'no-cache'});res.end(req.method==='HEAD'?undefined:text);return}
 const response=await app.fetch(new Request(url,{method:req.method,headers:req.headers}),env);
 res.writeHead(response.status,Object.fromEntries(response.headers));res.end(req.method==='HEAD'?undefined:Buffer.from(await response.arrayBuffer()));
}catch(error){console.error('Request failed:',error.message);res.writeHead(500,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify({error:'伺服器處理失敗，請檢查主機紀錄。'}));}}).listen(port,'0.0.0.0',()=>console.log('灣彩小鎮已啟動：http://localhost:'+port));
