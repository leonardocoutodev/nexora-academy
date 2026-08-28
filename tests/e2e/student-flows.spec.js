import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {installMockSupabase,IDS} from './helpers/mock-supabase.js';
import {expectNoHorizontalOverflow,waitForStablePage} from './helpers/quality.js';

test.beforeEach(async({page})=>{await installMockSupabase(page)});

test('@compat course map renders authenticated learning flow',async({page})=>{
  await page.goto('/pages/curso.html?id='+IDS.course,{waitUntil:'commit',timeout:15_000});
  await expect(page.getByRole('heading',{name:'Lógica de Programação Básica'})).toBeVisible();
  await expect(page.getByText('Pensar antes de programar')).toBeVisible();
  await expect(page.getByRole('link',{name:/Continuar aulas/})).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test('lesson lab unlocks completion and persists mission',async({page})=>{
  await page.goto('/pages/aula.html?id='+IDS.lesson);
  await expect(page.getByRole('heading',{name:'O que é programar'})).toBeVisible();
  const complete=page.locator('#completeBtn');
  await expect(complete).toBeDisabled();
  for(const key of ['entrada','regra','saida','teste'])await page.locator('[data-logic="'+key+'"]').click();
  await page.locator('[data-logic-check]').click();
  await expect(page.locator('[data-feedback]')).toContainText('Algoritmo bem estruturado');
  await expect(complete).toBeEnabled();
  await complete.click();
  await expect(page.getByText(/Aula concluída/)).toBeVisible();
});

test('data model lab classifies roles before completion',async({page})=>{
  await page.goto('/pages/aula.html?id='+IDS.lessonData);
  await expect(page.getByRole('heading',{name:'Variáveis e constantes'})).toBeVisible();
  const selects=page.locator('[data-data-model-answer]');
  await selects.nth(0).selectOption('0');
  await selects.nth(1).selectOption('1');
  await selects.nth(2).selectOption('2');
  await selects.nth(3).selectOption('3');
  await page.locator('[data-data-model-check]').click();
  await expect(page.locator('[data-feedback]')).toContainText('Modelo correto');
  await expect(page.locator('#completeBtn')).toBeEnabled();
});

test('expression lab validates boundary cases',async({page})=>{
  await page.goto('/pages/aula.html?id='+IDS.lessonExpression);
  await expect(page.getByRole('heading',{name:'Expressões e fronteiras'})).toBeVisible();
  await page.locator('input[name="expressionLab"][value="1"]').check();
  await page.locator('[data-expression-check]').click();
  await expect(page.locator('[data-feedback]')).toContainText('preserva a fronteira');
  await expect(page.locator('#completeBtn')).toBeEnabled();
});

test('inline comprehension check gives local feedback',async({page})=>{
  await page.goto('/pages/aula.html?id='+IDS.lesson);
  await page.locator('[data-inline-option="0"]').first().click();
  await expect(page.locator('[data-inline-feedback]').first()).toContainText(/Isso|Correto/);
});

test('quiz completes with immediate feedback',async({page})=>{
  await page.goto('/pages/quiz.html?id='+IDS.assessment);
  await expect(page.getByRole('heading',{name:'Checkpoint aplicado'})).toBeVisible();
  await page.locator('input[name="answer"]').first().check();
  await page.getByRole('button',{name:'Verificar resposta'}).click();
  await expect(page.locator('#feedback')).toContainText('Correto');
  await page.getByRole('button',{name:/Finalizar avaliação/}).click();
  await expect(page.locator('#result')).toContainText('Aprovado');
});

test('Boss Fight accepts a valid public URL',async({page})=>{
  await page.goto('/pages/projetos.html');
  await page.locator('[data-url="'+IDS.project+'"]').fill('https://example.com/projeto');
  await page.locator('[data-submit="'+IDS.project+'"]').click();
  await expect(page.locator('[data-msg="'+IDS.project+'"]')).toContainText('Boss Fight enviado');
});

test('certificate can be issued after eligibility',async({page})=>{
  await page.goto('/pages/certificados.html');
  const issue=page.locator('[data-issue="'+IDS.course+'"]');
  await expect(issue).toBeVisible();
  await issue.click();
  const card=page.locator('[data-cert-card="'+IDS.course+'"]');
  await expect(card.getByText('CERTIFICADO EMITIDO',{exact:true})).toBeVisible();
  await expect(card.getByText('LC-QA-2026')).toBeVisible();
});

test('authenticated learning pages have no serious accessibility violations',async({page})=>{
  for(const path of ['/pages/curso.html?id='+IDS.course,'/pages/aula.html?id='+IDS.lesson,'/pages/quiz.html?id='+IDS.assessment]){
    await page.goto(path);await waitForStablePage(page);
    const results=await new AxeBuilder({page}).analyze();
    const severe=results.violations.filter(v=>['serious','critical'].includes(v.impact));
    expect(severe.map(v=>({id:v.id,impact:v.impact,help:v.help,nodes:v.nodes.map(n=>n.target)}))).toEqual([]);
  }
});
