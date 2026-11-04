/** End-to-end regression of text overflow policies on the editor canvas. */
import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';

const server=spawn('node',['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5196','--strictPort'],{stdio:['ignore','pipe','pipe']});
let browser;
try{
 await new Promise((resolve,reject)=>{
  let output='';
  const timeout=setTimeout(()=>reject(Error('Vite startup timeout: '+output)),20000);
  server.stdout.on('data',data=>{output+=String(data);if(output.includes('5196')){clearTimeout(timeout);resolve();}});
  server.on('exit',code=>{clearTimeout(timeout);reject(Error('Vite exited '+code+': '+output));});
 });
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE,args:['--no-sandbox','--disable-dev-shm-usage']}:{})});
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5196/');
 await page.getByRole('button',{name:'Lägg till bild',exact:true}).waitFor();
 const id=await page.evaluate(async()=>{
  const store=(await import('/src/core/editor.ts')).editorStore;
  store.addSlide('blank');
  const id=store.add('text');
  store.setElementGeometry(id,{x:40,y:40,width:320,height:70});
  store.editText(id,{paragraphs:[
   {id:'overflow-p1',runs:[{text:'Lång rubrik med svenska ÅÄÖ och många ord som ska radbrytas i den smala textrutan. ',marks:{bold:true}}]},
   {id:'overflow-p2',runs:[{text:'Det andra stycket är kursivt och innehåller ytterligare text som inte ska tappas vid byte av textläge.',marks:{italic:true}}]}
  ]});
  store.select([id]);return id;
 });
 const item=page.locator('.stage .render-element[data-element-id="'+id+'"]');
 const content=item.locator('.text-fit-content');
 const control=page.getByLabel('Hantering av textöverflöd');
 const snapshot=()=>page.evaluate(async id=>{
  const store=(await import('/src/core/editor.ts')).editorStore;
  const el=store.slide.view.elements.find(e=>e.id===id);
  return {height:el.geometry.height,text:JSON.stringify(el.text),revision:store.getSnapshot().doc.document.revision};
 },id);
 const base=await snapshot();
 assert.equal(await control.inputValue(),'clip');
 assert.equal(await item.locator('.text-overflow-warning').count(),0);
 console.log('PASS clip policy');

 await control.selectOption('warn');
 await item.locator('.text-overflow-warning').waitFor();
 assert.equal(await page.locator('.miniature .text-overflow-warning').count(),0);
 console.log('PASS warn editor-only indicator');

 await control.selectOption('shrink-to-fit');
 await item.locator('.text-overflow-warning').waitFor({state:'detached'});
 await page.waitForFunction(id=>{
  const el=document.querySelector('.stage .render-element[data-element-id="'+id+'"] .text-fit-content');
  if(!el)return false;
  const transform=getComputedStyle(el).transform;const scale=transform.startsWith('matrix(')?Number(transform.slice(7).split(',')[0]):1;
  return scale<.99;
 },id);
 const transform=await content.evaluate(el=>getComputedStyle(el).transform);
 assert.ok(transform.startsWith('matrix('));
 assert.equal((await snapshot()).height,base.height,'shrink must preserve model geometry');
 console.log('PASS shrink-to-fit visual scale, unchanged model height');

 const exportMetrics=await page.evaluate(async id=>{
  const {editorStore:store}=await import('/src/core/editor.ts');
  const {effective}=await import('/src/core/model.ts');
  const {measure}=await import('/src/export/officeShared.ts');
  const doc=store.getSnapshot().doc,slide=store.slide;
  const element=effective(doc,slide,slide.view.elements.find(e=>e.id===id));
  const fragments=await measure(doc,slide,element);
  const inner=document.querySelector('.stage .render-element[data-element-id="'+id+'"] .text-fit-content');
  const span=inner.querySelector('[data-run]'),transform=getComputedStyle(inner).transform;
  const scale=new DOMMatrixReadOnly(transform).a;
  return {scale,originalFont:parseFloat(getComputedStyle(span).fontSize),sizes:fragments.map(f=>f.size),text:fragments.map(f=>f.text).join('')};
 },id);
 assert.ok(exportMetrics.scale<.99,'The fixture must require real shrink-to-fit');
 assert.ok(exportMetrics.sizes.length>0,'Office fragment measurement must produce native text');
 assert.ok(exportMetrics.sizes.every(size=>Math.abs(size-exportMetrics.originalFont*exportMetrics.scale)<.25),'Office fragment font sizes must match rendered shrink scale');
 assert.ok(exportMetrics.text.includes('ÅÄÖ'),'Export fragments must retain Swedish characters');
 console.log('PASS PDF/PPTX shared text fragments match shrink-to-fit scale');


 await control.selectOption('expand-height');
 await page.waitForFunction(async id=>{
  const store=(await import('/src/core/editor.ts')).editorStore;
  return store.slide.view.elements.find(e=>e.id===id).geometry.height>70;
 },id);
 const expanded=await snapshot();
 assert.ok(expanded.height>base.height&&expanded.height<=960,'expanded height must stay on slide');
 assert.equal(JSON.parse(expanded.text).overflow,'expand-height');
 assert.equal(JSON.parse(expanded.text).paragraphs[0].runs[0].marks.bold,true);
 assert.equal(JSON.parse(expanded.text).paragraphs[1].runs[0].marks.italic,true);
 await page.evaluate(async()=>{
  const store=(await import('/src/core/editor.ts')).editorStore;
  const {validateCore}=await import('/src/core/contract.ts');
  validateCore(store.getSnapshot().doc);
 });
 console.log('PASS expand-height geometry, rich text and PPD validation');

 assert.deepEqual(errors,[],'No browser runtime errors');
 await page.close();
}catch(error){console.error('FAIL text-overflow browser regression:',error);process.exitCode=1;}
finally{await browser?.close();server.kill('SIGTERM');}
