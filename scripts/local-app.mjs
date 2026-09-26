#!/usr/bin/env node
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {calculateLocalDay,listLocalProfiles,LOCAL_VERSION} from '../core/local/index.mjs';
import {calculateLocalSchedule} from '../core/local/schedule.mjs';

const assets=new Map([
  ['/', ['index.html','text/html; charset=utf-8']],
  ['/app.mjs',['app.mjs','text/javascript; charset=utf-8']],
  ['/style.css',['style.css','text/css; charset=utf-8']],
]);
function respond(res,status,value,type='application/json; charset=utf-8'){
  res.writeHead(status,{'content-type':type,'cache-control':'no-store','x-content-type-options':'nosniff',
    'content-security-policy':"default-src 'self'; connect-src 'self'; style-src 'self'; script-src 'self'; img-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'none'",
    'referrer-policy':'no-referrer','permissions-policy':'geolocation=(self)'});
  res.end(type.startsWith('application/json')?JSON.stringify(value):value);
}
async function input(req){
  if(req.headers['content-type']!=='application/json')throw new TypeError('Expected application/json');
  let size=0;const chunks=[];
  for await(const chunk of req){size+=chunk.length;if(size>16384)throw new RangeError('Request is too large');chunks.push(chunk);}
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
/** Loopback-only demo; exposes no filesystem route, telemetry or prayer-data service. */
export function createLocalAppServer(){
  return createServer(async(req,res)=>{
    const address=req.socket.localAddress;
    const host=`127.0.0.1:${req.socket.localPort}`;
    if(!['127.0.0.1','::ffff:127.0.0.1'].includes(address)||req.headers.host!==host
      ||(req.headers.origin&&req.headers.origin!==`http://${host}`))return respond(res,403,{error:'Open the app using its printed local URL.'});
    try{
      if(req.method==='GET'&&assets.has(req.url)){
        const [name,type]=assets.get(req.url);
        return respond(res,200,await readFile(new URL(`../examples/local-app/${name}`,import.meta.url)),type);
      }
      if(req.method==='GET'&&req.url==='/api/profiles')return respond(res,200,{version:LOCAL_VERSION,profiles:listLocalProfiles(),runtime:{node:process.versions.node,tzdb:process.versions.tz}});
      if(req.method==='POST'&&req.url==='/api/calculate'){
        const point=await input(req);
        const day=calculateLocalDay(point);
        // Include the preceding solar day: its Isha may fall after midnight on
        // the displayed day and must not disappear from next-start selection.
        const previous=new Date(Date.parse(`${point.date}T00:00:00Z`)-86400000).toISOString().slice(0,10);
        const padded=previous>='2001-01-01';
        const schedule=calculateLocalSchedule({startDate:padded?previous:point.date,dayCount:padded?8:7,latitude:point.latitude,longitude:point.longitude,timeZone:point.timeZone,profile:point.profile});
        return respond(res,200,{day,schedule,displayRange:{startDate:point.date,dayCount:7,precedingSolarDayIncluded:padded},runtime:{node:process.versions.node,tzdb:process.versions.tz}});
      }
      return respond(res,404,{error:'Unknown local route'});
    }catch(error){return respond(res,400,{error:error instanceof Error?error.message:'Calculation failed'});}
  });
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const port=Number(process.env.NAMAZ_LOCAL_PORT??4377);
  if(!Number.isInteger(port)||port<1024||port>65535)throw new RangeError('NAMAZ_LOCAL_PORT must be an integer from 1024 through 65535');
  const server=createLocalAppServer();
  server.on('error',error=>{console.error(error.message);process.exitCode=1;});
  server.listen(port,'127.0.0.1',()=>console.log(`Local prayer calculator: http://127.0.0.1:${port}\nNo external prayer API. Stop with Ctrl+C.`));
}
