import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT=process.cwd();
const FIXTURE_DIR=path.join(ROOT,'tests/visual-audit/fixtures');
const OUT=path.join(ROOT,'visual-audit-output');
const BASE='https://academy.learnandcreate.workers.dev/pages';
const VIEWPORTS={
  desktop:{width:1440,height:1000,isMobile:false},
  mobile:{width:390,height:844,isMobile:true}
};

const fixtures=[];
for(let i=1;i<=9;i++){
  fixtures.push(JSON.parse(await fs.readFile(path.join(FIXTURE_DIR,`programador-master-m${i}.json`),'utf8')));
}
const course={...fixtures[0].course,status:'published',position:1,minimum_score:70,category_label:'Programação',is_recommended_start:true,recommendation_note:'Formação completa'};
const modules=fixtures.map(x=>x.module).sort((a,b)=>a.position-b.position);
const lessons=fixtures.flatMap(x=>x.lessons).sort((a,b)=>{
  const ma=modules.find(m=>m.id===a.module_id)?.position||0;
  const mb=modules.find(m=>m.id===b.module_id)?.position||0;
  return ma-mb || a.position-b.position;
});
const resources=[...new Map(fixtures.flatMap(x=>x.resources).map(x=>[x.id,x])).values()];
const references=fixtures.flatMap(x=>x.references.map(r=>({...r,module_id:x.module.id})));
const assessments=fixtures.map(x=>x.assessment).filter(Boolean).map(x=>({...x.row,status:'published'}));
const questions=fixtures.flatMap(x=>x.assessment?.questions||[]);
const projects=fixtures.map(x=>x.project).filter(Boolean).map(x=>({...x,status:'published'}));
const lessonById=new Map(lessons.map(x=>[x.id,x]));
const moduleById=new Map(modules.map(x=>[x.id,x]));
const assessmentById=new Map(assessments.map(x=>[x.id,x]));

await fs.rm(OUT,{recursive:true,force:true});
await fs.mkdir(path.join(OUT,'screenshots'),{recursive:true});

function eq(url,name){
  const v=url.searchParams.get(name);
  if(!v) return null;
  return v.startsWith('eq.')?decodeURIComponent(v.slice(3)):decodeURIComponent(v);
}
function json(route,data,status=200){
  return route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
}
function filterRows(rows,url){
  const id=eq(url,'id'),mid=eq(url,'module_id'),cid=eq(url,'course_id'),aid=eq(url,'assessment_id');
  return rows.filter(r=>(!id||r.id===id)&&(!mid||r.module_id===mid)&&(!cid||r.course_id===cid)&&(!aid||r.assessment_id===aid));
}
function safeName(s){return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9._-]+/g,'-').replace(/^-+|-+$/g,'').toLowerCase().slice(0,110)}

