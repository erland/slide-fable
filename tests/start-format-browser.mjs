import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';

const port=5207;
const server=spawn('node',['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',String(port),'--strictPort'],{stdio:['ignore','pipe','pipe']});
let browser;
try{
 await new Promise((resolve,reject)=>{let log='';const timer=setTimeout(()=>reject(Error('Vite did not start: '+log)),20000);server.stdout.on('data',d=>{log+=d;if(log.includes(String(port))){clearTimeout(timer);resolve();}});server.on('exit',code=>{clearTimeout(timer);reject(Error('Vite exited '+code));});});
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE,args:['--no-sandbox','--disable-dev-shm-usage']}:{})});
 for(const viewport of [{name:'desktop',width:1440,height:900},{name:'ipad-portrait',width:820,height:1180},{name:'mobile',width:390,height:844}]){
  const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height}}),page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${port}/`);
  const start=page.getByRole('tab',{name:'Start',exact:true}),tab=page.getByRole('tabpanel',{name:'Start'});
  await start.click();
  assert.equal(await tab.getByRole('group',{name:'Snabbformatering av markerat objekt'}).count(),0,'No formatting without selection');
  assert.equal(await tab.getByRole('group',{name:'Vanliga kommandon'}).getByRole('button',{name:'Ny bild'}).count(),1,'Common commands available');
  const info=await page.evaluate(async()=>{const {editorStore:s}=await import('/src/core/editor.ts');const text=s.add('text');return {text};});
  const quick=tab.getByRole('group',{name:'Snabbformatering av markerat objekt'});
  await quick.waitFor();
  assert.equal(await tab.getByText('Markerad text',{exact:true}).count(),1);
  await quick.getByRole('spinbutton',{name:'Textstorlek'}).fill('44');
  await quick.getByRole('spinbutton',{name:'Textstorlek'}).press('Tab');
  const doc=()=>page.evaluate(async()=>{const {editorStore:s}=await import('/src/core/editor.ts');return structuredClone(s.getSnapshot().doc);});
  let current=await doc();
  assert.equal(current.slides[0].view.elements.find(e=>e.id===info.text).style.fontSize,44,'Quick formatting changes model');
  await tab.getByRole('button',{name:'Visa Formatera'}).click();
  assert.equal(await page.getByRole('tab',{name:'Formatera'}).getAttribute('aria-selected'),'true');
  await page.getByRole('tabpanel',{name:'Formatera'}).getByRole('group',{name:'Snabbformatering av markerat objekt'}).waitFor();
  await start.click();
  await page.evaluate(async()=>{const {editorStore:s}=await import('/src/core/editor.ts');s.add('shape');});
  assert.equal(await tab.getByText('Markerad form',{exact:true}).count(),1);
  const before=await doc();
  await quick.getByRole('spinbutton',{name:'Ramtjocklek'}).fill('5');
  await quick.getByRole('spinbutton',{name:'Ramtjocklek'}).press('Tab');
  assert.notDeepEqual(await doc(),before,'Shape quick formatting changes presentation');
  await page.evaluate(async id=>{const {editorStore:s}=await import('/src/core/editor.ts');s.select([id,s.getSnapshot().selected[0]]);},info.text);
  assert.equal(await tab.getByText('2 objekt markerade').count(),1);
  // Different fills should never be presented as one authoritative swatch.
  await page.evaluate(async()=>{
   const {editorStore:s}=await import('/src/core/editor.ts');
   const ids=s.getSnapshot().selected;
   s.select([ids[0]]);s.formatSelected({key:'fill',value:'#cc0000'});
   s.select([ids[1]]);s.formatSelected({key:'fill',value:'#0000cc'});
   s.select(ids);
  });
  const fill=quick.getByLabel('Fyllning',{exact:true});
  assert.match(await fill.getAttribute('aria-describedby'),/ribbon-format-fill-status/);
  assert.equal(await quick.locator('#ribbon-format-fill-status').textContent(),'Blandade färger');
  await tab.getByRole('button',{name:'Visa Formatera'}).click();
  assert.equal(await page.getByRole('tabpanel',{name:'Formatera'}).locator('#ribbon-format-fill-status').textContent(),'Blandade färger');
  await start.click();
  await quick.getByRole('spinbutton',{name:'Textstorlek'}).waitFor();
  await page.evaluate(async()=>{const {editorStore:s}=await import('/src/core/editor.ts');s.select([]);});
  assert.equal(await tab.getByRole('group',{name:'Snabbformatering av markerat objekt'}).count(),0);
  assert.deepEqual(errors,[],viewport.name+' page errors');
  console.log('PASS start-format '+viewport.name);
  await context.close();
 }
}finally{if(browser)await browser.close();server.kill('SIGTERM');}
