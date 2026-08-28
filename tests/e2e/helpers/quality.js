export async function blockExternalFonts(page){
  await page.route(/https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/,route=>route.abort());
}

import {expect} from '@playwright/test';

export async function expectNoHorizontalOverflow(page,tolerance=1){
  const result=await page.evaluate(()=>({
    scrollWidth:document.documentElement.scrollWidth,
    clientWidth:document.documentElement.clientWidth,
    bodyWidth:document.body?.scrollWidth||0
  }));
  expect(result.scrollWidth,'document horizontal overflow').toBeLessThanOrEqual(result.clientWidth+tolerance);
  expect(result.bodyWidth,'body horizontal overflow').toBeLessThanOrEqual(result.clientWidth+tolerance);
}

export async function expectPrimaryTargets(page,min=44){
  const failures=await page.locator('button:visible, a.v3-btn:visible, a.btn:visible, a.btn-secondary:visible, input:visible, select:visible, textarea:visible').evaluateAll((els,minSize)=>els.map(el=>{
    const r=el.getBoundingClientRect();
    return {tag:el.tagName,text:(el.textContent||el.getAttribute('aria-label')||'').trim().slice(0,60),w:r.width,h:r.height};
  }).filter(x=>x.w>0&&x.h>0&&(x.h<minSize||x.w<minSize)),min);
  expect(failures,'interactive targets smaller than '+min+'px: '+JSON.stringify(failures)).toEqual([]);
}

export async function waitForStablePage(page){
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate(()=>document.fonts?.ready).catch(()=>{});
  await page.waitForTimeout(120);
}
