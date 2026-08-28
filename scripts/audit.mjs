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
const brandCss=fs.readFileSync(path.join(root,"assets/css/lc-brand.css"),"utf8");
const globalCss=fs.readFileSync(path.join(root,"assets/css/styles.css"),"utf8");
const headersSource=fs.readFileSync(path.join(root,"_headers"),"utf8");
const countImportant=source=>(source.match(/!important/g)||[]).length;
if(countImportant(mobileCss)>12)failures.push(`academy-v3.css: orçamento de !important excedido (${countImportant(mobileCss)} > 12)`);
if(countImportant(lessonCss)>3)failures.push(`learning-release.css: orçamento de !important excedido (${countImportant(lessonCss)} > 3)`);
if(countImportant(globalCss)>8)failures.push(`styles.css: orçamento de !important excedido (${countImportant(globalCss)} > 8)`);
if(/nx-book(?:-|\b)/.test(lessonCss))failures.push("learning-release.css: CSS legado do livro horizontal ainda presente");
for(const legacySection of ["LC VISUAL POLISH","LC MOBILE LESSON REPAIR","LC VISUAL IDENTITY OVERRIDES"]){if(mobileCss.includes(legacySection))failures.push(`academy-v3.css: camada legada ainda presente (${legacySection})`)}
const maxWidths=[...new Set([...globalCss.matchAll(/@media[^\{]*max-width:(\d+)px/g),...mobileCss.matchAll(/@media[^\{]*max-width:(\d+)px/g),...lessonCss.matchAll(/@media[^\{]*max-width:(\d+)px/g)].map(m=>Number(m[1])))];
for(const width of maxWidths){if(![1100,900,820,620,420].includes(width))failures.push(`CSS: breakpoint não canônico ${width}px`)}
if(!headersSource.includes("fonts.googleapis.com")||!headersSource.includes("fonts.gstatic.com"))failures.push("CSP: fontes oficiais LC não estão liberadas");
for(const [label,source,patterns] of [
  ["academy-v3.css",mobileCss,["LC UI FOUNDATION 1.0","LC MOBILE-FIRST HARDENING","grid-template-columns:repeat(5","env(safe-area-inset-bottom)","nx-mobile-more","lc-ui-icon",'input[type="checkbox"]']],
  ["learning-release.css",lessonCss,["LC LESSON EXPERIENCE 1.0","nx-lesson-flow","nx-section-nav","nx-sheet","nx-mobile-pdf-note"]],
  ["app-shell.js",appShellSource,["enhanceMobileNavigation","applyLCNavigationIcons","LC_ICON_PATHS","lc-ui-icon","aria-current","nx-mobile-more","inert","lc-mark.svg","lc-brand-signature","Learn <span class=\"lc-brand-amp\">&amp;</span> Create"]],
  ["lc-brand.css",brandCss,["fonts.googleapis.com/css2?family=Inter","--lc-ink:#07111F","--lc-blue:#2878FF","--lc-mint:#38E6B0","--lc-font:Inter"]]
])for(const pattern of patterns){if(!source.includes(pattern))failures.push(`${label}: proteção mobile ausente (${pattern})`)}
for(const rel of ["index.html","pages/login.html","pages/cadastro.html","pages/apoie.html"]){const html=fs.readFileSync(path.join(root,rel),"utf8");if(!/viewport-fit=cover/.test(html))failures.push(`${rel}: viewport-fit=cover ausente`)}
for(const requiredBrand of ["assets/brand/lc-mark.svg","assets/css/lc-brand.css","manifest.webmanifest"]){if(!fs.existsSync(path.join(root,requiredBrand)))failures.push(`ativo LC ausente: ${requiredBrand}`)}
for(const file of files.filter(file=>/\.(?:html|js|css|sql|svg|txt)$/.test(file))){
  const source=fs.readFileSync(file,"utf8"),rel=path.relative(root,file);
  const technicalAllowlist=new Set(["assets/js/supabase-lc.js"]);
  if(!technicalAllowlist.has(rel)&&/nexora/i.test(source))failures.push(`${rel}: resíduo público da marca anterior`);
  if(source.includes("nexora-logo.svg")||source.includes("supabase-nexora.js")||source.includes("NexoraSupabase")||source.includes("nexoraBoot"))failures.push(`${rel}: referência legada proibida`);
  if(source.includes('class="lc-brand-name">LC</span>'))failures.push(`${rel}: lockup redundante LC + LC Mark`);
}
const lessonHtml=fs.readFileSync(path.join(root,"pages/aula.html"),"utf8");
for(const pattern of ['id="lessonFlow"','id="pratica"','id="resumo"','id="materialsDialog"','wireSectionProgress','wireInlineChecks','PARE E PENSE','PRÁTICA GUIADA','VOCÊ JÁ CONSEGUE?']){if(!lessonHtml.includes(pattern))failures.push(`aula.html: experiência contínua ausente (${pattern})`)}
if(lessonHtml.includes('id="bookPages"')||lessonHtml.includes("Deslize para avançar"))failures.push("aula.html: paginação horizontal antiga ainda presente");
const labSource=fs.readFileSync(path.join(root,"assets/js/learning-labs.js"),"utf8");
if(labSource.includes("new Function"))failures.push("learning-labs.js não pode executar código no contexto da aplicação");
for(const required of ["supabase/migrations/20260828090000_nexora_security_hardening.sql","supabase/migrations/20260828144500_lc_editorial_pilot_logic_module_1.sql","supabase/migrations/20260828152000_lc_editorial_logic_module_2.sql","supabase/migrations/20260828152500_lc_editorial_logic_module_3.sql","supabase/migrations/20260828153000_lc_editorial_logic_module_4.sql","supabase/migrations/20260828153500_lc_editorial_logic_module_5.sql","supabase/migrations/20260828170000_lc_phase1_functional_integrity.sql","supabase/migrations/20260828181500_lc_phase3_operations.sql","supabase/migrations/20260828184500_lc_phase4_analytics.sql","supabase/migrations/20260828185000_lc_phase4_app_sessions.sql","supabase/migrations/20260828185200_lc_anon_rpc_access.sql","supabase/migrations/20260828185500_lc_analytics_privacy_guard.sql","supabase/functions/lc-mercadopago-donation/index.ts","supabase/functions/lc-mercadopago-webhook/index.ts"]){if(!fs.existsSync(required))failures.push(`arquivo operacional ausente: ${required}`)}
for(const required of [
  "playwright.config.js",
  "lighthouserc.cjs",
  "tests/e2e/helpers/mock-supabase.js",
  "tests/e2e/helpers/quality.js",
  "tests/e2e/public.spec.js",
  "tests/e2e/student-flows.spec.js",
  "tests/e2e/admin.spec.js",
  "tests/e2e/responsive.spec.js",
  "tests/e2e/visual.spec.js",
  "scripts/quality-static.mjs",
  ".github/workflows/quality.yml",
  ".github/workflows/production-quality.yml",
  "docs/LC_QUALITY.md"
]){if(!fs.existsSync(required))failures.push(`arquivo de qualidade ausente: ${required}`)}
const legacyPalette=["#8457ff","#754fff","#9b6fff","#7e59ff","#7c63ff","#8c72ff","#7564ff","#7664ff","#8b6dff","#6e5cff","rgba(124,99,255","rgba(140,114,255","rgba(142,111,255"];
for(const rel of ["assets/css/styles.css","assets/css/academy-v3.css"]){const source=fs.readFileSync(path.join(root,rel),"utf8").toLowerCase();for(const legacy of legacyPalette){if(source.includes(legacy.toLowerCase()))failures.push(`${rel}: cor legada fora da paleta LC (${legacy})`)}}
const projectsHtml=fs.readFileSync(path.join(root,"pages/projetos.html"),"utf8");
const certificatesHtml=fs.readFileSync(path.join(root,"pages/certificados.html"),"utf8");
const adminHtml=fs.readFileSync(path.join(root,"pages/admin/index.html"),"utf8");
const adminSource=fs.readFileSync(path.join(root,"assets/js/admin.js"),"utf8");
const analyticsSource=fs.readFileSync(path.join(root,"assets/js/analytics.js"),"utf8");
for(const pattern of ["x.name||x.label","revision_requested","score:null,feedback:null,reviewed_at:null"]){if(!projectsHtml.includes(pattern))failures.push(`projetos.html: ciclo de revisão Boss incompleto (${pattern})`)}
for(const pattern of ["certificate_eligibility","data-issue","Emitir certificado"]){if(!certificatesHtml.includes(pattern))failures.push(`certificados.html: emissão explícita ausente (${pattern})`)}
for(const pattern of ["data-admin-panel=\"overview\"","data-admin-panel=\"analytics\"","data-admin-panel=\"students\"","data-admin-panel=\"boss\"","data-admin-panel=\"certificates\"","data-admin-panel=\"audit\"","studentDialog","analyticsDays","analyticsLessonCourse"]){if(!adminHtml.includes(pattern))failures.push(`admin/index.html: central operacional incompleta (${pattern})`)}
for(const pattern of ["admin_operational_summary","admin_student_roster","admin_student_detail","admin_update_profile","admin_update_enrollment","admin_create_enrollment","admin_boss_roster","admin_certificate_roster","admin_audit_feed","review_project_submission","admin_analytics_overview","admin_analytics_funnel","admin_analytics_daily","admin_analytics_courses","admin_analytics_lessons","admin_analytics_devices","admin_analytics_goals","loadAnalytics"]){if(!adminSource.includes(pattern))failures.push(`admin.js: operação administrativa ausente (${pattern})`)}
for(const pattern of ["lc.analytics.session","track_product_event","identify_analytics_session","lesson_engagement","lc:inline-check","lc:lab-complete","keepalive:true","FORBIDDEN_PROPERTY_KEYS"]){if(!analyticsSource.includes(pattern))failures.push(`analytics.js: instrumentação ausente (${pattern})`)}
for(const rel of ["pages/cadastro.html","pages/login.html","pages/comece-aqui.html","pages/curso.html","pages/aula.html","pages/quiz.html","pages/projetos.html","pages/certificados.html"]){const source=fs.readFileSync(path.join(root,rel),"utf8");if(!source.includes("analytics.js"))failures.push(`${rel}: analytics client ausente`)}
if(!appShellSource.includes("ensureLCAnalytics")||!appShellSource.includes("app_session_started"))failures.push("app-shell.js: sessão analítica autenticada ausente");
const analyticsPrivacyMigration=fs.readFileSync("supabase/migrations/20260828185500_lc_analytics_privacy_guard.sql","utf8");
for(const pattern of ["analytics_sensitive_property_rejected","trg_product_events_privacy","access_token","password","email"]){if(!analyticsPrivacyMigration.includes(pattern))failures.push(`analytics privacy guard ausente (${pattern})`)}
if(/['"]NX['"]/.test(appShellSource)||appShellSource.includes('side-avatar">N'))failures.push("app-shell.js: fallback visual legado NX/N ainda presente");
if(failures.length){console.error(failures.join("\n"));process.exit(1)}
console.log(`Auditoria aprovada: ${files.length} arquivos públicos e ${files.filter(file=>file.endsWith(".html")).length} páginas HTML.`);

