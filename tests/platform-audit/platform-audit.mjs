import {chromium} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import {installMockSupabase,IDS} from '../e2e/helpers/mock-supabase.js';

const BASE='https://academy.learnandcreate.workers.dev'; // production target
const OUT='platform-audit-output';
const VIEWPORTS={
  'mobile-320':{width:320,height:844,isMobile:true},
  'mobile-390':{width:390,height:844,isMobile:true},
  'mobile-430':{width:430,height:932,isMobile:true},
  'tablet-768':{width:768,height:1024,isMobile:false},
  'desktop-1024':{width:1024,height:800,isMobile:false},
  'desktop-1440':{width:1440,height:1000,isMobile:false}
};
const routes=[
  {label:'home',path:'/',mode:'public'},
  {label:'login',path:'/pages/login.html',mode:'public'},
  {label:'cadastro',path:'/pages/cadastro.html',mode:'public'},
  {label:'apoie',path:'/pages/apoie.html',mode:'public'},
  {label:'privacidade',path:'/pages/privacidade.html',mode:'public'},
  {label:'termos',path:'/pages/termos.html',mode:'public'},
  {label:'certificacao',path:'/pages/certificacao.html',mode:'public'},
  {label:'checkout-legado',path:'/pages/checkout.html',mode:'public'},
  {label:'verificar-certificado',path:'/pages/verificar.html?code=LC-QA-2026',mode:'verify'},
  {label:'certificado-publico',path:'/pages/certificado.html?code=LC-QA-2026',mode:'verify'},
  {label:'dashboard',path:'/pages/dashboard.html',mode:'student'},
  {label:'comece-aqui',path:'/pages/comece-aqui.html',mode:'student'},
  {label:'cursos',path:'/pages/cursos.html',mode:'student'},
  {label:'curso',path:'/pages/curso.html?id='+IDS.course,mode:'student'},
  {label:'aula',path:'/pages/aula.html?id='+IDS.lesson,mode:'student'},
  {label:'quiz',path:'/pages/quiz.html?id='+IDS.assessment,mode:'student'},
  {label:'projetos',path:'/pages/projetos.html',mode:'student'},
  {label:'biblioteca',path:'/pages/biblioteca.html',mode:'student'},
  {label:'apostila',path:'/pages/apostila.html?module='+IDS.module,mode:'student'},
  {label:'certificados',path:'/pages/certificados.html',mode:'student'},
  {label:'perfil',path:'/pages/perfil.html',mode:'student'},
  {label:'admin-overview',path:'/pages/admin/#overview',mode:'admin'},
  {label:'admin-analytics',path:'/pages/admin/#analytics',mode:'admin'},
  {label:'admin-students',path:'/pages/admin/#students',mode:'admin'},
  {label:'admin-boss',path:'/pages/admin/#boss',mode:'admin'},
  {label:'admin-certificates',path:'/pages/admin/#certificates',mode:'admin'},
  {label:'admin-donations',path:'/pages/admin/#donations',mode:'admin'},
  {label:'admin-audit',path:'/pages/admin/#audit',mode:'admin'}
];

await fs.rm(OUT,{recursive:true,force:true});
await fs.mkdir(path.join(OUT,'screenshots'),{recursive:true});

