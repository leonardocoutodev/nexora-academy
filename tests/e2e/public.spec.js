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
