import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root=path.resolve("public");
const files=[];
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).forEach(entry=>{const file=path.join(dir,entry.name);entry.isDirectory()?walk(file):files.push(file)});
walk(root);
const failures=[];
for(const file of files.filter(file=>file.endsWith(".js"))){try{new vm.Script(fs.readFileSync(file,"utf8"),{filename:file})}catch(error){failures.push(`${path.relative(root,file)}: ${error.message}`)}}
for(const file of files.filter(file=>file.endsWith(".html"))){
  const html=fs.readFileSync(file,"utf8");
  let index=0;
  for(const match of html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)){try{new vm.Script(match[1],{filename:`${file}#inline-${++index}`})}catch(error){failures.push(`${path.relative(root,file)}: ${error.message}`)}}
  for(const match of html.matchAll(/(?:href|src)=["']([^"']+)["']/gi)){
    const ref=match[1];
    if(!ref||/^(?:#|https?:|mailto:|tel:|data:|javascript:)/.test(ref)||ref.includes("${"))continue;
    const target=path.resolve(path.dirname(file),ref.split(/[?#]/)[0]);
    if(!fs.existsSync(target))failures.push(`${path.relative(root,file)}: referência ausente ${ref}`);
  }
}
const mobileCss=fs.readFileSync(path.join(root,"assets/css/academy-v3.css"),"utf8");
const lessonCss=fs.readFileSync(path.join(root,"assets/css/learning-release.css"),"utf8");
const appShellSource=fs.readFileSync(path.join(root,"assets/js/app-shell.js"),"utf8");
for(const [label,source,patterns] of [
  ["academy-v3.css",mobileCss,["NEXORA MOBILE-FIRST HARDENING","grid-template-columns:repeat(5","env(safe-area-inset-bottom)","nx-mobile-more","input[type=\\\"checkbox\\\"]"]],
  ["learning-release.css",lessonCss,["nx-mobile-lesson-picker","nx-book-dots button","nx-mobile-pdf-note"]],
  ["app-shell.js",appShellSource,["enhanceMobileNavigation","aria-current","nx-mobile-more","inert"]]
])for(const pattern of patterns){if(!source.includes(pattern))failures.push(\`${label}: proteção mobile ausente (${pattern})\`)}
for(const rel of ["index.html","pages/login.html","pages/cadastro.html","pages/apoie.html"]){const html=fs.readFileSync(path.join(root,rel),"utf8");if(!/viewport-fit=cover/.test(html))failures.push(\`${rel}: viewport-fit=cover ausente\`)}
const labSource=fs.readFileSync(path.join(root,"assets/js/learning-labs.js"),"utf8");
if(labSource.includes("new Function"))failures.push("learning-labs.js não pode executar código no contexto da aplicação");
for(const required of ["supabase/migrations/20260828090000_nexora_security_hardening.sql","supabase/functions/nexora-mercadopago-donation/index.ts","supabase/functions/nexora-mercadopago-webhook/index.ts"]){if(!fs.existsSync(required))failures.push(`arquivo operacional ausente: ${required}`)}
if(failures.length){console.error(failures.join("\n"));process.exit(1)}
console.log(`Auditoria aprovada: ${files.length} arquivos públicos e ${files.filter(file=>file.endsWith(".html")).length} páginas HTML.`);
