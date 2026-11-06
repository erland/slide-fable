import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
const server=spawn('node',['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5199','--strictPort'],{stdio:['ignore','pipe','pipe']});
const serverErrors=[];server.stderr.on('data',d=>serverErrors.push(String(d)));
await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(new Error('Vite did not start: '+serverErrors.join(''))),25000);server.stdout.on('data',d=>{if(String(d).includes('5199')){clearTimeout(timeout);resolve();}});server.on('exit',code=>{clearTimeout(timeout);reject(Error('Vite exited '+code));});});
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE,args:['--no-sandbox','--disable-dev-shm-usage']}:{})});
try{
 for(const viewport of [{name:'desktop',width:1440,height:900},{name:'ipad-portrait',width:820,height:1180},{name:'mobile',width:390,height:844}]){
  const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height}}),page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:5199/');
  const snapshot=()=>page.evaluate(async()=>structuredClone((await import('/src/core/editor.ts')).editorStore.getSnapshot().doc));
  await page.evaluate(async()=>{const store=(await import('/src/core/editor.ts')).editorStore;store.addSlide('content');store.selectSlide(store.getSnapshot().doc.slides[0].id);});
  await page.getByRole('tab',{name:'Design',exact:true}).click();
  const bg=page.getByRole('group',{name:'Bildbakgrund'}),scope=bg.getByLabel('Bakgrund gäller');
  assert.equal(await scope.inputValue(),'current');
  const before=await snapshot();assert.equal(before.slides.length,2);
  const reset=bg.getByRole('button',{name:'Återställ bakgrund'});assert.equal(await reset.isDisabled(),true);
  await bg.getByRole('button',{name:'Bakgrund Blå'}).click();
  const single=await snapshot();
  assert.equal(single.slides[0].view.background.color,'#dceafa');
  assert.equal(single.slides[1].view.background,undefined,'Other slide must be unchanged');
  assert.deepEqual(single.theme,before.theme,'Theme must not be modified by one-slide background');
  assert.equal(await reset.isEnabled(),true);
  await reset.click();
  const restored=await snapshot();assert.equal(restored.slides[0].view.background,undefined);
  assert.deepEqual(restored.theme,before.theme);
  await scope.selectOption('all');
  await bg.getByRole('button',{name:'Bakgrund Mörk'}).click();
  const all=await snapshot();assert.deepEqual(all.slides.map(s=>s.view.background?.color),['#173944','#173944']);
  await page.locator('.editor-header').getByRole('button',{name:'Ångra',exact:true}).first().click();
  assert.deepEqual((await snapshot()).slides.map(s=>s.view.background),[undefined,undefined],'Undo must restore both slides');
  await page.locator('.editor-header').getByRole('button',{name:'Gör om',exact:true}).first().click();
  assert.deepEqual((await snapshot()).slides.map(s=>s.view.background?.color),['#173944','#173944'],'Redo must reapply both slides');
  await scope.selectOption('current');
  await bg.getByLabel('Välj bakgrundsfärg').fill('#112233');
  assert.equal((await snapshot()).slides[0].view.background.color,'#112233');
  assert.equal((await snapshot()).slides[1].view.background.color,'#173944');
  await scope.selectOption('all');await reset.click();
  const cleared=await snapshot();assert.deepEqual(cleared.slides.map(s=>s.view.background),[undefined,undefined]);
  assert.deepEqual(cleared.theme,before.theme,'All-slide reset must preserve theme');
  const rev=cleared.document.revision;
  assert.equal(await reset.isDisabled(),true);
  assert.equal((await snapshot()).document.revision,rev,'Rendering must not mutate document');
  assert.deepEqual(errors,[]);console.log('PASS background controls '+viewport.name);await context.close();
 }
}finally{await browser.close();server.kill();}
