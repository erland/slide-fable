import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
const port=5204,server=spawn('node',['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',String(port),'--strictPort'],{stdio:['ignore','pipe','pipe']});
const errors=[];server.stderr.on('data',x=>errors.push(String(x)));
await new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(Error('Vite startup timeout '+errors.join(''))),25000);server.stdout.on('data',x=>{if(String(x).includes(String(port))){clearTimeout(t);resolve();}});server.on('exit',x=>{clearTimeout(t);reject(Error('Vite exited '+x));});});
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE,args:['--no-sandbox','--disable-dev-shm-usage']}:{})});
try{
 for(const v of [{name:'desktop',width:1440,height:900},{name:'ipad-portrait',width:820,height:1180},{name:'mobile',width:390,height:844}]){
  const ctx=await browser.newContext({viewport:{width:v.width,height:v.height}}),page=await ctx.newPage(),pageErrors=[];
  page.on('pageerror',e=>pageErrors.push(e.message));await page.goto(`http://127.0.0.1:${port}/`);
  const snapshot=()=>page.evaluate(async()=>structuredClone((await import('/src/core/editor.ts')).editorStore.getSnapshot().doc));
  await page.getByRole('tab',{name:'Design'}).click();await page.getByRole('button',{name:'Anpassa design…'}).click();
  const editor=page.getByRole('region',{name:'Redigera bildmaster och layouter'});await editor.waitFor();
  const before=await snapshot(),id=before.masters[0].layouts[0].id,originalSlide=structuredClone(before.slides[0]);
  const x=editor.getByLabel('Platshållare x');await x.fill('180');await x.press('Tab');
  const edited=await snapshot();assert.equal(edited.masters[0].layouts[0].placeholders[0].geometry.x,180,v.name);
  assert.deepEqual(edited.slides[0],originalSlide,'Slide content remains untouched');
  await editor.getByLabel('Layoutnamn').fill('Rubriksida');await editor.getByLabel('Layoutnamn').press('Tab');
  assert.equal((await snapshot()).masters[0].layouts[0].name,'Rubriksida');
  await editor.getByLabel('Masterbakgrund').fill('#223344');
  assert.equal((await snapshot()).masters[0].background.color,'#223344');
  await editor.getByLabel('Layoutbakgrund').fill('#aabbcc');
  assert.equal((await snapshot()).masters[0].layouts[0].background.color,'#aabbcc');
  await editor.getByRole('button',{name:'Ärv bakgrund från master'}).click();
  assert.equal((await snapshot()).masters[0].layouts[0].background,undefined);
  await editor.getByRole('button',{name:'Duplicera layout'}).click();
  const after=await snapshot();assert.equal(after.masters[0].layouts.length,before.masters[0].layouts.length+1);
  assert.notEqual(after.masters[0].layouts.at(-1).id,id);
  assert.equal(await page.getByRole('group',{name:'Välj bildlayout'}).getByRole('button',{name:'Använd layout Rubriksida – kopia'}).count(),1);
  await page.locator('.editor-header').getByRole('button',{name:'Ångra',exact:true}).first().click();
  assert.equal((await snapshot()).masters[0].layouts.length,before.masters[0].layouts.length);
  assert.deepEqual(pageErrors,[],v.name+': page errors');console.log('PASS master layout '+v.name);await ctx.close();
 }
}finally{await browser.close();server.kill('SIGTERM');}
