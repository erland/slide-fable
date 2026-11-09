import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';

const port=5213;
const server=spawn('node',['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',String(port),'--strictPort'],{stdio:['ignore','pipe','pipe']});
let browser;
const picture=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/nwAAAABJRU5ErkJggg==','base64');
const replacementPicture=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGNkYPjPwMDAxMDAwMDAAAALHwEDmIWXfgAAAABJRU5ErkJggg==','base64');
const workspace=page=>page.locator('#workspace');
const snapshot=page=>page.evaluate(async()=>structuredClone((await import('/src/core/editor.ts')).editorStore.getSnapshot()));
try{
 await new Promise((resolve,reject)=>{let log='';const timer=setTimeout(()=>reject(Error('Vite did not start: '+log)),20000);server.stdout.on('data',d=>{log+=d;if(log.includes(String(port))){clearTimeout(timer);resolve();}});server.on('exit',code=>{clearTimeout(timer);reject(Error('Vite exited '+code));});});
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE,args:['--no-sandbox','--disable-dev-shm-usage']}:{})});
 for(const view of [{name:'desktop',width:1440,height:900},{name:'ipad-portrait',width:820,height:1180},{name:'mobile',width:390,height:844}]){
  const context=await browser.newContext({viewport:{width:view.width,height:view.height}});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${port}/`);
  const created=await page.evaluate(async()=>{const {editorStore:s}=await import('/src/core/editor.ts');return s.add('shape');});
  assert.deepEqual((await snapshot(page)).selected,[created],view.name+': shape selected');
  const nav=page.getByRole('navigation',{name:'Arbetsytans paneler'});
  if(view.name==='desktop'){
   const toggle=page.locator('.editor-canvas-pane>.properties-toggle');
   await toggle.getByText('Dölj egenskaper').click();
   assert.equal(await workspace(page).getAttribute('data-properties-open'),'false');
   await toggle.getByText('Visa egenskapspanel').click();
   assert.equal(await workspace(page).getAttribute('data-properties-open'),'true');
   assert.equal(await workspace(page).getAttribute('data-panel'),'properties','Reopen must activate property pane');
  }else{
   await nav.getByRole('button',{name:'Egenskaper'}).click();
   assert.equal(await workspace(page).getAttribute('data-panel'),'properties');
  }
  const pane=page.getByRole('complementary',{name:'Egenskaper'});
  await pane.getByRole('heading',{name:'Objektegenskaper'}).waitFor();
  await pane.getByRole('combobox',{name:'Formtext horisontellt'}).selectOption('left');
  assert.equal((await snapshot(page)).doc.slides[0].view.elements.find(e=>e.id===created).style.align,'left',view.name+': formatting persists');
  if(view.name!=='desktop'){
   await nav.getByRole('button',{name:'Bilder'}).click();
   assert.equal(await workspace(page).getAttribute('data-panel'),'slides');
   await nav.getByRole('button',{name:'Arbetsyta'}).click();
   assert.deepEqual((await snapshot(page)).selected,[created],view.name+': selection survives panel navigation');
   await nav.getByRole('button',{name:'Egenskaper'}).click();
  }
  await pane.getByRole('button',{name:'Stäng egenskapspanel'}).click();
  assert.equal(await workspace(page).getAttribute('data-properties-open'),'false');
  assert.equal(await workspace(page).getAttribute('data-panel'),'canvas','Closing inspector must never leave properties view active');
  if(view.name==='desktop')await page.locator('.editor-canvas-pane>.properties-toggle').getByText('Visa egenskapspanel').click();
  else await nav.getByRole('button',{name:'Egenskaper'}).click();
  assert.equal(await pane.isVisible(),true,view.name+': properties can be reopened');
  const fileInput=page.locator('input[accept="image/png,image/jpeg,image/webp,image/svg+xml"]');
  await page.getByRole('tab',{name:'Infoga'}).click();
  await page.locator('.insert-gallery-group').getByRole('button',{name:'Bilder'}).click();
  await fileInput.setInputFiles({name:'original.png',mimeType:'image/png',buffer:picture});
  const imageHandle=await page.waitForFunction(async()=>{const s=(await import('/src/core/editor.ts')).editorStore.getSnapshot();const e=s.doc.slides[0].view.elements.find(e=>e.type==='image');return e?{id:e.id,assetRef:e.assetRef}:null;});
  const image=await imageHandle.jsonValue();
  if(view.name!=='desktop')await nav.getByRole('button',{name:'Egenskaper'}).click();
  await pane.getByRole('button',{name:'Ersätt bild'}).click();
  await fileInput.setInputFiles({name:'replacement.png',mimeType:'image/png',buffer:replacementPicture});
  // Wait for the asynchronous replacement transaction, not the already-embedded source image.
  await page.waitForFunction(async ({id,previousAssetRef})=>{const [{editorStore:store},{updateSafety}]=await Promise.all([import('/src/core/editor.ts'),import('/src/pwa/safety.ts')]);const s=store.getSnapshot();const e=s.doc.slides[0].view.elements.find(e=>e.id===id);return !updateSafety.getSnapshot().busy&&e&&e.assetRef!==previousAssetRef&&s.doc.assets[e.assetRef]?.uri?.startsWith('data:image/png');},{id:image.id,previousAssetRef:image.assetRef});
  const after=await snapshot(page),current=after.doc.slides[0].view.elements.find(e=>e.id===image.id);
  assert.notEqual(current.assetRef,image.assetRef,view.name+': image is replaced, not duplicated');
  assert.equal(after.doc.slides[0].view.elements.filter(e=>e.type==='image').length,1);
  assert.deepEqual(after.selected,[image.id],view.name+': replaced image remains selected');
  assert.equal(await pane.isVisible(),true,view.name+': properties stay accessible');
  assert.deepEqual(errors,[],view.name+': no page errors');
  console.log('PASS panel-workflow '+view.name);
  await context.close();
 }
}finally{if(browser)await browser.close();server.kill('SIGTERM');}
