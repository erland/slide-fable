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
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),viewport.name+': no horizontal overflow');
  assert.deepEqual(errors,[],viewport.name+': no browser errors');
  console.log('PASS motion ribbon '+viewport.name);
  await context.close();
 }
}finally{if(browser)await browser.close();server.kill('SIGTERM');}
