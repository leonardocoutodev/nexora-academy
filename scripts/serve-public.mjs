import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve('public');
const port=Number(process.env.PORT||8787);
const host=process.env.HOST||'127.0.0.1';
const mime={
  '.html':'text/html; charset=utf-8',
  '.css':'text/css; charset=utf-8',
  '.js':'text/javascript; charset=utf-8',
  '.json':'application/json; charset=utf-8',
  '.webmanifest':'application/manifest+json; charset=utf-8',
  '.svg':'image/svg+xml',
  '.png':'image/png',
  '.jpg':'image/jpeg',
  '.jpeg':'image/jpeg',
  '.webp':'image/webp',
  '.ico':'image/x-icon',
  '.xml':'application/xml; charset=utf-8',
  '.txt':'text/plain; charset=utf-8'
};
const securityHeaders={
  'x-content-type-options':'nosniff',
  'referrer-policy':'strict-origin-when-cross-origin',
  'permissions-policy':'camera=(), microphone=(), geolocation=()',
  'x-frame-options':'SAMEORIGIN',
  'cache-control':'no-store, max-age=0, must-revalidate'
};

function send(res,status,body,headers={}){
  res.writeHead(status,{...securityHeaders,...headers});
  res.end(body);
}

async function resolveFile(pathname){
  let decoded;
  try{decoded=decodeURIComponent(pathname)}catch{return null}
  let rel=decoded.replace(/^\/+/, '');
  if(!rel)rel='index.html';
  else if(decoded.endsWith('/'))rel=rel+'index.html';
  let file=path.resolve(root,rel);
  if(file!==root&&!file.startsWith(root+path.sep))return null;
  try{
    const stat=await fs.stat(file);
    if(stat.isDirectory())file=path.join(file,'index.html');
    return file;
  }catch{
    if(!path.extname(file)){
      const htmlFile=file+'.html';
      try{await fs.access(htmlFile);return htmlFile}catch{}
    }
    return null;
  }
}

const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url||'/',`http://${host}:${port}`);
  if(url.pathname==='/api/health'){
    return send(res,200,JSON.stringify({ok:true,service:'lc-static-qa'}),{'content-type':'application/json; charset=utf-8'});
  }
  if(!['GET','HEAD'].includes(req.method||'GET'))return send(res,405,'Method Not Allowed',{'content-type':'text/plain; charset=utf-8'});
  const file=await resolveFile(url.pathname);
  if(!file)return send(res,404,'Not Found',{'content-type':'text/plain; charset=utf-8'});
  try{
    const body=await fs.readFile(file);
    const headers={'content-type':mime[path.extname(file).toLowerCase()]||'application/octet-stream'};
    res.writeHead(200,{...securityHeaders,...headers});
    res.end(req.method==='HEAD'?undefined:body);
  }catch(error){
    send(res,500,'Internal Server Error',{'content-type':'text/plain; charset=utf-8'});
  }
});

server.listen(port,host,()=>console.log(`LC QA server listening on http://${host}:${port}`));
