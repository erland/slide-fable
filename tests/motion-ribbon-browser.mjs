import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
const port=5211;
const server=spawn('node',['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',String(port),'--strictPort'],{stdio:['ignore','pipe','pipe']});
let browser;
try{
 await new Promise((resolve,reject)=>{let logs='';const timer=setTimeout(()=>reject(Error('Vite startup: '+logs)),20000);server.stdout.on('data',d=>{logs+=d;if(logs.includes(String(port))){clearTimeout(timer);resolve();}});server.on('exit',code=>{clearTimeout(timer);reject(Error('Vite exit: '+code));});});
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE,args:['--no-sandbox','--disable-dev-shm-usage']}:{})});
 for(const viewport of [{name:'desktop',width:1440,height:900},{name:'ipad-portrait',width:820,height:1180},{name:'mobile',width:390,height:844}]){
  const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height}}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.goto(`http://127.0.0.1:${port}/`);
  const model=()=>page.evaluate(async()=>structuredClone((await import('/src/core/editor.ts')).editorStore.getSnapshot().doc));
  const initial=await model();
  // Regression: a ribbon command must restore a panel that the user explicitly closed.
  await page.getByRole('tab',{name:'Visa',exact:true}).click();
  await page.getByRole('button',{name:'Övergångar och animeringar',exact:true}).click();
  assert.equal(await page.locator('#workspace').getAttribute('data-properties-open'),'true',viewport.name+': details opened');
  assert.equal(await page.locator('#workspace').getAttribute('data-panel'),'properties',viewport.name+': effects selected');
  assert.equal(await page.getByRole('button',{name:'Effekter',exact:true}).getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('#slide-properties').isVisible(),true,viewport.name+': effects panel visible');
  await page.getByRole('button',{name:'Stäng egenskapspanel'}).click();
  assert.equal(await page.locator('#workspace').getAttribute('data-properties-open'),'false',viewport.name+': closed by user');
  if(viewport.width<=800)await page.getByRole('button',{name:'Arbetsyta',exact:true}).click();
  await page.getByRole('button',{name:'Övergångar och animeringar',exact:true}).click();
  assert.equal(await page.locator('#slide-properties').isVisible(),true,viewport.name+': command reopens closed panel');
  assert.equal(await page.getByRole('button',{name:'Effekter',exact:true}).getAttribute('aria-pressed'),'true');
  for(const name of ['Övergångar','Animeringar','Bildspel'])assert.equal(await page.getByRole('tab',{name,exact:true}).count(),1);
  await page.getByRole('tab',{name:'Övergångar',exact:true}).click();
  const transitions=page.getByRole('group',{name:'Bildövergångar'});
  await transitions.getByLabel('Övergångseffekt').selectOption('fade');
  assert.equal((await model()).slides[0].delivery.transition.type,'fade');
  await transitions.getByLabel('Övergångstid').fill('900');await transitions.getByLabel('Övergångstid').press('Tab');
  assert.equal((await model()).slides[0].delivery.transition.durationMs,900);
  await page.getByRole('tab',{name:'Animeringar',exact:true}).click();
  const animation=page.getByRole('group',{name:'Objektanimeringar'});
  assert.equal(await animation.getByRole('button',{name:'Visa',exact:true}).isDisabled(),true);
  const id=await page.evaluate(async()=>{const store=(await import('/src/core/editor.ts')).editorStore;const id=store.add('shape');store.select([id]);return id;});
  assert.equal(await animation.getByRole('button',{name:'Visa',exact:true}).isEnabled(),true);
  await animation.getByRole('button',{name:'Tona in',exact:true}).click();
  const animated=await model();assert.equal(animated.slides[0].animations.length,1);assert.equal(animated.slides[0].animations[0].targetId,id);
  await animation.getByRole('button',{name:'Ordna animeringar'}).click();
  assert.equal(await page.locator('.animation-panel').isVisible(),true);
  await page.getByRole('tab',{name:'Bildspel',exact:true}).click();
  const slideshow=page.getByRole('group',{name:'Bildspelsverktyg'});
  await slideshow.getByRole('button',{name:'Från aktuell bild'}).click();
  await page.getByRole('button',{name:'Avsluta',exact:true}).click();
  assert.deepEqual(await model(),animated,'Preview must not modify document');
  await slideshow.getByRole('button',{name:'Från början'}).click();
  await page.getByRole('button',{name:'Avsluta',exact:true}).click();
  assert.deepEqual(await model(),animated,'Start slideshow must not modify document');
  // SF-ANIM-02: return to editor and explicitly reselect the animated shape.
  await page.evaluate(async targetId=>(await import('/src/core/editor.ts')).editorStore.select([targetId]),id);
  await page.getByRole('tab',{name:'Animeringar',exact:true}).click();
  const advanced=page.getByRole('group',{name:'Objektanimeringar'});
  await advanced.getByRole('button',{name:'Flyg in',exact:true}).click();
  const fly=(await model()).slides[0].animations.at(-1);
  assert.equal(fly.effect,'fly-in',viewport.name+' fly in created');
  await advanced.getByRole('button',{name:'Ordna animeringar'}).click();
  const dir=page.locator('.animation-panel').getByLabel('Riktning 2');
  await dir.selectOption('Uppifrån');
  assert.deepEqual((await model()).slides[0].animations.at(-1).from.offset,{x:0,y:-1},viewport.name+' direction saved');
  // SF-ANIM-05: timing overview reflects the shared playback scheduler and live editing.
  const timing=page.locator('.animation-panel .animation-timing');
  assert.equal(await timing.count(),2,viewport.name+' two scheduled effects');
  assert.match(await timing.nth(1).innerText(),/Klick 2 · Start 0 ms · Varaktighet 400 ms/);
  await page.locator('.animation-panel').getByRole('spinbutton',{name:'Fördröjning 2',exact:true}).fill('150');
  await page.locator('.animation-panel').getByRole('spinbutton',{name:'Fördröjning 2',exact:true}).press('Tab');
  assert.match(await timing.nth(1).innerText(),/Klick 2 · Start 150 ms · Varaktighet 400 ms/,viewport.name+' delay updates displayed start');
  await page.locator('.animation-panel').getByLabel('Start 2').selectOption('with-previous');
  assert.match(await timing.nth(1).innerText(),/Klick 1 · Start 150 ms · Varaktighet 400 ms/,viewport.name+' grouped timing follows trigger');
  // SF-ANIM-06: adjust PPD timing directly from the overview; every click is undoable.
  const adjust=page.locator('.animation-panel').getByRole('group',{name:'Justera timing 2'});
  await adjust.getByRole('button',{name:'Öka fördröjning 2'}).click();
  assert.match(await timing.nth(1).innerText(),/Klick 1 · Start 250 ms · Varaktighet 400 ms/,viewport.name+' direct delay increase');
  await adjust.getByRole('button',{name:'Minska fördröjning 2'}).click();
  assert.match(await timing.nth(1).innerText(),/Klick 1 · Start 150 ms · Varaktighet 400 ms/,viewport.name+' direct delay decrease');
  await adjust.getByRole('button',{name:'Öka varaktighet 2'}).click();
  assert.match(await timing.nth(1).innerText(),/Varaktighet 500 ms/,viewport.name+' direct duration increase');
  const editedTiming=(await model()).slides[0].animations[1];
  assert.equal(editedTiming.delayMs,150);
  assert.equal(editedTiming.durationMs,500);
  await page.evaluate(async()=>(await import('/src/core/editor.ts')).editorStore.undo());
  assert.match(await timing.nth(1).innerText(),/Varaktighet 400 ms/,viewport.name+' direct edit can be undone');
  await page.evaluate(async()=>(await import('/src/core/editor.ts')).editorStore.redo());
  assert.match(await timing.nth(1).innerText(),/Varaktighet 500 ms/,viewport.name+' direct edit can be redone');
  const listId=await page.evaluate(async()=>{
   const store=(await import('/src/core/editor.ts')).editorStore;
   const id=store.add('text');
   store.updateElement(id,{text:{paragraphs:[
    {id:'b0',runs:[{text:'Punkt ett'}],paragraphStyle:{listType:'bullet'}},
    {id:'b1',runs:[{text:'Punkt två'}],paragraphStyle:{listType:'bullet'}},
    {id:'b2',runs:[{text:'Punkt tre'}],paragraphStyle:{listType:'bullet'}}
   ]}});
   store.select([id]);return id;
  });
  assert.equal(await advanced.getByRole('button',{name:'Punkter stegvis'}).isEnabled(),true);
  await advanced.getByRole('button',{name:'Punkter stegvis'}).click();
  const listAnimations=(await model()).slides[0].animations.filter(a=>a.targetId===listId);
  assert.deepEqual(listAnimations.map(a=>a.from.paragraph.x),[0,1,2],viewport.name+' sequential bullet model');
  // SF-ANIM-04: preview steps inside editor, without entering presenter mode or changing the PPD.
  const beforePreview=await model();
  await page.locator('.animation-panel').getByRole('button',{name:'Förhandsvisa från aktuell bild'}).click();
  const preview=page.getByRole('dialog',{name:'Förhandsvisa animationer'});
  assert.equal(await preview.isVisible(),true,viewport.name+' editor preview opens');
  assert.equal(await page.locator('.presenter').count(),0,viewport.name+' no presenter mode');
  assert.equal(await preview.locator('[data-preview-step]').getAttribute('data-preview-step'),'0');
  await preview.getByRole('button',{name:'Nästa steg'}).click();
  assert.equal(await preview.locator('[data-preview-step]').getAttribute('data-preview-step'),'1');
  await preview.getByRole('button',{name:'Föregående steg'}).click();
  assert.equal(await preview.locator('[data-preview-step]').getAttribute('data-preview-step'),'0');
  await preview.getByRole('button',{name:'Stäng animationsförhandsvisning'}).click();
  assert.equal(await preview.count(),0,viewport.name+' preview closes');
  assert.deepEqual(await model(),beforePreview,viewport.name+' preview is read only');
  console.log('PASS directional effects and bullet animation UI '+viewport.name);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),viewport.name+': no horizontal overflow');
  assert.deepEqual(errors,[],viewport.name+': no browser errors');
  console.log('PASS motion ribbon '+viewport.name);
  await context.close();
 }
}finally{if(browser)await browser.close();server.kill('SIGTERM');}
