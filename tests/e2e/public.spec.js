import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {expectNoHorizontalOverflow,waitForStablePage} from './helpers/quality.js';

for(const entry of [
  {path:'/',title:/LC/},
  {path:'/pages/login.html',title:/Entrar — LC/},
  {path:'/pages/cadastro.html',title:/Criar conta — LC/}
]){
  test('@compat public route '+entry.path,async({page})=>{
    await page.goto(entry.path);
    await expect(page).toHaveTitle(entry.title);
    await expect(page.locator('body')).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
}

test('public pages have no serious or critical accessibility violations',async({page})=>{
  for(const path of ['/','/pages/login.html','/pages/cadastro.html']){
    await page.goto(path);await waitForStablePage(page);
    const results=await new AxeBuilder({page}).analyze();
    const severe=results.violations.filter(v=>['serious','critical'].includes(v.impact));
    expect(severe.map(v=>({id:v.id,impact:v.impact,help:v.help,nodes:v.nodes.map(n=>n.target)}))).toEqual([]);
  }
});

test('signup form exposes clear native validation',async({page})=>{
  await page.goto('/pages/cadastro.html');
  await page.getByRole('button',{name:/Criar conta gratuita/}).click();
  const invalid=await page.locator('#name').evaluate(el=>!el.checkValidity());
  expect(invalid).toBe(true);
});
