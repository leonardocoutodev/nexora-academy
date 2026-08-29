import {test,expect} from '@playwright/test';
import {installMockSupabase,IDS} from './helpers/mock-supabase.js';
import {waitForStablePage} from './helpers/quality.js';

test.skip(process.env.LC_VISUAL_COMPARE!=='true','Visual baseline cache is not available yet.');

const cases=[
  {name:'home-desktop',path:'/',viewport:{width:1440,height:900}},
  {name:'support-mobile',path:'/pages/apoie.html',viewport:{width:390,height:844}},
  {name:'login-desktop',path:'/pages/login.html',viewport:{width:1440,height:900}},
  {name:'course-mobile',path:'/pages/curso.html?id='+IDS.course,viewport:{width:390,height:844},mock:'student'},
  {name:'lesson-mobile',path:'/pages/aula.html?id='+IDS.lesson,viewport:{width:390,height:844},mock:'student'},
  {name:'admin-desktop',path:'/pages/admin/#analytics',viewport:{width:1440,height:900},mock:'admin'}
];

for(const item of cases){
  test('visual '+item.name,async({page})=>{
    await page.setViewportSize(item.viewport);
    if(item.mock)await installMockSupabase(page,{role:item.mock});
    else await page.route('https://kvwsqfnyebyjncfgvqnd.supabase.co/**',route=>route.abort());
    await page.goto(item.path);await waitForStablePage(page);
    await expect(page).toHaveScreenshot(item.name+'.png',{fullPage:true,animations:'disabled'});
  });
}
