import fs from 'node:fs';

const publicDir='public';
const failures=[];
const htmlFiles=[];
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).forEach(e=>{const p=dir+'/'+e.name;e.isDirectory()?walk(p):p.endsWith('.html')&&htmlFiles.push(p)});
walk(publicDir);

for(const file of htmlFiles){
  const src=fs.readFileSync(file,'utf8');
  if(!/<html[^>]+lang=["']pt-BR["']/i.test(src))failures.push(file+': lang pt-BR ausente');
  if(!/<meta[^>]+name=["']viewport["']/i.test(src))failures.push(file+': viewport ausente');
  const ids=[...src.matchAll(/\bid=["']([^"']+)["']/g)].map(m=>m[1]);
  const dup=ids.filter((x,i)=>ids.indexOf(x)!==i);
  if(dup.length)failures.push(file+': IDs duplicados '+[...new Set(dup)].join(', '));
  if(/<img(?![^>]*\balt=)[^>]*>/i.test(src))failures.push(file+': imagem sem alt');
}
const css=fs.readFileSync('public/assets/css/academy-v3.css','utf8');
if(!css.includes('@media(max-width:820px)'))failures.push('academy-v3.css: breakpoint mobile principal ausente');
if((css.match(/!important/g)||[]).length>12)failures.push('academy-v3.css: orçamento de !important excedido');

if(failures.length){console.error(failures.join('\n'));process.exit(1)}
console.log('Quality static checks passed for '+htmlFiles.length+' HTML pages.');
