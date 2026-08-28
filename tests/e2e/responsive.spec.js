import {test,expect} from '@playwright/test';
import {installMockSupabase,IDS} from './helpers/mock-supabase.js';
import {expectNoHorizontalOverflow,expectPrimaryTargets,waitForStablePage} from './helpers/quality.js';

const widths=[320,360,375,390,412,430];
const pages=[
  {name:'curso',path:'/pages/curso.html?id='+IDS.course,role:'student'},
  {name:'aula',path:'/pages/aula.html?id='+IDS.lesson,role:'student'},
  {name:'data-model-lab',path:'/pages/aula.html?id='+IDS.lessonData,role:'student'},
  {name:'expression-lab',path:'/pages/aula.html?id='+IDS.lessonExpression,role:'student'},
  {name:'admin',path:'/pages/admin/#analytics',role:'admin'}
];

for(const width of widths){
  for(const entry of pages){
    test('mobile '+width+'px · '+entry.name,async({page},testInfo)=>{
      await page.setViewportSize({width,height:844});
      await installMockSupabase(page,{role:entry.role});
      await page.goto(entry.path);await waitForStablePage(page);
      await expectNoHorizontalOverflow(page);
      await expectPrimaryTargets(page,44);
      const nav=page.locator('.bottom-nav:visible');
      if(await nav.count()){
        const box=await nav.boundingBox();
        expect(box?.x??0).toBeGreaterThanOrEqual(-1);
        expect((box?.x??0)+(box?.width??0)).toBeLessThanOrEqual(width+1);
      }
      await testInfo.attach(entry.name+'-'+width+'.png',{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
    });
  }
}
