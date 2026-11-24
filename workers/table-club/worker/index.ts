import {POST as dice} from './game.ts';
import {POST as blackjack} from './blackjack.ts';
export interface Env{DB:D1Database;ASSETS?:Fetcher;ALLOWED_ORIGINS?:string}
export default {async fetch(request:Request,env:Env):Promise<Response>{
 const url=new URL(request.url),origin=request.headers.get('Origin');
 if(!url.pathname.startsWith('/api/'))return env.ASSETS?env.ASSETS.fetch(request):new Response('Not found',{status:404});
 const allowed=(env.ALLOWED_ORIGINS||'').split(',').map(s=>s.trim()).filter(Boolean);
 const ok=!origin||origin===url.origin||allowed.includes(origin);
 if(!ok)return Response.json({error:'這個網站尚未獲准連接遊戲後端，請設定 ALLOWED_ORIGINS。'},{status:403});
 const headers=new Headers({'Cache-Control':'no-store','Vary':'Origin','X-Content-Type-Options':'nosniff'});
 if(origin){headers.set('Access-Control-Allow-Origin',origin);headers.set('Access-Control-Allow-Methods','POST, OPTIONS');headers.set('Access-Control-Allow-Headers','Content-Type');headers.set('Access-Control-Max-Age','86400')}
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(url.pathname==='/api/health')return Response.json({ok:true,game:'table-club',version:'2.0.0'}, {headers});
 if(request.method!=='POST')return Response.json({error:'Method not allowed'},{status:405,headers});
 if(!request.headers.get('Content-Type')?.includes('application/json'))return Response.json({error:'請使用 JSON 格式'},{status:415,headers});
 let result:Response;
 if(url.pathname==='/api/game')result=await dice(request,env);
 else if(url.pathname==='/api/blackjack')result=await blackjack(request,env);
 else result=Response.json({error:'API not found'},{status:404});
 const out=new Response(result.body,result);for(const [key,value] of headers)out.headers.set(key,value);return out;
}};
