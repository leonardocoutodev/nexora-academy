import fs from 'node:fs';
import path from 'node:path';

const failures=[];
const repoRoot=process.cwd();
const governanceFiles=[
  'docs/LC_DATABASE_GOVERNANCE.md',
  'supabase/README.md'
];
for(const file of governanceFiles){
  if(!fs.existsSync(path.join(repoRoot,file)))failures.push(file+': documentação de governança ausente');
}

const bannedCommands=[
  ['supabase','db','push'],
  ['supabase','db','reset'],
  ['supabase','migration','up']
].map(parts=>new RegExp(parts.join('\\s+'),'i'));

const scanRoots=['package.json','.github','scripts'];
const files=[];
const walk=p=>{
  const abs=path.join(repoRoot,p);
  if(!fs.existsSync(abs))return;
  const stat=fs.statSync(abs);
  if(stat.isDirectory()){
    for(const entry of fs.readdirSync(abs))walk(path.join(p,entry));
  }else files.push(p);
};
for(const root of scanRoots)walk(root);

for(const file of files){
  if(file==='scripts/check-db-governance.mjs')continue;
  if(!/\.(?:json|ya?ml|mjs|js|sh|md)$/i.test(file))continue;
  const source=fs.readFileSync(path.join(repoRoot,file),'utf8');
  for(const pattern of bannedCommands){
    if(pattern.test(source))failures.push(file+': comando Supabase destrutivo proibido ('+pattern.source.replace(/\\s\+/g,' ')+')');
  }
}

const migrationDir=path.join(repoRoot,'supabase/migrations');
const migrationFiles=fs.existsSync(migrationDir)
  ? fs.readdirSync(migrationDir).filter(name=>/^\d+_.+\.sql$/.test(name)).sort()
  : [];
const versions=new Map();
for(const file of migrationFiles){
  const version=file.match(/^(\d+)_/)?.[1]||'';
  if(versions.has(version))failures.push('supabase/migrations: timestamp duplicado '+version+' em '+versions.get(version)+' e '+file);
  else versions.set(version,file);

  const source=fs.readFileSync(path.join(migrationDir,file),'utf8');
  const destructivePublic=[
    /drop\s+schema\s+(?:if\s+exists\s+)?public\b/i,
    /drop\s+table\s+(?:if\s+exists\s+)?public\./i,
    /truncate\s+(?:table\s+)?public\./i,
    /delete\s+from\s+public\./i,
    /alter\s+table\s+public\./i,
    /update\s+supabase_migrations\./i,
    /delete\s+from\s+supabase_migrations\./i,
    /truncate\s+(?:table\s+)?supabase_migrations\./i
  ];
  for(const pattern of destructivePublic){
    if(pattern.test(source))failures.push('supabase/migrations/'+file+': operação fora do escopo LC detectada ('+pattern.source+')');
  }
}

if(migrationFiles.length===0)failures.push('supabase/migrations: nenhuma migration LC encontrada');

if(failures.length){
  console.error('LC database governance failed:\n'+failures.join('\n'));
  process.exit(1);
}
console.log('LC database governance passed: '+migrationFiles.length+' migrations versionadas; comandos destrutivos globais bloqueados.');
