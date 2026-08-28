import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {installMockSupabase,IDS} from './helpers/mock-supabase.js';
import {expectNoHorizontalOverflow,waitForStablePage} from './helpers/quality.js';

test.beforeEach(async({page})=>{await installMockSupabase(page,{role:'admin'})});

test('@compat admin analytics renders operational data',async({page})=>{
  await page.goto('/pages/admin/#analytics',{waitUntil:'commit',timeout:15_000});
  await expect(page.getByRole('heading',{name:'Analytics educacional'})).toBeVisible();
  await expect(page.locator('#analyticsActive')).toHaveText('18');
  await expect(page.locator('#analyticsMobile')).toContainText('68');
  await expect(page.getByText('Saúde das formações')).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test('admin can inspect student academic detail',async({page})=>{
  await page.goto('/pages/admin/#students');
  await page.locator('[data-student="'+IDS.user+'"]').click();
  await expect(page.locator('#studentDialog')).toBeVisible();
  await expect(page.getByRole('heading',{name:'Aluno QA'})).toBeVisible();
  await expect(page.getByText('Progresso por curso')).toBeVisible();
  await expect(page.getByText('70%')).toBeVisible();
});

test('admin Boss review can approve with score',async({page})=>{
  await page.goto('/pages/admin/#boss');
  await page.locator('[data-boss-score="'+IDS.submission+'"]').fill('90');
  await page.locator('[data-boss-feedback="'+IDS.submission+'"]').fill('Boa evidência e validação.');
  await page.locator('[data-boss-action="approved"][data-boss-id="'+IDS.submission+'"]').click();
  await expect(page.locator('#adminToast')).toContainText('Boss Fight aprovada');
});

test('admin has no serious accessibility violations',async({page})=>{
  await page.goto('/pages/admin/#analytics');await waitForStablePage(page);
  const results=await new AxeBuilder({page}).analyze();
  const severe=results.violations.filter(v=>['serious','critical'].includes(v.impact));
  expect(severe.map(v=>({id:v.id,impact:v.impact,help:v.help,nodes:v.nodes.map(n=>n.target)}))).toEqual([]);
});
