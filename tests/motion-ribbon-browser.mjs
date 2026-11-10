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
  const groupHeaders=page.locator('.animation-panel .animation-click-group-header');
  assert.equal(await groupHeaders.count(),2,viewport.name+' separate click groups');
  assert.match(await groupHeaders.nth(0).innerText(),/Klicksteg 1.*1 animation/);
  assert.match(await groupHeaders.nth(1).innerText(),/Klicksteg 2.*1 animation/);
  assert.equal(await page.locator('.animation-panel .animation-start-kind').nth(1).innerText(),'Vid klick');
  assert.match(await timing.nth(1).innerText(),/Klick 2 · Start 0 ms · Varaktighet 400 ms/);
  await page.locator('.animation-panel').getByRole('spinbutton',{name:'Fördröjning 2',exact:true}).fill('150');
  await page.locator('.animation-panel').getByRole('spinbutton',{name:'Fördröjning 2',exact:true}).press('Tab');
  assert.match(await timing.nth(1).innerText(),/Klick 2 · Start 150 ms · Varaktighet 400 ms/,viewport.name+' delay updates displayed start');
  await page.locator('.animation-panel').getByLabel('Start 2').selectOption('with-previous');
  assert.match(await timing.nth(1).innerText(),/Klick 1 · Start 150 ms · Varaktighet 400 ms/,viewport.name+' grouped timing follows trigger');
  assert.equal(await groupHeaders.count(),1,viewport.name+' effects grouped into one click step');
  assert.match(await groupHeaders.first().innerText(),/Klicksteg 1.*2 animationer/);
  assert.equal(await page.locator('.animation-panel .animation-start-kind').nth(1).innerText(),'Med föregående');
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
  // SF-ANIM-07: drag the bar and right grip, then verify one document change on release.
  const timelineTrack=page.locator('.animation-timing-track[data-timing-index="2"]');
  const bar=timelineTrack.locator('.animation-timing-bar');
  const beforeDrag=(await model()).slides[0].animations[1];
  const barRect=await bar.boundingBox(),trackRect=await timelineTrack.boundingBox();
  assert.ok(barRect&&trackRect,viewport.name+' timeline geometry');
  const x=barRect.x+Math.min(15,barRect.width/2),y=barRect.y+barRect.height/2;
  await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+trackRect.width*.2,y,{steps:4});
  assert.equal((await model()).slides[0].animations[1].delayMs,beforeDrag.delayMs,viewport.name+' drag is preview only');
  const visual=page.locator('.animation-timing').nth(1).locator('.animation-timing-visual');
  assert.equal(await visual.getAttribute('data-timing-preview'),'true',viewport.name+' active drag preview');
  assert.match(await visual.innerText(),/Justerar · Start .*släpp för att spara/,viewport.name+' live timing label');
  await page.mouse.up();
  assert.equal(await visual.getAttribute('data-timing-preview'),'false',viewport.name+' preview ends on release');
  const afterMove=(await model()).slides[0].animations[1];
  assert.ok(afterMove.delayMs>beforeDrag.delayMs,viewport.name+' bar drag changes delay');
  const grip=timelineTrack.locator('[data-timing-handle="duration"]'),gripRect=await grip.boundingBox();
  assert.ok(gripRect,viewport.name+' resize handle geometry');
  const gx=gripRect.x+gripRect.width/2,gy=gripRect.y+gripRect.height/2;
  await page.mouse.move(gx,gy);await page.mouse.down();await page.mouse.move(gx+trackRect.width*.15,gy,{steps:4});
  assert.equal((await model()).slides[0].animations[1].durationMs,afterMove.durationMs,viewport.name+' resize is preview only');
  await page.mouse.up();
  const afterResize=(await model()).slides[0].animations[1];
  assert.ok(afterResize.durationMs>afterMove.durationMs,viewport.name+' grip changes duration');
  await page.evaluate(async()=>(await import('/src/core/editor.ts')).editorStore.undo());
  assert.equal((await model()).slides[0].animations[1].durationMs,afterMove.durationMs,viewport.name+' drag resize undo');
  await page.evaluate(async()=>(await import('/src/core/editor.ts')).editorStore.redo());
  assert.equal((await model()).slides[0].animations[1].durationMs,afterResize.durationMs,viewport.name+' drag resize redo');
  // SF-ANIM-08: pointer cancellation discards a pending drag and restores the timeline label.
  const unchanged=(await model()).slides[0].animations[1].delayMs;
  const barAfter=await timelineTrack.locator('.animation-timing-bar').boundingBox();
  assert.ok(barAfter,viewport.name+' bar is visible before cancellation');
  await page.mouse.move(barAfter.x+Math.min(14,barAfter.width/2),barAfter.y+barAfter.height/2);
  await page.mouse.down();
  await page.mouse.move(barAfter.x+Math.min(14,barAfter.width/2)+trackRect.width*.1,barAfter.y+barAfter.height/2,{steps:3});
  assert.equal(await visual.getAttribute('data-timing-preview'),'true');
  await page.evaluate(()=>{
   const track=document.querySelector('.animation-timing-track[data-timing-index="2"]');
   track.dispatchEvent(new PointerEvent('pointercancel',{bubbles:true,pointerId:1}));
  });
  await page.mouse.up();
  assert.equal(await visual.getAttribute('data-timing-preview'),'false',viewport.name+' cancelled drag returns to idle');
  assert.equal((await model()).slides[0].animations[1].delayMs,unchanged,viewport.name+' cancelled drag must not commit');
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
