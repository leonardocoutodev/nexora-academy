import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {blockExternalFonts,expectNoHorizontalOverflow,waitForStablePage} from './helpers/quality.js';

for(const entry of [
  {path:'/',title:/LC/},
  {path:'/pages/login.html',title:/Entrar — LC/},
  {path:'/pages/cadastro.html',title:/Criar conta — LC/},
  {path:'/pages/apoie.html',title:/Transparência e Apoio — LC/},
  {path:'/pages/privacidade.html',title:/Privacidade — LC/},
  {path:'/pages/termos.html',title:/Termos de uso — LC/},
  {path:'/pages/certificacao.html',title:/Política de certificação — LC/}
]){
  test('@compat public route '+entry.path,async({page})=>{
    await blockExternalFonts(page);
    await page.route('https://kvwsqfnyebyjncfgvqnd.supabase.co/**',route=>route.abort());
    await page.goto(entry.path,{waitUntil:'commit',timeout:15_000});
    await expect(page).toHaveTitle(entry.title);
    await expect(page.locator('body')).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
}

test('public pages have no serious or critical accessibility violations',async({page})=>{
  await blockExternalFonts(page);
  await page.route('https://kvwsqfnyebyjncfgvqnd.supabase.co/**',route=>route.abort());
  for(const path of ['/','/pages/login.html','/pages/cadastro.html','/pages/apoie.html','/pages/privacidade.html','/pages/termos.html','/pages/certificacao.html']){
    await page.goto(path);await waitForStablePage(page);
    const results=await new AxeBuilder({page}).analyze();
    const severe=results.violations.filter(v=>['serious','critical'].includes(v.impact));
    expect(severe.map(v=>({id:v.id,impact:v.impact,help:v.help,nodes:v.nodes.map(n=>n.target)}))).toEqual([]);
  }
});

test('signup form exposes clear native validation',async({page})=>{
  await blockExternalFonts(page);
  await page.goto('/pages/cadastro.html');
  await page.getByRole('button',{name:/Criar conta gratuita/}).click();
  const invalid=await page.locator('#name').evaluate(el=>!el.checkValidity());
  expect(invalid).toBe(true);
});


test('student referral survives signup confirmation and is claimed on first login',async({page})=>{
  await blockExternalFonts(page);
  const code='LCFABC123456';
  const userId='aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa';
  let claimedCode='';
  await page.route('https://kvwsqfnyebyjncfgvqnd.supabase.co/auth/v1/signup',route=>route.fulfill({
    status:200,contentType:'application/json',
    body:JSON.stringify({user:{id:userId,identities:[{id:'identity-qa'}]}})
  }));
  await page.route('https://kvwsqfnyebyjncfgvqnd.supabase.co/auth/v1/token?grant_type=password',route=>route.fulfill({
    status:200,contentType:'application/json',
    body:JSON.stringify({access_token:'qa-access',refresh_token:'qa-refresh',expires_in:3600,user:{id:userId}})
  }));
  await page.route('https://kvwsqfnyebyjncfgvqnd.supabase.co/rest/v1/rpc/claim_student_referral',route=>{
    claimedCode=route.request().postDataJSON()?.p_code||'';
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify([{claimed:true,reason:'claimed'}])});
  });
  await page.goto('/pages/cadastro.html?ref_student='+code);
  await expect.poll(()=>page.evaluate(()=>window.LCSupabase?.pendingStudentReferral?.()?.code||'')).toBe(code);
  await page.evaluate(async()=>window.LCSupabase.signUp({name:'Aluno Indicado QA',email:'indicado@lc.invalid',password:'LcQA!2026Test'}));
  const pending=await page.evaluate(()=>window.LCSupabase.pendingStudentReferral());
  expect(pending.signup_user_id).toBe(userId);
  await page.evaluate(async()=>window.LCSupabase.signIn({email:'indicado@lc.invalid',password:'LcQA!2026Test'}));
  expect(claimedCode).toBe(code);
  expect(await page.evaluate(()=>window.LCSupabase.pendingStudentReferral())).toBeNull();
});