async function installMock(page){
  await page.route(/https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/,route=>route.abort());
  await page.addInitScript(()=>{
    localStorage.setItem('lc.supabase.session',JSON.stringify({
      access_token:'visual-audit-access',
      refresh_token:'visual-audit-refresh',
      expires_at:4102444800
    }));
  });
  await page.route('https://kvwsqfnyebyjncfgvqnd.supabase.co/**',async route=>{
    const req=route.request(),url=new URL(req.url()),p=url.pathname,method=req.method();
    if(p==='/auth/v1/user') return json(route,{id:'11111111-1111-4111-8111-111111111111',email:'qa@lc.invalid',user_metadata:{full_name:'Administrador Visual QA'}});
    if(p==='/auth/v1/logout') return json(route,{});
    if(p==='/rest/v1/profiles') return json(route,[{id:'11111111-1111-4111-8111-111111111111',full_name:'Administrador Visual QA',role:'admin',status:'active'}]);
    if(p==='/rest/v1/courses') return json(route,[course]);
    if(p==='/rest/v1/modules') return json(route,filterRows(modules,url));
    if(p==='/rest/v1/lessons'){
      const rows=filterRows(lessons,url);
      return json(route,rows);
    }
    if(p==='/rest/v1/lesson_progress') return json(route,[]);
    if(p==='/rest/v1/enrollments') return json(route,[{id:'77777777-7777-4777-8777-777777777777',course_id:course.id,status:'active',enrolled_at:'2026-08-30T12:00:00Z'}]);
    if(p==='/rest/v1/learning_resources'){
      let rows=resources;
      const or=url.searchParams.get('or')||'';
      const mm=or.match(/module_id\.eq\.([0-9a-f-]{36})/i);
      if(mm) rows=rows.filter(r=>r.module_id===mm[1]||(!r.module_id&&r.course_id===course.id));
      const mid=eq(url,'module_id'); if(mid) rows=rows.filter(r=>r.module_id===mid);
      const cid=eq(url,'course_id'); if(cid) rows=rows.filter(r=>r.course_id===cid);
      return json(route,rows.map(r=>({...r,status:'published'})));
    }
    if(p==='/rest/v1/curriculum_references'){
      const mid=eq(url,'module_id');
      return json(route,references.filter(r=>!mid||r.module_id===mid).map(({module_id,...r})=>({...r,status:'active'})));
    }
    if(p==='/rest/v1/assessments') return json(route,filterRows(assessments,url));
    if(p==='/rest/v1/questions') return json(route,filterRows(questions,url));
    if(p==='/rest/v1/projects') return json(route,filterRows(projects,url));
    if(p==='/rest/v1/project_submissions') return json(route,[]);
    if(p==='/rest/v1/certificates') return json(route,[]);
    if(p==='/rest/v1/learning_paths'||p==='/rest/v1/learning_path_courses'||p==='/rest/v1/user_learning_preferences'||p==='/rest/v1/learning_credits') return json(route,[]);
    if(p==='/rest/v1/rpc/get_gamification_summary') return json(route,[{xp_total:1250,level:4,current_streak:5}]);
    if(p==='/rest/v1/rpc/identify_analytics_session') return json(route,1);
    if(p==='/rest/v1/rpc/track_product_event') return json(route,'88888888-8888-4888-8888-888888888888');
    if(p==='/rest/v1/rpc/check_assessment_question') return json(route,[{correct:true,feedback:'Correto. Resposta validada para auditoria visual.'}]);
    if(p==='/rest/v1/rpc/submit_assessment') return json(route,[{passed:true,score:100,correct:1,total:1}]);
    if(p==='/rest/v1/rpc/claim_assessment_xp') return json(route,[{xp_awarded:150,level:4}]);
    if(p==='/rest/v1/rpc/complete_lesson_mission') return json(route,[{xp_awarded:100,level:4,current_streak:5}]);
    if(p==='/rest/v1/rpc/certificate_eligibility') return json(route,[{eligible:false,reason:'Curso em auditoria visual.'}]);
    return json(route,[]);
  });
}