const publicJson=(route,data,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
async function installPublic(page,verify=false){
  await page.route(/https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/,route=>route.abort());
  await page.route('https://kvwsqfnyebyjncfgvqnd.supabase.co/**',async route=>{
    const u=new URL(route.request().url());
    if(verify&&u.pathname==='/rest/v1/rpc/verify_certificate'){
      return publicJson(route,[{valid:true,student_name:'Aluno QA',course_title:'Formação QA',issued_at:'2026-08-30T12:00:00Z',verification_code:'LC-QA-2026'}]);
    }
    if(u.pathname==='/auth/v1/user')return publicJson(route,{message:'not authenticated'},401);
    if(u.pathname==='/rest/v1/rpc/track_product_event')return publicJson(route,'88888888-8888-4888-8888-888888888888');
    return publicJson(route,[]);
  });
}
function safe(s){return String(s).replace(/[^a-z0-9_-]+/gi,'-').replace(/^-|-$/g,'').slice(0,90)}
function rank(s){return s==='critical'?4:s==='serious'?3:s==='moderate'?2:1}

async function inspect(page,isMobile,doAxe){
  const dom=await page.evaluate((isMobile)=>{
    const visible=el=>{const cs=getComputedStyle(el),r=el.getBoundingClientRect();return cs.display!=='none'&&cs.visibility!=='hidden'&&Number(cs.opacity)!==0&&r.width>0&&r.height>0};
    const all=[...document.querySelectorAll('*')];
    const interactive=[...document.querySelectorAll('a,button,input,select,textarea,[role="button"]')].filter(visible);
    const labels=[...document.querySelectorAll('input,select,textarea')].filter(visible).filter(el=>{
      if(el.type==='hidden')return false;
      const id=el.id;
      return !(el.getAttribute('aria-label')||el.getAttribute('aria-labelledby')||(id&&document.querySelector('label[for="'+CSS.escape(id)+'"]'))||el.closest('label'));
    }).map(el=>({tag:el.tagName,id:el.id,type:el.type||'',placeholder:el.getAttribute('placeholder')||''}));
    const unnamed=interactive.filter(el=>{
      if(el.matches('input,select,textarea'))return false;
      const name=(el.innerText||el.textContent||el.getAttribute('aria-label')||el.getAttribute('title')||'').trim();
      return !name&&!el.querySelector('img[alt],svg[aria-label],.lc-ui-icon');
    }).slice(0,30).map(el=>({tag:el.tagName,cls:String(el.className||'').slice(0,100)}));
    const duplicateIds=[...new Set(all.map(x=>x.id).filter(Boolean).filter((x,i,a)=>a.indexOf(x)!==i))];
    const brokenImages=[...document.images].filter(visible).filter(i=>!i.complete||i.naturalWidth===0).map(i=>({src:i.currentSrc||i.src,alt:i.alt}));
    const imgsNoAlt=[...document.images].filter(visible).filter(i=>!i.hasAttribute('alt')).map(i=>i.currentSrc||i.src);
    const iframesNoTitle=[...document.querySelectorAll('iframe')].filter(visible).filter(i=>!i.getAttribute('title')).map(i=>i.src);
    const offscreen=interactive.filter(el=>{const r=el.getBoundingClientRect();return r.left<-2||r.right>innerWidth+2}).slice(0,30).map(el=>({tag:el.tagName,text:(el.innerText||el.getAttribute('aria-label')||'').trim().slice(0,70),left:Math.round(el.getBoundingClientRect().left),right:Math.round(el.getBoundingClientRect().right)}));
    const tinyTargets=interactive.filter(el=>{
      if(!isMobile)return false;
      if(el.matches('input[type="radio"],input[type="checkbox"]')&&el.closest('label'))return false;
      const r=el.getBoundingClientRect();return r.width>0&&r.height>0&&(r.width<36||r.height<36);
    }).slice(0,40).map(el=>({tag:el.tagName,text:(el.innerText||el.getAttribute('aria-label')||'').trim().slice(0,70),w:Math.round(el.getBoundingClientRect().width),h:Math.round(el.getBoundingClientRect().height)}));
    const tinyText=all.filter(el=>{
      if(!visible(el)||el.children.length||['SCRIPT','STYLE','SVG','PATH'].includes(el.tagName))return false;
      const t=(el.textContent||'').trim();if(!t)return false;
      const fs=parseFloat(getComputedStyle(el).fontSize||'16');
      return fs<(isMobile?10.5:9.5);
    }).slice(0,40).map(el=>({tag:el.tagName,text:(el.textContent||'').trim().slice(0,80),font:getComputedStyle(el).fontSize}));
    return {
      title:document.title,
      lang:document.documentElement.lang,
      textLength:(document.body.innerText||'').trim().length,
      h1:[...document.querySelectorAll('h1')].filter(visible).map(x=>x.innerText.trim()),
      mainCount:[...document.querySelectorAll('main')].filter(visible).length,
      horizontalOverflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+2,
      scrollWidth:document.documentElement.scrollWidth,
      clientWidth:document.documentElement.clientWidth,
      labels,unnamed,duplicateIds,brokenImages,imgsNoAlt,iframesNoTitle,offscreen,tinyTargets,tinyText
    };
  },isMobile);
  let axe=[];
  if(doAxe){
    try{
      const a=await new AxeBuilder({page}).analyze();
      axe=a.violations.filter(v=>['critical','serious','moderate'].includes(v.impact)).map(v=>({id:v.id,impact:v.impact,help:v.help,nodes:v.nodes.length,targets:v.nodes.slice(0,4).map(n=>n.target)}));
    }catch(e){axe=[{id:'axe-runtime',impact:'serious',help:e.message,nodes:1,targets:[]}];}
  }
  return {dom,axe};
}

const browser=await chromium.launch({headless:true});
const results=[];
for(const [vpName,vp] of Object.entries(VIEWPORTS)){
  const ctx=await browser.newContext({viewport:{width:vp.width,height:vp.height},isMobile:vp.isMobile,hasTouch:vp.isMobile,deviceScaleFactor:1});
  for(const target of routes){
    const page=await ctx.newPage();
    if(target.mode==='student')await installMockSupabase(page,{role:'student'});
    else if(target.mode==='admin')await installMockSupabase(page,{role:'admin'});
    else await installPublic(page,target.mode==='verify');
    const consoleErrors=[],failed=[];
    page.on('console',m=>{if(m.type()==='error'&&!/fonts\.(googleapis|gstatic)|net::ERR_FAILED|favicon/i.test(m.text()))consoleErrors.push(m.text().slice(0,400))});
    page.on('pageerror',e=>consoleErrors.push('pageerror: '+e.message.slice(0,400)));
    page.on('response',res=>{if(res.status()>=400&&res.url().startsWith(BASE))failed.push({status:res.status(),url:res.url()})});
    let navError=null;
    try{await page.goto(BASE+target.path,{waitUntil:'domcontentloaded',timeout:25000});await page.waitForTimeout(500)}catch(e){navError=e.message}
    const doAxe=vpName==='mobile-390'||vpName==='desktop-1440';
    let inspected={dom:{},axe:[]};
    try{inspected=await inspect(page,vp.isMobile,doAxe)}catch(e){consoleErrors.push('audit-runtime: '+e.message)}
    const issues=[];
    const d=inspected.dom;
    if(navError)issues.push({severity:'critical',type:'navigation',detail:navError});
    if(!d.title)issues.push({severity:'serious',type:'missing-title'});
    if(!/^pt(?:-|$)/i.test(d.lang||''))issues.push({severity:'moderate',type:'document-lang',detail:d.lang});
    if((d.textLength||0)<60)issues.push({severity:'serious',type:'near-empty-page',detail:d.textLength});
    if(d.horizontalOverflow)issues.push({severity:'serious',type:'horizontal-overflow',detail:{scroll:d.scrollWidth,client:d.clientWidth}});
    if((d.h1||[]).length===0)issues.push({severity:'moderate',type:'missing-visible-h1'});
    if((d.mainCount||0)===0)issues.push({severity:'moderate',type:'missing-main-landmark'});
    for(const x of d.labels||[])issues.push({severity:'serious',type:'unlabelled-form-control',detail:x});
    for(const x of d.unnamed||[])issues.push({severity:'serious',type:'unnamed-interactive',detail:x});
    for(const x of d.duplicateIds||[])issues.push({severity:'serious',type:'duplicate-id',detail:x});
    for(const x of d.brokenImages||[])issues.push({severity:'serious',type:'broken-image',detail:x});
    for(const x of d.imgsNoAlt||[])issues.push({severity:'moderate',type:'image-missing-alt',detail:x});
    for(const x of d.iframesNoTitle||[])issues.push({severity:'serious',type:'iframe-missing-title',detail:x});
    for(const x of d.offscreen||[])issues.push({severity:'serious',type:'interactive-offscreen',detail:x});
    for(const x of d.tinyTargets||[])issues.push({severity:'minor',type:'small-touch-target',detail:x});
    for(const x of d.tinyText||[])issues.push({severity:'minor',type:'tiny-text',detail:x});
    for(const x of inspected.axe||[])issues.push({severity:x.impact==='critical'?'critical':x.impact==='serious'?'serious':'moderate',type:'axe-'+x.id,detail:x});
    for(const x of consoleErrors)issues.push({severity:'serious',type:'console-error',detail:x});
    for(const x of failed)issues.push({severity:'serious',type:'same-origin-http-error',detail:x});
    issues.sort((a,b)=>rank(b.severity)-rank(a.severity));
    const rec={viewport:vpName,label:target.label,path:target.path,url:page.url(),issues,dom:d,axe:inspected.axe};
    if(issues.length||(['mobile-390','desktop-1440'].includes(vpName)&&['home','dashboard','cursos','curso','aula','biblioteca','perfil','admin-analytics'].includes(target.label))){
      const file=path.join(OUT,'screenshots',safe(vpName+'-'+target.label)+'.jpg');
      try{await page.screenshot({path:file,fullPage:true,type:'jpeg',quality:40,animations:'disabled'});rec.screenshot=file}catch{}
    }
    results.push(rec);
    await page.close();
  }
  await ctx.close();
}
await browser.close();

const counts={critical:0,serious:0,moderate:0,minor:0};
const byType={};
for(const r of results)for(const i of r.issues){counts[i.severity]++;byType[i.type]=(byType[i.type]||0)+1}
const affected=results.filter(r=>r.issues.length);
const summary={generatedAt:new Date().toISOString(),base:BASE,renderings:results.length,routes:routes.length,viewports:Object.keys(VIEWPORTS),counts,affectedRenderings:affected.length,byType:Object.fromEntries(Object.entries(byType).sort((a,b)=>b[1]-a[1]))};
await fs.writeFile(path.join(OUT,'platform-audit-report.json'),JSON.stringify({summary,results},null,2));
let md='# LC — Platform 360 Browser Audit\n\n';
md+='- Renderizações: **'+summary.renderings+'**\n- Rotas/estados: **'+summary.routes+'**\n- Viewports: **'+summary.viewports.length+'**\n';
md+='- Critical: **'+counts.critical+'** · Serious: **'+counts.serious+'** · Moderate: **'+counts.moderate+'** · Minor: **'+counts.minor+'**\n\n';
md+='## Issues by type\n';
for(const [k,v] of Object.entries(summary.byType))md+='- '+k+': '+v+'\n';
md+='\n## Affected renderings\n';
for(const r of affected){
  md+='\n### '+r.viewport+' · '+r.label+'\n';
  for(const i of r.issues.slice(0,20))md+='- **'+i.severity+'** · '+i.type+': '+JSON.stringify(i.detail??'')+'\n';
}
await fs.writeFile(path.join(OUT,'platform-audit-summary.md'),md);
console.log(JSON.stringify(summary,null,2));