function severityRank(s){return s==='critical'?4:s==='serious'?3:s==='moderate'?2:1}
async function inspectPage(page,{label,viewport,consoleErrors,failedResponses}){
  const dom=await page.evaluate((isMobile)=>{
    const visible=el=>{
      const cs=getComputedStyle(el),r=el.getBoundingClientRect();
      return cs.display!=='none'&&cs.visibility!=='hidden'&&Number(cs.opacity)!==0&&r.width>0&&r.height>0;
    };
    const rect=el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom}};
    const doc=document.documentElement;
    const all=[...document.querySelectorAll('*')];
    const interactive=[...document.querySelectorAll('a,button,input,select,textarea,[role="button"]')].filter(visible);
    const images=[...document.images].filter(visible);
    const duplicateIds=[...new Set(all.map(x=>x.id).filter(Boolean).filter((id,i,arr)=>arr.indexOf(id)!==i))];
    const offscreen=interactive.filter(el=>{const r=el.getBoundingClientRect();return r.left<-2||r.right>innerWidth+2}).slice(0,30).map(el=>({tag:el.tagName,text:(el.innerText||el.getAttribute('aria-label')||'').trim().slice(0,80),rect:rect(el)}));
    const tinyTargets=interactive.filter(el=>{const r=el.getBoundingClientRect();return isMobile&&(r.width<36||r.height<36)}).slice(0,40).map(el=>({tag:el.tagName,text:(el.innerText||el.getAttribute('aria-label')||'').trim().slice(0,80),rect:rect(el)}));
    const clipped=all.filter(el=>{
      if(!visible(el))return false;
      const cs=getComputedStyle(el);
      if(!/(hidden|clip)/.test(cs.overflow+cs.overflowX+cs.overflowY)&&cs.textOverflow!=='ellipsis')return false;
      return el.scrollWidth>el.clientWidth+2||el.scrollHeight>el.clientHeight+2;
    }).slice(0,40).map(el=>({tag:el.tagName,cls:String(el.className||'').slice(0,120),text:(el.innerText||'').trim().slice(0,100),sw:el.scrollWidth,cw:el.clientWidth,sh:el.scrollHeight,ch:el.clientHeight}));
    const tinyText=all.filter(el=>{
      if(!visible(el)||el.children.length)return false;
      const t=(el.textContent||'').trim(); if(!t)return false;
      const fs=parseFloat(getComputedStyle(el).fontSize||'16');
      return fs<(isMobile?10.5:9.5);
    }).slice(0,40).map(el=>({tag:el.tagName,text:(el.textContent||'').trim().slice(0,100),font:getComputedStyle(el).fontSize}));
    const brokenImages=images.filter(i=>!i.complete||i.naturalWidth===0).map(i=>({src:i.currentSrc||i.src,alt:i.alt}));
    const distorted=images.filter(i=>{
      if(!i.naturalWidth||!i.naturalHeight)return false;
      const cs=getComputedStyle(i); if(['cover','contain'].includes(cs.objectFit))return false;
      const r=i.getBoundingClientRect(),a=r.width/r.height,n=i.naturalWidth/i.naturalHeight;
      return Math.abs(a-n)/n>.12;
    }).slice(0,20).map(i=>({src:i.currentSrc||i.src,render:rect(i),natural:[i.naturalWidth,i.naturalHeight],objectFit:getComputedStyle(i).objectFit}));
    const buttonsNoText=interactive.filter(el=>['BUTTON','A'].includes(el.tagName)&&!(el.innerText||'').trim()&&!el.getAttribute('aria-label')&&!el.querySelector('img[alt],svg[aria-label]')).slice(0,30).map(el=>({tag:el.tagName,cls:String(el.className||'').slice(0,100)}));
    const dialogs=[...document.querySelectorAll('dialog')].map(d=>({id:d.id,open:d.open,scrollWidth:d.scrollWidth,clientWidth:d.clientWidth,scrollHeight:d.scrollHeight,clientHeight:d.clientHeight}));
    return {
      title:document.title,
      bodyClass:document.body.className,
      pattern:document.querySelector('#content')?.dataset?.lessonPattern||null,
      scrollWidth:doc.scrollWidth,clientWidth:doc.clientWidth,scrollHeight:doc.scrollHeight,
      horizontalOverflow:doc.scrollWidth>doc.clientWidth+2,
      duplicateIds,offscreen,tinyTargets,clipped,tinyText,brokenImages,distorted,buttonsNoText,dialogs,
      h1:[...document.querySelectorAll('h1')].filter(visible).map(x=>x.innerText.trim()),
      visibleTextLength:(document.body.innerText||'').trim().length
    };
  },viewport==='mobile');
  let axe=[];
  try{
    const results=await new AxeBuilder({page}).analyze();
    axe=results.violations.map(v=>({id:v.id,impact:v.impact,help:v.help,nodes:v.nodes.length,targets:v.nodes.slice(0,6).map(n=>n.target)}));
  }catch(e){axe=[{id:'axe-runtime',impact:'serious',help:e.message,nodes:1,targets:[]}];}
  const issues=[];
  if(dom.horizontalOverflow)issues.push({severity:'serious',type:'horizontal-overflow',detail:`${dom.scrollWidth}px > ${dom.clientWidth}px`});
  for(const x of dom.offscreen)issues.push({severity:'serious',type:'interactive-offscreen',detail:x});
  for(const x of dom.brokenImages)issues.push({severity:'serious',type:'broken-image',detail:x});
  for(const x of dom.distorted)issues.push({severity:'moderate',type:'image-distortion',detail:x});
  for(const x of dom.clipped)issues.push({severity:'moderate',type:'content-clipped',detail:x});
  for(const x of dom.tinyTargets)issues.push({severity:'minor',type:'small-touch-target',detail:x});
  for(const x of dom.tinyText)issues.push({severity:'minor',type:'tiny-text',detail:x});
  for(const x of dom.duplicateIds)issues.push({severity:'serious',type:'duplicate-id',detail:x});
  for(const x of dom.buttonsNoText)issues.push({severity:'moderate',type:'unlabeled-interactive',detail:x});
  for(const x of axe)if(['critical','serious','moderate'].includes(x.impact))issues.push({severity:x.impact==='critical'?'critical':x.impact==='serious'?'serious':'moderate',type:'axe-'+x.id,detail:x});
  for(const x of consoleErrors)issues.push({severity:'serious',type:'console-error',detail:x});
  for(const x of failedResponses)issues.push({severity:'serious',type:'failed-resource',detail:x});
  return {label,viewport,url:page.url(),dom,axe,issues:issues.sort((a,b)=>severityRank(b.severity)-severityRank(a.severity))};
}

async function auditUrl(context,target,viewport,{interact}={}){
  const page=await context.newPage();
  await installMock(page);
  const consoleErrors=[],failedResponses=[];
  page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text().slice(0,500))});
  page.on('pageerror',e=>consoleErrors.push('pageerror: '+e.message.slice(0,500)));
  page.on('response',r=>{const u=r.url();if(r.status()>=400&&u.startsWith('https://academy.learnandcreate.workers.dev'))failedResponses.push({status:r.status(),url:u})});
  let navigationError=null;
  try{
    await page.goto(target.url,{waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForTimeout(700);
    await page.waitForFunction(()=>!document.querySelector('#state:not(.hidden)')||document.querySelector('#state')?.classList.contains('error'),null,{timeout:12000}).catch(()=>{});
    if(interact)await interact(page);
  }catch(e){navigationError=e.message}
  const shot=path.join(OUT,'screenshots',`${safeName(viewport+'-'+target.label)}.jpg`);
  try{await page.screenshot({path:shot,fullPage:true,type:'jpeg',quality:36,animations:'disabled',timeout:30000})}catch(e){consoleErrors.push('screenshot: '+e.message)}
  let report;
  try{report=await inspectPage(page,{label:target.label,viewport,consoleErrors,failedResponses})}
  catch(e){report={label:target.label,viewport,url:page.url(),dom:{},axe:[],issues:[{severity:'critical',type:'audit-runtime',detail:e.message}]}}
  if(navigationError)report.issues.unshift({severity:'critical',type:'navigation-error',detail:navigationError});
  report.screenshot=path.relative(ROOT,shot);
  await page.close();
  return report;
}

async function auditLessonStates(context,lesson,viewport){
  const url=`${BASE}/aula.html?id=${lesson.id}&preview=1`;
  const label=`m${moduleById.get(lesson.module_id)?.position||0}-a${lesson.position}-${lesson.title}`;
  return auditUrl(context,{label,url},viewport,{interact:async page=>{
    const inline=page.locator('[data-inline-check]').first();
    if(await inline.isVisible().catch(()=>false)){
      const opt=inline.locator('[data-inline-option]').first();
      await opt.click().catch(()=>{});
      await page.waitForTimeout(80);
    }
  }});
}

const browser=await chromium.launch({headless:true});
const results=[];
for(const [viewportName,vp] of Object.entries(VIEWPORTS)){
  const context=await browser.newContext({viewport:{width:vp.width,height:vp.height},isMobile:vp.isMobile,hasTouch:vp.isMobile,deviceScaleFactor:1});
  results.push(await auditUrl(context,{label:'cursos-entry',url:`${BASE}/cursos.html`},viewportName));
  results.push(await auditUrl(context,{label:'programador-master-course',url:`${BASE}/curso.html?id=${course.id}&preview=1`},viewportName));
  results.push(await auditUrl(context,{label:'biblioteca',url:`${BASE}/biblioteca.html`},viewportName));
  results.push(await auditUrl(context,{label:'boss-fights',url:`${BASE}/projetos.html`},viewportName));

  for(const m of modules){
    results.push(await auditUrl(context,{label:`m${m.position}-apostila-digital-${m.title}`,url:`${BASE}/apostila.html?module=${m.id}`},viewportName));
    const first=lessons.find(l=>l.module_id===m.id);
    if(first&&viewportName==='mobile'){
      results.push(await auditUrl(context,{label:`m${m.position}-mobile-aulas-dialog`,url:`${BASE}/aula.html?id=${first.id}&preview=1`},viewportName,{interact:async page=>{
        const b=page.locator('#openLessons'); if(await b.isVisible().catch(()=>false)){await b.click();await page.waitForTimeout(120)}
      }}));
      results.push(await auditUrl(context,{label:`m${m.position}-mobile-materiais-dialog`,url:`${BASE}/aula.html?id=${first.id}&preview=1`},viewportName,{interact:async page=>{
        const b=page.locator('#openMaterials'); if(await b.isVisible().catch(()=>false)){await b.click();await page.waitForTimeout(220)}
      }}));
    }
  }
  for(const l of lessons){
    results.push(await auditLessonStates(context,l,viewportName));
  }
  for(const a of assessments){
    const mod=moduleById.get(a.module_id);
    results.push(await auditUrl(context,{label:`m${mod?.position||0}-quiz-${a.title}`,url:`${BASE}/quiz.html?id=${a.id}`},viewportName,{interact:async page=>{
      const count=questions.filter(q=>q.assessment_id===a.id).length;
      for(let i=0;i<count;i++){
        const opt=page.locator('input[name="answer"]').first();
        if(!(await opt.isVisible().catch(()=>false)))break;
        await opt.check();
        await page.locator('#verifyBtn').click();
        await page.waitForTimeout(60);
        if(i<count-1){await page.locator('#nextBtn').click();await page.waitForTimeout(60)}
      }
    }}));
  }
  await context.close();
}
await browser.close();

const severityCounts={critical:0,serious:0,moderate:0,minor:0};
for(const r of results)for(const i of r.issues)severityCounts[i.severity]=(severityCounts[i.severity]||0)+1;
const pagesWithIssues=results.filter(r=>r.issues.length);
const uniqueIssueTypes=[...new Set(results.flatMap(r=>r.issues.map(i=>i.type)))];
const byModule={};
for(const r of results){
  const m=r.label.match(/^m(\d+)/)?.[1]||'shared';
  byModule[m]??={pages:0,issues:0,critical:0,serious:0,moderate:0,minor:0};
  byModule[m].pages++;
  for(const i of r.issues){byModule[m].issues++;byModule[m][i.severity]=(byModule[m][i.severity]||0)+1}
}
const summary={
  generated_at:new Date().toISOString(),
  commit:process.env.GITHUB_SHA||null,
  course:{id:course.id,title:course.title},
  counts:{audited_renderings:results.length,lessons:lessons.length,modules:modules.length,assessments:assessments.length,projects:projects.length,resources:resources.length,pages_with_issues:pagesWithIssues.length},
  severityCounts,uniqueIssueTypes,byModule
};
await fs.writeFile(path.join(OUT,'report.json'),JSON.stringify({summary,results},null,2));
await fs.writeFile(path.join(OUT,'summary.json'),JSON.stringify(summary,null,2));

const md=[];
md.push('# LC — Programador Master · Auditoria visual completa');
md.push('');
md.push(`Renderizações auditadas: **${summary.counts.audited_renderings}** · Aulas: **${lessons.length}** · Módulos: **${modules.length}** · Quizzes: **${assessments.length}**`);
md.push('');
md.push(`Ocorrências: critical **${severityCounts.critical}**, serious **${severityCounts.serious}**, moderate **${severityCounts.moderate}**, minor **${severityCounts.minor}**.`);
md.push('');
md.push('| Escopo | Renderizações | Issues | Critical | Serious | Moderate | Minor |');
md.push('|---|---:|---:|---:|---:|---:|---:|');
for(const [k,v] of Object.entries(byModule))md.push(`| ${k==='shared'?'Superfícies compartilhadas':'Módulo '+k} | ${v.pages} | ${v.issues} | ${v.critical} | ${v.serious} | ${v.moderate} | ${v.minor} |`);
md.push('');
md.push('## Páginas com ocorrências');
for(const r of pagesWithIssues){
  md.push(`### ${r.viewport} · ${r.label}`);
  md.push(`- ${r.url}`);
  for(const i of r.issues.slice(0,20))md.push(`- **${i.severity} · ${i.type}** — ${typeof i.detail==='string'?i.detail:JSON.stringify(i.detail)}`);
}
await fs.writeFile(path.join(OUT,'report.md'),md.join('\n'));

if(severityCounts.critical||severityCounts.serious){
  console.log('Visual audit completed with critical/serious findings; see artifact.');
}else{
  console.log('Visual audit completed without critical/serious findings.');
}
console.log(JSON.stringify(summary,null,2));
